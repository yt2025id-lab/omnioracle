// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MarketFactory.sol";
import "../src/OraclePipeline.sol";
import "../src/OmniResolver.sol";
import "../src/CrossChainRegistry.sol";
import "../src/AutoResolver.sol";
import "../src/interfaces/IMarketFactory.sol";

contract OmniResolverTest is Test {
    MarketFactory public factory;
    OraclePipeline public pipeline;
    OmniResolver public resolver;
    CrossChainRegistry public ccRegistry;
    AutoResolver public autoResolver;

    address owner = address(this);
    address creForwarder = address(0xC4E);
    address ccipRouter = address(0xCC10);
    address user1 = address(0x1001);

    function setUp() public {
        pipeline = new OraclePipeline();
        factory = new MarketFactory(creForwarder, address(pipeline));
        pipeline.setMarketFactory(address(factory));

        resolver = new OmniResolver(address(factory), address(pipeline), creForwarder);
        factory.setOmniResolver(address(resolver));

        ccRegistry = new CrossChainRegistry(address(factory), ccipRouter);
        autoResolver = new AutoResolver(address(factory));

        vm.deal(user1, 10 ether);
        vm.deal(creForwarder, 1 ether);
    }

    function _defaultConfig() internal pure returns (IMarketFactory.PipelineConfig memory) {
        return IMarketFactory.PipelineConfig({
            pipelineType: IMarketFactory.PipelineType.AI_GROUNDED,
            priceFeedAddress: address(0),
            priceThreshold: 0,
            isAbove: false,
            dataStreamId: bytes32(0),
            functionsScript: "",
            aiPromptHash: keccak256("test"),
            requiredAgreement: 1
        });
    }

    function _createMarket() internal returns (uint256) {
        vm.prank(user1);
        return factory.createMarket{value: 0.1 ether}(
            "Will ETH exceed $5000?",
            IMarketFactory.MarketCategory.CRYPTO,
            block.timestamp + 7 days,
            IMarketFactory.PipelineType.AI_GROUNDED,
            _defaultConfig()
        );
    }

    // === OmniResolver ===

    function testRequestResolution() public {
        uint256 id = _createMarket();
        vm.prank(user1);
        factory.requestResolution(id);

        resolver.requestResolution(id);
        // Should emit ResolutionTriggered event
    }

    function testResolverOnReport() public {
        uint256 id = _createMarket();
        vm.prank(user1);
        factory.requestResolution(id);

        bytes memory report = abi.encode(uint256(0), uint8(0), uint16(8500));

        vm.prank(creForwarder);
        resolver.onReport(report);

        IMarketFactory.Market memory m = factory.getMarket(id);
        assertEq(uint8(m.status), uint8(IMarketFactory.MarketStatus.RESOLVED));
        assertEq(uint8(m.resolvedOutcome), uint8(IMarketFactory.Outcome.YES));
        assertEq(m.confidence, 8500);
    }

    function testResolverOnReportNotForwarder() public {
        bytes memory report = abi.encode(uint256(0), uint8(0), uint16(8500));
        vm.prank(user1);
        vm.expectRevert("Only CRE Forwarder");
        resolver.onReport(report);
    }

    function testResolverOnReportNO() public {
        uint256 id = _createMarket();
        vm.prank(user1);
        factory.requestResolution(id);

        bytes memory report = abi.encode(uint256(0), uint8(1), uint16(7500)); // NO

        vm.prank(creForwarder);
        resolver.onReport(report);

        IMarketFactory.Market memory m = factory.getMarket(id);
        assertEq(uint8(m.resolvedOutcome), uint8(IMarketFactory.Outcome.NO));
    }

    // === Pipeline Config ===

    function testPipelineConfigPriceFeed() public {
        IMarketFactory.PipelineConfig memory cfg = IMarketFactory.PipelineConfig({
            pipelineType: IMarketFactory.PipelineType.PRICE_FEED,
            priceFeedAddress: address(0xF33D),
            priceThreshold: 5000e8,
            isAbove: true,
            dataStreamId: bytes32(0),
            functionsScript: "",
            aiPromptHash: bytes32(0),
            requiredAgreement: 1
        });

        vm.prank(user1);
        factory.createMarket{value: 0.01 ether}(
            "Price feed test",
            IMarketFactory.MarketCategory.CRYPTO,
            block.timestamp + 2 days,
            IMarketFactory.PipelineType.PRICE_FEED,
            cfg
        );

        IMarketFactory.PipelineConfig memory stored = pipeline.getPipelineConfig(0);
        assertEq(stored.priceFeedAddress, address(0xF33D));
        assertEq(stored.priceThreshold, 5000e8);
    }

    function testPipelineNotConfigured() public {
        vm.expectRevert("Not configured");
        pipeline.getPipelineConfig(999);
    }

    function testPipelineOnlyFactory() public {
        vm.prank(user1);
        vm.expectRevert("Only MarketFactory");
        pipeline.setPipelineConfig(0, _defaultConfig());
    }

    // === CrossChainRegistry ===

    function testMirrorMarket() public {
        uint256 id = _createMarket();
        uint64 ethSepoliaSelector = 16015286601757825753;

        ccRegistry.mirrorMarket(id, ethSepoliaSelector);

        assertTrue(ccRegistry.isMirrored(id, ethSepoliaSelector));
        assertEq(ccRegistry.getMirroredCount(ethSepoliaSelector), 1);
        assertEq(ccRegistry.totalMirrored(), 1);
    }

    function testMirrorMarketAlreadyMirrored() public {
        uint256 id = _createMarket();
        uint64 selector = 16015286601757825753;

        ccRegistry.mirrorMarket(id, selector);

        vm.expectRevert("Already mirrored");
        ccRegistry.mirrorMarket(id, selector);
    }

    function testMirrorMarketNotOpen() public {
        uint256 id = _createMarket();
        factory.resolveMarket(id, IMarketFactory.Outcome.YES, 9000);

        vm.expectRevert("Not open");
        ccRegistry.mirrorMarket(id, 16015286601757825753);
    }

    function testReceiveCrossChainMarket() public {
        vm.prank(ccipRouter);
        ccRegistry.receiveCrossChainMarket(
            42,
            16015286601757825753,
            "Cross-chain question?",
            1,
            block.timestamp + 3 days
        );

        assertEq(ccRegistry.getIncomingMarketsCount(), 1);
        CrossChainRegistry.MirroredMarket memory m = ccRegistry.getIncomingMarket(0);
        assertEq(m.marketId, 42);
        assertTrue(m.isActive);
    }

    // === AutoResolver ===

    function testAutoResolverCheckUpkeepNoMarkets() public {
        (bool needed,) = autoResolver.checkUpkeep("");
        assertFalse(needed);
    }

    function testAutoResolverCheckUpkeepNotExpired() public {
        _createMarket();
        (bool needed,) = autoResolver.checkUpkeep("");
        assertFalse(needed);
    }

    function testAutoResolverCheckUpkeepExpired() public {
        _createMarket();
        vm.warp(block.timestamp + 8 days);

        (bool needed, bytes memory data) = autoResolver.checkUpkeep("");
        assertTrue(needed);
        uint256 marketId = abi.decode(data, (uint256));
        assertEq(marketId, 0);
    }

    function testAutoResolverPerformUpkeep() public {
        _createMarket();
        vm.warp(block.timestamp + 8 days);

        autoResolver.performUpkeep(abi.encode(uint256(0)));
        // Should emit AutoResolutionTriggered
    }

    function testAutoResolverPerformUpkeepNotExpired() public {
        _createMarket();

        vm.expectRevert("Not past deadline");
        autoResolver.performUpkeep(abi.encode(uint256(0)));
    }
}
