// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MultiEscrow.sol";

contract MultiEscrowTest is Test {
    MultiEscrow escrow;
    address creator = address(0x1);
    address worker = address(0x2);
    address oracle = address(0x3);
    address admin = address(0x4);

    function setUp() public {
        vm.deal(creator, 10 ether);
        vm.prank(creator);
        // Deploy escrow native tBNB bernilai 1 ether dengan deadline 24 jam
        escrow = new MultiEscrow{value: 1 ether}(address(0), 1 ether, oracle, admin, 24);
    }

    // 1. Skenario AI Setuju (Eligible) -> Dana langsung cair ke worker
    function test_AISetuju_DanaCairKeWorker() public {
        vm.prank(worker);
        escrow.submitWork("https://github.com/proof/task1");

        vm.prank(oracle);
        escrow.fulfillVerification(true, false, 95, "Bukti valid");

        assertEq(uint(escrow.status()), uint(MultiEscrow.Status.Selesai));
        assertEq(worker.balance, 1 ether);
    }

    // 2. Skenario AI Tolak (Not Eligible) -> Brankas dibuka kembali
    function test_AITolak_StatusKembaliDibuka() public {
        vm.prank(worker);
        escrow.submitWork("https://github.com/proof/task1");

        vm.prank(oracle);
        escrow.fulfillVerification(false, false, 90, "Bukti tidak lengkap");

        assertEq(uint(escrow.status()), uint(MultiEscrow.Status.Dibuka));
        assertEq(escrow.worker(), address(0));
    }

    // 3. Skenario AI Ragu (butuhManusia = true) -> Masuk status Sengketa
    function test_AIRagu_MasukStatusSengketa() public {
        vm.prank(worker);
        escrow.submitWork("https://github.com/proof/task1");

        vm.prank(oracle);
        escrow.fulfillVerification(false, true, 65, "Bukti buram, butuh pengecekan manual");

        assertEq(uint(escrow.status()), uint(MultiEscrow.Status.Sengketa));
        assertEq(escrow.lastConfidenceScore(), 65);
    }

    // 4. Skenario Deadline Lewat -> Creator klaim dana kembali
    function test_DeadlineLewat_CreatorBisaRefund() public {
        // Lompat waktu 25 jam ke masa depan
        vm.warp(block.timestamp + 25 hours);

        vm.prank(creator);
        escrow.claimRefundExpired();

        assertEq(uint(escrow.status()), uint(MultiEscrow.Status.Dibatalkan));
        assertEq(creator.balance, 10 ether);
    }
}
