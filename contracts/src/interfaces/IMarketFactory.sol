// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMarketFactory {
    enum PipelineType { PRICE_FEED, DATA_STREAM, FUNCTIONS_API, AI_GROUNDED, COMPOSITE }
    enum MarketStatus { OPEN, RESOLUTION_REQUESTED, RESOLVING, RESOLVED, DISPUTED, EXPIRED }
    enum MarketCategory { CRYPTO, SPORTS, POLITICS, SCIENCE, ENTERTAINMENT, CUSTOM }
    enum Outcome { YES, NO, INVALID }

    struct Market {
        address creator;
        string question;
        MarketCategory category;
        PipelineType pipelineType;
        uint256 createdAt;
        uint256 deadline;
        MarketStatus status;
        Outcome resolvedOutcome;
        uint256 yesPool;
        uint256 noPool;
        uint256 totalPool;
        uint16 confidence;
        uint256 marketId;
    }

    struct PipelineConfig {
        PipelineType pipelineType;
        address priceFeedAddress;
        int256 priceThreshold;
        bool isAbove;
        bytes32 dataStreamId;
        string functionsScript;
        bytes32 aiPromptHash;
        uint8 requiredAgreement;
    }

    event MarketCreated(uint256 indexed marketId, string question, PipelineType pipelineType);
    event PredictionPlaced(uint256 indexed marketId, address indexed user, bool isYes, uint256 amount);
    event ResolutionRequested(uint256 indexed marketId, PipelineType pipelineType);
    event MarketResolved(uint256 indexed marketId, Outcome outcome, uint16 confidence);
    event DisputeOpened(uint256 indexed marketId, address indexed disputer);

    function getMarket(uint256 marketId) external view returns (Market memory);
    function nextMarketId() external view returns (uint256);
    function resolveMarket(uint256 marketId, Outcome outcome, uint16 confidence) external;
}
