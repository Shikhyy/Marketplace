// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {CreatorHub} from "../src/CreatorHub.sol";

contract DeployHub is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        address usdcSepolia = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
        CreatorHub hub = new CreatorHub(usdcSepolia);
        console.log("CreatorHub deployed to:", address(hub));

        vm.stopBroadcast();
    }
}
