// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/OraclePipeline.sol";
import "../src/MarketFactory.sol";
import "../src/OmniResolver.sol";
import "../src/CrossChainRegistry.sol";
import "../src/AutoResolver.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address creForwarder = 0x82300bd7c3958625581cc2F77bC6464dcEcDF3e5;
        address ccipRouter = 0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93;

        vm.startBroadcast(deployerKey);

        // 1. Deploy OraclePipeline
        OraclePipeline pipeline = new OraclePipeline();
        console.log("OraclePipeline:", address(pipeline));

        // 2. Deploy MarketFactory
        MarketFactory factory = new MarketFactory(creForwarder, address(pipeline));
        console.log("MarketFactory:", address(factory));

        // 3. Link pipeline to factory
        pipeline.setMarketFactory(address(factory));

        // 4. Deploy OmniResolver
        OmniResolver resolver = new OmniResolver(address(factory), address(pipeline), creForwarder);
        console.log("OmniResolver:", address(resolver));

        // 5. Link resolver to factory
        factory.setOmniResolver(address(resolver));

        // 6. Deploy CrossChainRegistry
        CrossChainRegistry ccRegistry = new CrossChainRegistry(address(factory), ccipRouter);
        console.log("CrossChainRegistry:", address(ccRegistry));

        // 7. Deploy AutoResolver
        AutoResolver autoResolver = new AutoResolver(address(factory));
        console.log("AutoResolver:", address(autoResolver));

        vm.stopBroadcast();
    }
}
