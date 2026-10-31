// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MultiEscrow.sol";

/// @title DeployEscrow
/// @notice Script deployment otomatis MultiEscrow ke BSC Testnet menggunakan Foundry
contract DeployEscrow is Script {
    function run() external returns (MultiEscrow escrow) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address oracleAddress = vm.envAddress("ORACLE_ADDRESS");
        address adminAddress = vm.envAddress("ADMIN_ADDRESS");

        // Konfigurasi Default: 0.001 tBNB native (disesuaikan agar cukup dengan saldo faucet), batas waktu 24 jam
        address tokenAddress = address(0);
        uint256 rewardAmount = 0.001 ether;
        uint256 deadlineJam = 24;

        vm.startBroadcast(deployerPrivateKey);

        escrow = new MultiEscrow{value: rewardAmount}(
            tokenAddress,
            rewardAmount,
            oracleAddress,
            adminAddress,
            deadlineJam
        );

        vm.stopBroadcast();
    }
}
