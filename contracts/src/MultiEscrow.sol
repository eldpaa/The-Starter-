// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Antarmuka standar ERC-20
interface IERC20 {
    function transfer(address to, uint256 val) external returns (bool);
    function transferFrom(address from, address to, uint256 val) external returns (bool);
}

/// @title SafeTransferLib
/// @notice Menangani transfer koin ERC-20 non-standar (seperti USDT) tanpa return boolean
library SafeTransferLib {
    function safeTransfer(address token, address to, uint256 val) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, val)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "TransferERC20Gagal");
    }

    function safeTransferFrom(address token, address from, address to, uint256 val) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, val)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "TransferFromERC20Gagal");
    }
}

/// @title MultiEscrow
/// @notice Kontrak penampungan dana aman dual-currency dengan integrasi Juri AI dan perlindungan sengketa
/// @dev Mendukung koin native (address(0)) dan token ERC-20
contract MultiEscrow {
    using SafeTransferLib for address;

    enum Status { Dibuka, Disubmit, Sengketa, Selesai, Dibatalkan }

    Status public status;
    address public immutable creator;
    address public immutable admin;
    address public immutable token;
    uint256 public immutable rewardAmount;
    uint256 public immutable deadline;
    address public oracle;
    
    address public worker;
    string public proofURI;
    uint8 public lastConfidenceScore;

    // Event lengkap untuk indexing backend Hono
    event WorkSubmitted(address indexed worker, string proofURI);
    event VerificationCompleted(bool eligible, bool butuhManusia, uint8 confidenceScore, string alasan);
    event DisputeTriggered(uint8 confidenceScore, string alasan);
    event DisputeResolved(bool cairkanKeWorker, address indexed penerima);
    event RewardReleased(address indexed to, uint256 amount);
    event BountyCancelled();
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    modifier hanyaCreator() {
        require(msg.sender == creator, "BukanCreator");
        _;
    }

    modifier hanyaAdmin() {
        require(msg.sender == admin, "BukanAdmin");
        _;
    }

    modifier hanyaOracle() {
        require(msg.sender == oracle, "BukanOracle");
        _;
    }

    /// @notice Inisialisasi brankas sayembara baru
    /// @dev Mengunci koin native lewat msg.value atau menarik ERC-20 via transferFrom
    /// @param _token Alamat token (address(0) untuk tBNB native)
    /// @param _amount Jumlah nominal hadiah
    /// @param _oracle Alamat publik bot AI verifikator
    /// @param _admin Alamat juri independen penengah sengketa
    /// @param _deadlineJam Batas waktu sayembara dalam satuan jam dari sekarang
    constructor(
        address _token,
        uint256 _amount,
        address _oracle,
        address _admin,
        uint256 _deadlineJam
    ) payable {
        require(_admin != address(0), "AdminTidakBolehNol");
        require(_oracle != address(0), "OracleTidakBolehNol");
        require(_deadlineJam > 0, "DeadlineHarusValid");

        creator = msg.sender;
        admin = _admin;
        token = _token;
        rewardAmount = _amount;
        oracle = _oracle;
        deadline = block.timestamp + (_deadlineJam * 1 hours);
        status = Status.Dibuka;

        if (_token == address(0)) {
            require(msg.value == _amount, "BNBKurang");
        } else {
            require(msg.value == 0, "DilarangKirimBNB");
            _token.safeTransferFrom(msg.sender, address(this), _amount);
        }
    }

    /// @notice Creator membatalkan sayembara sebelum ada pengumpulan tugas
    /// @dev Hanya bisa dipanggil saat status masih Dibuka
    function cancelBounty() external hanyaCreator {
        require(status == Status.Dibuka, "BukanDibuka");
        status = Status.Dibatalkan;
        _cairkanDana(creator);
        emit BountyCancelled();
    }

    /// @notice Creator menarik kembali dana jika batas waktu kedaluwarsa dan tidak ada solusi
    /// @dev Mengatasi kasus pekerja tidak submit atau bot AI mati melewati deadline
    function claimRefundExpired() external hanyaCreator {
        require(block.timestamp > deadline, "BelumKedaluwarsa");
        require(status == Status.Dibuka || status == Status.Disubmit, "StatusBukanDibukaAtauDisubmit");
        status = Status.Dibatalkan;
        _cairkanDana(creator);
        emit BountyCancelled();
    }

    /// @notice Pekerja mengumpulkan bukti hasil kerja
    /// @dev Hanya bisa dilakukan sebelum deadline berakhir
    /// @param _proofURI Link berkas bukti kerjaan (IPFS / GitHub)
    function submitWork(string calldata _proofURI) external {
        require(status == Status.Dibuka, "BukanDibuka");
        require(block.timestamp <= deadline, "DeadlineLewat");
        worker = msg.sender;
        proofURI = _proofURI;
        status = Status.Disubmit;
        emit WorkSubmitted(msg.sender, _proofURI);
    }

    /// @notice Bot Juri AI memvonis hasil kerja peserta
    /// @dev Memancarkan event lengkap beserta confidence score untuk dibaca UI & Indexer
    /// @param eligible Apakah tugas memenuhi kriteria
    /// @param butuhManusia Apakah AI ragu dan butuh eskalasi sengketa
    /// @param confidenceScore Nilai keyakinan AI (0 - 100)
    /// @param alasan Catatan teknis penilaian dari AI
    function fulfillVerification(
        bool eligible,
        bool butuhManusia,
        uint8 confidenceScore,
        string calldata alasan
    ) external hanyaOracle {
        require(status == Status.Disubmit, "BukanDisubmit");
        lastConfidenceScore = confidenceScore;

        emit VerificationCompleted(eligible, butuhManusia, confidenceScore, alasan);

        if (butuhManusia) {
            status = Status.Sengketa;
            emit DisputeTriggered(confidenceScore, alasan);
            return;
        }

        if (eligible) {
            status = Status.Selesai;
            _cairkanDana(worker);
        } else {
            status = Status.Dibuka;
            worker = address(0);
            proofURI = "";
        }
    }

    /// @notice Admin netral memutuskan sengketa
    /// @param cairkanKeWorker True jika hadiah diberikan ke pekerja, false jika dikembalikan ke creator
    function resolveDispute(bool cairkanKeWorker) external hanyaAdmin {
        require(status == Status.Sengketa, "BukanSengketa");
        status = Status.Selesai;
        address penerima = cairkanKeWorker ? worker : creator;
        _cairkanDana(penerima);
        emit DisputeResolved(cairkanKeWorker, penerima);
    }

    /// @notice Memperbarui alamat bot AI Oracle jika private key bot diganti
    /// @param newOracle Alamat oracle pengganti yang baru
    function updateOracle(address newOracle) external hanyaAdmin {
        require(newOracle != address(0), "OracleBaruTidakBolehNol");
        address old = oracle;
        oracle = newOracle;
        emit OracleUpdated(old, newOracle);
    }

    /// @dev Fungsi internal pengiriman dana terpadu
    function _cairkanDana(address penerima) internal {
        if (token == address(0)) {
            (bool sukses, ) = penerima.call{value: rewardAmount}("");
            require(sukses, "TransferBNBGagal");
        } else {
            token.safeTransfer(penerima, rewardAmount);
        }
        emit RewardReleased(penerima, rewardAmount);
    }
}
