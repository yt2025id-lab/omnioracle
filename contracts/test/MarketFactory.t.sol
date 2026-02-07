// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MarketFactory.sol";
import "../src/OraclePipeline.sol";
import "../src/interfaces/IMarketFactory.sol";

contract MarketFactoryTest is Test {
    MarketFactory public factory;
    OraclePipeline public pipeline;

    address owner = address(this);
    address creForwarder = address(0xC4E);
    address user1 = address(0x1001);
    address user2 = address(0x1002);
    address user3 = address(0x1003);

    function setUp() public {
        pipeline = new OraclePipeline();
        factory = new MarketFactory(creForwarder, address(pipeline));
        pipeline.setMarketFactory(address(factory));

        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);
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
            aiPromptHash: keccak256("test prompt"),
            requiredAgreement: 1
        });
    }

    function _priceFeedConfig() internal pure returns (IMarketFactory.PipelineConfig memory) {
        return IMarketFactory.PipelineConfig({
            pipelineType: IMarketFactory.PipelineType.PRICE_FEED,
            priceFeedAddress: address(0xF33D),
            priceThreshold: 5000e8,
            isAbove: true,
            dataStreamId: bytes32(0),
            functionsScript: "",
            aiPromptHash: bytes32(0),
            requiredAgreement: 1
        });
    }

    function _compositeConfig() internal pure returns (IMarketFactory.PipelineConfig memory) {
        return IMarketFactory.PipelineConfig({
            pipelineType: IMarketFactory.PipelineType.COMPOSITE,
            priceFeedAddress: address(0xF33D),
            priceThreshold: 3000e8,
            isAbove: true,
            dataStreamId: bytes32(0),
            functionsScript: "",
            aiPromptHash: keccak256("composite prompt"),
            requiredAgreement: 2
        });
    }

    function _createMarket() internal returns (uint256) {
        vm.prank(user1);
        return factory.createMarket{value: 0.1 ether}(
            "Will ETH exceed $5000 by March 2026?",
            IMarketFactory.MarketCategory.CRYPTO,
            block.timestamp + 7 days,
            IMarketFactory.PipelineType.AI_GROUNDED,
            _defaultConfig()
        );
    }

    // === Market Creation ===

    function testCreateMarketAIGrounded() public {
        uint256 id = _createMarket();
        assertEq(id, 0);
        assertEq(factory.nextMarketId(), 1);

        IMarketFactory.Market memory m = factory.getMarket(id);
        assertEq(m.creator, user1);
        assertEq(uint8(m.pipelineType), uint8(IMarketFactory.PipelineType.AI_GROUNDED));
        assertEq(uint8(m.status), uint8(IMarketFactory.MarketStatus.OPEN));
        assertEq(m.totalPool, 0.1 ether);
    }

    function testCreateMarketPriceFeed() public {
        vm.prank(user1);
        uint256 id = factory.createMarket{value: 0.01 ether}(
            "Will BTC exceed $100k?",
            IMarketFactory.MarketCategory.CRYPTO,
            block.timestamp + 1 days + 1,
            IMarketFactory.PipelineType.PRICE_FEED,
            _priceFeedConfig()
        );

        IMarketFactory.PipelineConfig memory cfg = pipeline.getPipelineConfig(id);
        assertEq(uint8(cfg.pipelineType), uint8(IMarketFactory.PipelineType.PRICE_FEED));
        assertEq(cfg.priceFeedAddress, address(0xF33D));
        assertEq(cfg.priceThreshold, 5000e8);
        assertTrue(cfg.isAbove);
    }

    function testCreateMarketComposite() public {
        vm.prank(user1);
        uint256 id = factory.createMarket{value: 0.02 ether}(
            "Will ETH hit $3000?",
            IMarketFactory.MarketCategory.CRYPTO,
            block.timestamp + 2 days,
            IMarketFactory.PipelineType.COMPOSITE,
            _compositeConfig()
        );

        IMarketFactory.PipelineConfig memory cfg = pipeline.getPipelineConfig(id);
        assertEq(uint8(cfg.pipelineType), uint8(IMarketFactory.PipelineType.COMPOSITE));
        assertEq(cfg.requiredAgreement, 2);
    }

    function testCreateMarketEmptyQuestion() public {
        vm.prank(user1);
        vm.expectRevert("Empty question");
        factory.createMarket{value: 0.01 ether}(
            "",
            IMarketFactory.MarketCategory.CRYPTO,
            block.timestamp + 2 days,
            IMarketFactory.PipelineType.AI_GROUNDED,
            _defaultConfig()
        );
    }

    function testCreateMarketDeadlineTooSoon() public {
        vm.prank(user1);
        vm.expectRevert("Deadline too soon");
        factory.createMarket{value: 0.01 ether}(
            "Test?",
            IMarketFactory.MarketCategory.CUSTOM,
            block.timestamp + 30 minutes,
            IMarketFactory.PipelineType.AI_GROUNDED,
            _defaultConfig()
        );
    }

    function testCreateMarketInsufficientSeed() public {
        vm.prank(user1);
        vm.expectRevert("Insufficient seed");
        factory.createMarket{value: 0.005 ether}(
            "Test?",
            IMarketFactory.MarketCategory.CUSTOM,
            block.timestamp + 2 days,
            IMarketFactory.PipelineType.AI_GROUNDED,
            _defaultConfig()
        );
    }

    // === Predictions ===

    function testPredict() public {
        uint256 id = _createMarket();

        vm.prank(user2);
        factory.predict{value: 0.5 ether}(id, true);

        vm.prank(user3);
        factory.predict{value: 0.3 ether}(id, false);

        IMarketFactory.Market memory m = factory.getMarket(id);
        assertEq(m.yesPool, 0.05 ether + 0.5 ether); // half seed + user2
        assertEq(m.noPool, 0.05 ether + 0.3 ether);   // half seed + user3
        assertEq(m.totalPool, 0.1 ether + 0.5 ether + 0.3 ether);
    }

    function testPredictMinBet() public {
        uint256 id = _createMarket();
        vm.prank(user2);
        vm.expectRevert("Bet too small");
        factory.predict{value: 0.0001 ether}(id, true);
    }

    function testPredictNotOpen() public {
        uint256 id = _createMarket();

        // Request resolution
        vm.prank(user1);
        factory.requestResolution(id);

        vm.prank(user2);
        vm.expectRevert("Market not open");
        factory.predict{value: 0.1 ether}(id, true);
    }

    function testPredictAfterDeadline() public {
        uint256 id = _createMarket();
        vm.warp(block.timestamp + 8 days);

        vm.prank(user2);
        vm.expectRevert("Market expired");
        factory.predict{value: 0.1 ether}(id, true);
    }

    // === Resolution ===

    function testRequestResolution() public {
        uint256 id = _createMarket();
        vm.prank(user1);
        factory.requestResolution(id);

        IMarketFactory.Market memory m = factory.getMarket(id);
        assertEq(uint8(m.status), uint8(IMarketFactory.MarketStatus.RESOLUTION_REQUESTED));
    }

    function testResolveMarketViaAuthorized() public {
        uint256 id = _createMarket();
        vm.prank(user1);
        factory.requestResolution(id);

        // Owner resolves
        factory.resolveMarket(id, IMarketFactory.Outcome.YES, 8500);

        IMarketFactory.Market memory m = factory.getMarket(id);
        assertEq(uint8(m.status), uint8(IMarketFactory.MarketStatus.RESOLVED));
        assertEq(uint8(m.resolvedOutcome), uint8(IMarketFactory.Outcome.YES));
        assertEq(m.confidence, 8500);
    }

    function testResolveMarketLowConfidence() public {
        uint256 id = _createMarket();
        vm.prank(user1);
        factory.requestResolution(id);

        vm.expectRevert("Confidence too low");
        factory.resolveMarket(id, IMarketFactory.Outcome.YES, 4999);
    }

    // === onReport ===

    function testOnReportCreateMarket() public {
        bytes memory payload = abi.encode(
            "CRE market: Will LINK hit $50?",
            uint8(0), // CRYPTO
            block.timestamp + 3 days,
            uint8(0), // PRICE_FEED
            address(0xF33D),
            int256(50e8),
            true,
            bytes32(0)
        );
        bytes memory report = abi.encodePacked(uint8(0x00), payload);

        vm.prank(creForwarder);
        factory.onReport(report);

        assertEq(factory.nextMarketId(), 1);
        IMarketFactory.Market memory m = factory.getMarket(0);
        assertEq(uint8(m.pipelineType), uint8(IMarketFactory.PipelineType.PRICE_FEED));
    }

    function testOnReportResolveMarket() public {
        uint256 id = _createMarket();
        vm.prank(user1);
        factory.requestResolution(id);

        bytes memory payload = abi.encode(uint256(0), uint8(0), uint16(9000)); // YES, 90%
        bytes memory report = abi.encodePacked(uint8(0x01), payload);

        vm.prank(creForwarder);
        factory.onReport(report);

        IMarketFactory.Market memory m = factory.getMarket(id);
        assertEq(uint8(m.status), uint8(IMarketFactory.MarketStatus.RESOLVED));
        assertEq(uint8(m.resolvedOutcome), uint8(IMarketFactory.Outcome.YES));
    }

    function testOnReportNotForwarder() public {
        bytes memory report = abi.encodePacked(uint8(0x00), bytes("test"));
        vm.prank(user1);
        vm.expectRevert("Only CRE Forwarder");
        factory.onReport(report);
    }

    // === Claims ===

    function testClaim() public {
        uint256 id = _createMarket();

        vm.prank(user2);
        factory.predict{value: 1 ether}(id, true);

        vm.prank(user3);
        factory.predict{value: 0.5 ether}(id, false);

        // Resolve as YES
        vm.prank(user1);
        factory.requestResolution(id);
        factory.resolveMarket(id, IMarketFactory.Outcome.YES, 9000);

        // User2 claims (only winner on YES side besides seed)
        uint256 balBefore = user2.balance;
        vm.prank(user2);
        factory.claim(id);
        uint256 balAfter = user2.balance;

        assertTrue(balAfter > balBefore);
    }

    function testClaimDoubleClaim() public {
        uint256 id = _createMarket();

        vm.prank(user2);
        factory.predict{value: 1 ether}(id, true);

        factory.resolveMarket(id, IMarketFactory.Outcome.YES, 9000);

        vm.prank(user2);
        factory.claim(id);

        vm.prank(user2);
        vm.expectRevert("Already claimed");
        factory.claim(id);
    }

    function testClaimNoPosition() public {
        uint256 id = _createMarket();

        vm.prank(user2);
        factory.predict{value: 1 ether}(id, false); // bet NO

        factory.resolveMarket(id, IMarketFactory.Outcome.YES, 9000);

        vm.prank(user2);
        vm.expectRevert("No winning position");
        factory.claim(id);
    }

    function testClaimInvalidOutcomeRefund() public {
        uint256 id = _createMarket();

        vm.prank(user2);
        factory.predict{value: 1 ether}(id, true);

        // Resolve as INVALID
        factory.resolveMarket(id, IMarketFactory.Outcome.INVALID, 5000);

        uint256 balBefore = user2.balance;
        vm.prank(user2);
        factory.claim(id);
        uint256 balAfter = user2.balance;

        assertEq(balAfter - balBefore, 1 ether);
    }

    // === Disputes ===

    function testDisputeResolution() public {
        uint256 id = _createMarket();
        factory.resolveMarket(id, IMarketFactory.Outcome.YES, 8000);

        vm.prank(user2);
        factory.disputeResolution{value: 0.05 ether}(id);

        IMarketFactory.Market memory m = factory.getMarket(id);
        assertEq(uint8(m.status), uint8(IMarketFactory.MarketStatus.DISPUTED));
    }

    function testDisputeInsufficientBond() public {
        uint256 id = _createMarket();
        factory.resolveMarket(id, IMarketFactory.Outcome.YES, 8000);

        vm.prank(user2);
        vm.expectRevert("Insufficient bond");
        factory.disputeResolution{value: 0.01 ether}(id);
    }

    function testResolveDisputeSucceeded() public {
        uint256 id = _createMarket();
        factory.resolveMarket(id, IMarketFactory.Outcome.YES, 8000);

        vm.prank(user2);
        factory.disputeResolution{value: 0.05 ether}(id);

        uint256 balBefore = user2.balance;
        // Owner resolves dispute — changes outcome (dispute succeeds)
        factory.resolveDispute(id, IMarketFactory.Outcome.NO);
        uint256 balAfter = user2.balance;

        IMarketFactory.Market memory m = factory.getMarket(id);
        assertEq(uint8(m.resolvedOutcome), uint8(IMarketFactory.Outcome.NO));
        assertEq(balAfter - balBefore, 0.05 ether); // bond returned
    }

    function testResolveDisputeFailed() public {
        uint256 id = _createMarket();
        factory.resolveMarket(id, IMarketFactory.Outcome.YES, 8000);

        vm.prank(user2);
        factory.disputeResolution{value: 0.05 ether}(id);

        IMarketFactory.Market memory before = factory.getMarket(id);
        uint256 poolBefore = before.totalPool;

        // Owner resolves — keeps same outcome (dispute fails)
        factory.resolveDispute(id, IMarketFactory.Outcome.YES);

        IMarketFactory.Market memory m = factory.getMarket(id);
        assertEq(uint8(m.status), uint8(IMarketFactory.MarketStatus.RESOLVED));
        assertEq(m.totalPool, poolBefore + 0.05 ether); // bond forfeited to pool
    }

    // === Expiration ===

    function testExpireMarket() public {
        uint256 id = _createMarket();
        vm.warp(block.timestamp + 8 days + 1);

        factory.expireMarket(id);
        IMarketFactory.Market memory m = factory.getMarket(id);
        assertEq(uint8(m.status), uint8(IMarketFactory.MarketStatus.EXPIRED));
    }

    function testExpireMarketNotExpired() public {
        uint256 id = _createMarket();
        vm.expectRevert("Not expired yet");
        factory.expireMarket(id);
    }

    // === Featured Market ===

    function testSetFeaturedMarket() public {
        uint256 id = _createMarket();
        factory.setFeaturedMarket(id);
        assertEq(factory.featuredMarketId(), id);
    }

    // === Pipeline immutability ===

    function testPipelineImmutable() public {
        _createMarket();

        vm.prank(address(factory));
        vm.expectRevert("Already configured");
        pipeline.setPipelineConfig(0, _defaultConfig());
    }

    // === All categories ===

    function testAllCategories() public {
        for (uint8 i = 0; i < 6; i++) {
            vm.prank(user1);
            factory.createMarket{value: 0.01 ether}(
                "Test category market",
                IMarketFactory.MarketCategory(i),
                block.timestamp + 2 days,
                IMarketFactory.PipelineType.AI_GROUNDED,
                _defaultConfig()
            );
        }
        assertEq(factory.nextMarketId(), 6);
    }

    // === All pipeline types ===

    function testAllPipelineTypes() public {
        for (uint8 i = 0; i < 5; i++) {
            IMarketFactory.PipelineConfig memory cfg = _defaultConfig();
            cfg.pipelineType = IMarketFactory.PipelineType(i);

            vm.prank(user1);
            factory.createMarket{value: 0.01 ether}(
                "Test pipeline market",
                IMarketFactory.MarketCategory.CUSTOM,
                block.timestamp + 2 days,
                IMarketFactory.PipelineType(i),
                cfg
            );
        }
        assertEq(factory.nextMarketId(), 5);
    }
}
