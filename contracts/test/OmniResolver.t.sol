// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MarketFactory.sol";
import "../src/OraclePipeline.sol";
import "../src/OmniResolver.sol";
import "../src/CrossChainRegistry.sol";
import "../src/AutoResolver.sol";
import "../src/interfaces/IMarketFactory.sol";

/// @dev Mock VRF Coordinator for testing — returns incrementing requestId
contract MockVRFCoordinator {
    uint256 private _nextRequestId = 1;

    struct RandomWordsRequest {
        bytes32 keyHash;
        uint256 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
        bytes extraArgs;
    }

    function requestRandomWords(RandomWordsRequest calldata) external returns (uint256 requestId) {
        return _nextRequestId++;
    }
}

/// @dev Mock CCIP Router for testing — returns zero fee, emits nothing
contract MockCCIPRouter {
    bytes32 public constant MOCK_MESSAGE_ID = bytes32(uint256(0xCC10CC10));

    function getFee(uint64, Client.EVM2AnyMessage calldata) external pure returns (uint256) {
        return 0;
    }

    function ccipSend(uint64, Client.EVM2AnyMessage calldata) external payable returns (bytes32) {
        return MOCK_MESSAGE_ID;
    }
}

contract OmniResolverTest is Test {
    MarketFactory public factory;
    OraclePipeline public pipeline;
    OmniResolver public resolver;
    CrossChainRegistry public ccRegistry;
    AutoResolver public autoResolver;
    MockCCIPRouter public mockRouter;

    address owner = address(this);
    address creForwarder = address(0xC4E);
    address user1 = address(0x1001);
    address destReceiver = address(0xBEEF);

    function setUp() public {
        pipeline = new OraclePipeline();
        factory = new MarketFactory(creForwarder, address(pipeline));
        pipeline.setMarketFactory(address(factory));

        resolver = new OmniResolver(address(factory), address(pipeline), creForwarder);
        factory.setOmniResolver(address(resolver));

        mockRouter = new MockCCIPRouter();
        ccRegistry = new CrossChainRegistry(address(factory), address(mockRouter));
        autoResolver = new AutoResolver(address(factory));

        vm.deal(user1, 10 ether);
        vm.deal(creForwarder, 1 ether);
        vm.deal(address(this), 1 ether);
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

    // === CrossChainRegistry (Chainlink CCIP) ===

    function testMirrorMarket() public {
        uint256 id = _createMarket();
        uint64 ethSepoliaSelector = 16015286601757825753;

        // mirrorMarket now calls real CCIP via MockCCIPRouter (fee=0)
        ccRegistry.mirrorMarket{value: 0}(id, ethSepoliaSelector, destReceiver);

        assertTrue(ccRegistry.isMirrored(id, ethSepoliaSelector));
        assertEq(ccRegistry.getMirroredCount(ethSepoliaSelector), 1);
        assertEq(ccRegistry.totalMirrored(), 1);
    }

    function testMirrorMarketAlreadyMirrored() public {
        uint256 id = _createMarket();
        uint64 selector = 16015286601757825753;

        ccRegistry.mirrorMarket{value: 0}(id, selector, destReceiver);

        vm.expectRevert(
            abi.encodeWithSelector(CrossChainRegistry.MarketAlreadyMirrored.selector, id, selector)
        );
        ccRegistry.mirrorMarket{value: 0}(id, selector, destReceiver);
    }

    function testMirrorMarketNotOpen() public {
        uint256 id = _createMarket();
        factory.resolveMarket(id, IMarketFactory.Outcome.YES, 9000);

        vm.expectRevert("Market not open");
        ccRegistry.mirrorMarket{value: 0}(id, 16015286601757825753, destReceiver);
    }

    function testCCIPReceive() public {
        uint256 marketId = 42;
        uint64 sourceChain = 16015286601757825753;
        string memory question = "Cross-chain question?";
        uint8 pipelineType = 1;
        uint256 deadline = block.timestamp + 3 days;

        // Build the CCIP Any2EVMMessage that the router would deliver
        Client.Any2EVMMessage memory message = Client.Any2EVMMessage({
            messageId: bytes32(uint256(0xDEAD)),
            sourceChainSelector: sourceChain,
            sender: abi.encode(destReceiver),
            data: abi.encode(marketId, question, pipelineType, deadline),
            tokenAmounts: new Client.EVMTokenAmount[](0)
        });

        // Only the CCIP router can call ccipReceive
        vm.prank(address(mockRouter));
        ccRegistry.ccipReceive(message);

        assertEq(ccRegistry.getIncomingMarketsCount(), 1);
        CrossChainRegistry.MirroredMarket memory m = ccRegistry.getIncomingMarket(0);
        assertEq(m.marketId, marketId);
        assertEq(m.sourceChainSelector, sourceChain);
        assertTrue(m.isActive);
    }

    function testCCIPReceiveOnlyRouter() public {
        Client.Any2EVMMessage memory message = Client.Any2EVMMessage({
            messageId: bytes32(uint256(0xDEAD)),
            sourceChainSelector: 1,
            sender: abi.encode(destReceiver),
            data: abi.encode(uint256(1), "test?", uint8(0), block.timestamp + 1 days),
            tokenAmounts: new Client.EVMTokenAmount[](0)
        });

        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(CrossChainRegistry.NotCCIPRouter.selector, user1)
        );
        ccRegistry.ccipReceive(message);
    }

    function testEstimateFee() public {
        uint256 id = _createMarket();
        uint256 fee = ccRegistry.estimateFee(id, 16015286601757825753, destReceiver);
        assertEq(fee, 0); // MockCCIPRouter returns 0 fee
    }

    // === VRF v2.5 — Featured Market ===

    function testVRFConfigSet() public {
        address mockCoordinator = address(0xAF01);
        bytes32 mockKeyHash = bytes32(uint256(0xABCD));
        uint256 subId = 42;

        factory.setVRFConfig(mockCoordinator, subId, mockKeyHash);

        assertEq(address(factory.vrfCoordinator()), mockCoordinator);
        assertEq(factory.vrfSubscriptionId(), subId);
        assertEq(factory.vrfKeyHash(), mockKeyHash);
    }

    function testVRFConfigOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        factory.setVRFConfig(address(0x1), 1, bytes32(0));
    }

    function testFulfillRandomWordsSelectsCorrectly() public {
        // Create 3 markets, use VRF to pick featured
        uint256 id0 = _createMarket();
        uint256 id1 = _createMarket();
        uint256 id2 = _createMarket();

        // Deploy mock VRF coordinator
        MockVRFCoordinator mockVRF = new MockVRFCoordinator();
        factory.setVRFConfig(address(mockVRF), 1, bytes32(uint256(0xDEAD)));

        uint256[] memory candidates = new uint256[](3);
        candidates[0] = id0;
        candidates[1] = id1;
        candidates[2] = id2;

        uint256 requestId = factory.requestFeaturedMarket(candidates);

        // Simulate VRF fulfillment: randomness=5 → index = 5 % 3 = 2 → id2
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 5;
        vm.prank(address(mockVRF));
        factory.fulfillRandomWords(requestId, randomWords);

        assertEq(factory.featuredMarketId(), id2);
    }

    function testFulfillRandomWordsOnlyCoordinator() public {
        MockVRFCoordinator mockVRF = new MockVRFCoordinator();
        factory.setVRFConfig(address(mockVRF), 1, bytes32(0));

        uint256[] memory rw = new uint256[](1);
        rw[0] = 0;

        vm.prank(user1);
        vm.expectRevert("Only VRF Coordinator");
        factory.fulfillRandomWords(0, rw);
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
