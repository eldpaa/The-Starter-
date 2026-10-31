import { LLM } from "../config";

type Opsi = {
  instruksi: string; // peran + aturan main AI (system prompt)
  data: unknown;     // bahan yang dinilai — dikirim sebagai DATA, bukan perintah
  skema: object;     // JSON Schema: bentuk jawaban yang kita terima
  nama?: string;
};

export const tanyaAI = async <T>({ instruksi, data, skema, nama = "jawaban" }: Opsi): Promise<T> => {
  // Tambahkan instruksi skema JSON ke system prompt sebagai pengaman ganda
  const skemaHint = `\n\nWAJIB kembalikan JSON murni sesuai skema berikut (tanpa teks lain):\n${JSON.stringify(skema, null, 2)}`;

  const payload: Record<string, unknown> = {
    model: LLM.model,
    messages: [
      { role: "system", content: instruksi + skemaHint },
      { role: "user", content: JSON.stringify(data) },
    ],
    temperature: 0,
    response_format: { type: "json_schema", json_schema: { name: nama, strict: true, schema: skema } },
  };

  const isGoogle = LLM.baseUrl.includes("generativelanguage.googleapis.com");
  const url = isGoogle
    ? `${LLM.baseUrl}/chat/completions?key=${encodeURIComponent(LLM.apiKey)}`
    : `${LLM.baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${LLM.apiKey}`,
  };

  if (isGoogle) {
    headers["x-goog-api-key"] = LLM.apiKey;
  }

  let res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120_000),
  });

  // Fallback: jika json_schema ditolak (mis. Gemini versi lama), coba json_object
  if (!res.ok && res.status === 400) {
    console.log("⚠️ json_schema ditolak, fallback ke json_object...");
    payload.response_format = { type: "json_object" };
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120_000),
    });
  }

  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);

  const rawResponse = await res.text();
  let hasil: any;
  try {
    hasil = JSON.parse(rawResponse);
  } catch {
    throw new Error(`Respon server LLM bukan JSON murni (${res.status}): ${rawResponse.slice(0, 300)}`);
  }

  const pilihan = hasil.choices?.[0];
  if (pilihan?.message?.refusal) throw new Error(`LLM menolak: ${pilihan.message.refusal}`);
  if (pilihan?.finish_reason === "length") throw new Error("Jawaban terpotong — perpendek input");

  let teks = (pilihan?.message?.content ?? "").trim();

  // Bersihkan format blok markdown ```json ... ``` jika LLM membungkus jawabannya
  if (teks.startsWith("```")) {
    teks = teks.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }

  // Ekstrak objek JSON murni { ... } jika ada teks di luar kurung kurawal
  const jsonMatch = teks.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    teks = jsonMatch[0];
  }

  try {
    return JSON.parse(teks) as T;
  } catch (err: any) {
    throw new Error(`Gagal parse JSON dari LLM: ${err.message}. Konten mentah: "${teks}"`);
  }
};

export const ambilTeks = async (uriOrText: string, maksKarakter = 8000) => {
  if (!uriOrText) return null;
  const isUrl =
    uriOrText.startsWith("http://") ||
    uriOrText.startsWith("https://") ||
    uriOrText.startsWith("ipfs://");

  if (!isUrl) {
    return uriOrText.slice(0, maksKarakter);
  }

  const url = uriOrText.startsWith("ipfs://")
    ? `https://ipfs.io/ipfs/${uriOrText.slice(7)}`
    : uriOrText;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.text()).slice(0, maksKarakter);
  } catch {
    return null;
  }
};
