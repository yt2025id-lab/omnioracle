// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMarketFactory.sol";
import "./OraclePipeline.sol";

/// @title MarketFactory — Permissionless prediction market creation with composable oracle pipelines
/// @notice Anyone can create a market with a custom oracle pipeline. CRE resolves via onReport.
contract MarketFactory is IMarketFactory, Ownable, ReentrancyGuard {
    uint256 public constant MIN_SEED = 0.01 ether;
    uint256 public constant MIN_BET = 0.001 ether;
    uint256 public constant PLATFORM_FEE_BPS = 200; // 2%
    uint256 public constant DISPUTE_BOND = 0.05 ether;
    uint256 public constant MIN_CONFIDENCE = 5000; // 50%
    uint256 public constant MIN_DEADLINE_BUFFER = 1 hours;

    uint256 public nextMarketId;
    uint256 public totalFeesCollected;
    uint256 public featuredMarketId;

    address public creForwarder;
    address public omniResolver;
    OraclePipeline public oraclePipeline;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public userYesBets;
    mapping(uint256 => mapping(address => uint256)) public userNoBets;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    // Dispute tracking
    mapping(uint256 => address) public disputer;
    mapping(uint256 => uint256) public disputeBonds;

    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || msg.sender == creForwarder || msg.sender == omniResolver,
            "Not authorized"
        );
        _;
    }

    constructor(address _creForwarder, address _oraclePipeline) Ownable(msg.sender) {
        creForwarder = _creForwarder;
        oraclePipeline = OraclePipeline(_oraclePipeline);
    }

    function setOmniResolver(address _omniResolver) external onlyOwner {
        omniResolver = _omniResolver;
    }

    /// @notice Create a new prediction market with a custom oracle pipeline
    function createMarket(
        string calldata question,
        MarketCategory category,
        uint256 deadline,
        PipelineType pipelineType,
        PipelineConfig calldata pipelineConfig
    ) external payable returns (uint256) {
        require(bytes(question).length > 0, "Empty question");
        require(deadline > block.timestamp + MIN_DEADLINE_BUFFER, "Deadline too soon");
        require(msg.value >= MIN_SEED, "Insufficient seed");

        uint256 marketId = nextMarketId++;
        uint256 halfSeed = msg.value / 2;

        markets[marketId] = Market({
            creator: msg.sender,
            question: question,
            category: category,
            pipelineType: pipelineType,
            createdAt: block.timestamp,
            deadline: deadline,
            status: MarketStatus.OPEN,
            resolvedOutcome: Outcome.INVALID,
            yesPool: halfSeed,
            noPool: msg.value - halfSeed,
            totalPool: msg.value,
            confidence: 0,
            marketId: marketId
        });

        // Store pipeline config (immutable)
        oraclePipeline.setPipelineConfig(marketId, pipelineConfig);

        emit MarketCreated(marketId, question, pipelineType);
        return marketId;
    }

    /// @notice Place a YES or NO prediction
    function predict(uint256 marketId, bool isYes) external payable nonReentrant {
        Market storage m = markets[marketId];
        require(m.status == MarketStatus.OPEN, "Market not open");
        require(block.timestamp < m.deadline, "Market expired");
        require(msg.value >= MIN_BET, "Bet too small");

        if (isYes) {
            m.yesPool += msg.value;
            userYesBets[marketId][msg.sender] += msg.value;
        } else {
            m.noPool += msg.value;
            userNoBets[marketId][msg.sender] += msg.value;
        }
        m.totalPool += msg.value;

        emit PredictionPlaced(marketId, msg.sender, isYes, msg.value);
    }

    /// @notice Request resolution of a market (triggers CRE workflow)
    function requestResolution(uint256 marketId) external {
        Market storage m = markets[marketId];
        require(m.status == MarketStatus.OPEN, "Not open");
        m.status = MarketStatus.RESOLUTION_REQUESTED;
        emit ResolutionRequested(marketId, m.pipelineType);
    }

    /// @notice CRE Forwarder callback — handles market creation (0x00) and resolution (0x01)
    function onReport(bytes calldata report) external {
        require(msg.sender == creForwarder, "Only CRE Forwarder");

        uint8 action = uint8(report[0]);
        bytes calldata payload = report[1:];

        if (action == 0x00) {
            // Create market via CRE
            (
                string memory question,
                uint8 categoryRaw,
                uint256 deadline,
                uint8 pipelineTypeRaw,
                address priceFeedAddr,
                int256 priceThreshold,
                bool isAbove,
                bytes32 aiPromptHash
            ) = abi.decode(payload, (string, uint8, uint256, uint8, address, int256, bool, bytes32));

            MarketCategory category = MarketCategory(categoryRaw);
            PipelineType pipelineType = PipelineType(pipelineTypeRaw);

            uint256 marketId = nextMarketId++;
            markets[marketId] = Market({
                creator: msg.sender,
                question: question,
                category: category,
                pipelineType: pipelineType,
                createdAt: block.timestamp,
                deadline: deadline,
                status: MarketStatus.OPEN,
                resolvedOutcome: Outcome.INVALID,
                yesPool: 0,
                noPool: 0,
                totalPool: 0,
                confidence: 0,
                marketId: marketId
            });

            PipelineConfig memory config = PipelineConfig({
                pipelineType: pipelineType,
                priceFeedAddress: priceFeedAddr,
                priceThreshold: priceThreshold,
                isAbove: isAbove,
                dataStreamId: bytes32(0),
                functionsScript: "",
                aiPromptHash: aiPromptHash,
                requiredAgreement: 2
            });
            oraclePipeline.setPipelineConfig(marketId, config);

            emit MarketCreated(marketId, question, pipelineType);

        } else if (action == 0x01) {
            // Resolve market via CRE pipeline result
            (uint256 marketId, uint8 outcomeRaw, uint16 confidence) =
                abi.decode(payload, (uint256, uint8, uint16));

            Market storage m = markets[marketId];
            require(
                m.status == MarketStatus.RESOLUTION_REQUESTED || m.status == MarketStatus.RESOLVING,
                "Not awaiting resolution"
            );
            require(confidence >= MIN_CONFIDENCE, "Confidence too low");

            m.status = MarketStatus.RESOLVED;
            m.resolvedOutcome = Outcome(outcomeRaw);
            m.confidence = confidence;

            emit MarketResolved(marketId, Outcome(outcomeRaw), confidence);
        }
    }

    /// @notice Resolve market — callable by OmniResolver or authorized
    function resolveMarket(uint256 marketId, Outcome outcome, uint16 confidence) external onlyAuthorized {
        Market storage m = markets[marketId];
        require(
            m.status == MarketStatus.RESOLUTION_REQUESTED || m.status == MarketStatus.OPEN,
            "Cannot resolve"
        );
        require(confidence >= MIN_CONFIDENCE, "Confidence too low");

        m.status = MarketStatus.RESOLVED;
        m.resolvedOutcome = outcome;
        m.confidence = confidence;

        emit MarketResolved(marketId, outcome, confidence);
    }

    /// @notice Claim winnings from a resolved market
    function claim(uint256 marketId) external nonReentrant {
        Market storage m = markets[marketId];
        require(m.status == MarketStatus.RESOLVED, "Not resolved");
        require(!hasClaimed[marketId][msg.sender], "Already claimed");

        uint256 userBet;
        uint256 winningPool;
        uint256 losingPool;

        if (m.resolvedOutcome == Outcome.YES) {
            userBet = userYesBets[marketId][msg.sender];
            winningPool = m.yesPool;
            losingPool = m.noPool;
        } else if (m.resolvedOutcome == Outcome.NO) {
            userBet = userNoBets[marketId][msg.sender];
            winningPool = m.noPool;
            losingPool = m.yesPool;
        } else {
            // INVALID — refund proportionally
            uint256 totalUser = userYesBets[marketId][msg.sender] + userNoBets[marketId][msg.sender];
            require(totalUser > 0, "No position");
            hasClaimed[marketId][msg.sender] = true;
            (bool ok,) = payable(msg.sender).call{value: totalUser}("");
            require(ok, "Transfer failed");
            return;
        }

        require(userBet > 0, "No winning position");
        hasClaimed[marketId][msg.sender] = true;

        // Proportional payout from total pool minus fee
        uint256 fee = (m.totalPool * PLATFORM_FEE_BPS) / 10000;
        uint256 distributable = m.totalPool - fee;
        uint256 payout = (userBet * distributable) / winningPool;

        totalFeesCollected += (fee * userBet) / winningPool;

        (bool ok,) = payable(msg.sender).call{value: payout}("");
        require(ok, "Transfer failed");
    }

    /// @notice Dispute a resolved market
    function disputeResolution(uint256 marketId) external payable {
        Market storage m = markets[marketId];
        require(m.status == MarketStatus.RESOLVED, "Not resolved");
        require(msg.value >= DISPUTE_BOND, "Insufficient bond");
        require(disputer[marketId] == address(0), "Already disputed");

        m.status = MarketStatus.DISPUTED;
        disputer[marketId] = msg.sender;
        disputeBonds[marketId] = msg.value;

        emit DisputeOpened(marketId, msg.sender);
    }

    /// @notice Resolve a dispute — authorized only
    function resolveDispute(uint256 marketId, Outcome newOutcome) external onlyAuthorized {
        Market storage m = markets[marketId];
        require(m.status == MarketStatus.DISPUTED, "Not disputed");

        if (newOutcome != m.resolvedOutcome) {
            // Dispute succeeded — return bond, update outcome
            m.resolvedOutcome = newOutcome;
            m.status = MarketStatus.RESOLVED;
            uint256 bond = disputeBonds[marketId];
            disputeBonds[marketId] = 0;
            (bool ok,) = payable(disputer[marketId]).call{value: bond}("");
            require(ok, "Transfer failed");
        } else {
            // Dispute failed — forfeit bond to pool
            m.status = MarketStatus.RESOLVED;
            m.totalPool += disputeBonds[marketId];
            disputeBonds[marketId] = 0;
        }
    }

    /// @notice Expire a market that passed its deadline without resolution
    function expireMarket(uint256 marketId) external {
        Market storage m = markets[marketId];
        require(m.status == MarketStatus.OPEN || m.status == MarketStatus.RESOLUTION_REQUESTED, "Cannot expire");
        require(block.timestamp > m.deadline + 24 hours, "Not expired yet");
        m.status = MarketStatus.EXPIRED;
        m.resolvedOutcome = Outcome.INVALID;
    }

    /// @notice Set featured market (VRF callback target)
    function setFeaturedMarket(uint256 marketId) external onlyAuthorized {
        require(markets[marketId].status == MarketStatus.OPEN, "Not open");
        featuredMarketId = marketId;
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        (bool ok,) = payable(owner()).call{value: amount}("");
        require(ok, "Transfer failed");
    }

    receive() external payable {}
}
