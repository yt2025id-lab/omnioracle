// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMarketFactory.sol";

/// @title CrossChainRegistry — CCIP-powered cross-chain market mirroring
/// @notice Mirrors market metadata to other chains and accepts cross-chain data.
contract CrossChainRegistry is Ownable {
    IMarketFactory public marketFactory;
    address public ccipRouter;

    struct MirroredMarket {
        uint256 marketId;
        uint64 sourceChainSelector;
        string question;
        uint8 pipelineType;
        uint256 deadline;
        bool isActive;
    }

    // chainSelector => marketId[]
    mapping(uint64 => uint256[]) public mirroredToChain;
    // marketId => chainSelector => mirrored
    mapping(uint256 => mapping(uint64 => bool)) public isMirrored;
    // Incoming mirrored markets from other chains
    MirroredMarket[] public incomingMarkets;

    uint256 public totalMirrored;

    event MarketMirrored(uint256 indexed marketId, uint64 indexed destChainSelector);
    event CrossChainMarketReceived(uint256 indexed marketId, uint64 indexed sourceChainSelector);

    constructor(address _marketFactory, address _ccipRouter) Ownable(msg.sender) {
        marketFactory = IMarketFactory(_marketFactory);
        ccipRouter = _ccipRouter;
    }

    /// @notice Mirror a market to another chain via CCIP
    function mirrorMarket(uint256 marketId, uint64 destChainSelector) external {
        IMarketFactory.Market memory m = marketFactory.getMarket(marketId);
        require(m.status == IMarketFactory.MarketStatus.OPEN, "Not open");
        require(!isMirrored[marketId][destChainSelector], "Already mirrored");

        isMirrored[marketId][destChainSelector] = true;
        mirroredToChain[destChainSelector].push(marketId);
        totalMirrored++;

        // In production: encode message and send via CCIP Router
        // Router(ccipRouter).ccipSend(destChainSelector, message);

        emit MarketMirrored(marketId, destChainSelector);
    }

    /// @notice Receive cross-chain market data (simulated CCIP receive)
    function receiveCrossChainMarket(
        uint256 marketId,
        uint64 sourceChainSelector,
        string calldata question,
        uint8 pipelineType,
        uint256 deadline
    ) external {
        require(msg.sender == ccipRouter || msg.sender == owner(), "Not authorized");

        incomingMarkets.push(MirroredMarket({
            marketId: marketId,
            sourceChainSelector: sourceChainSelector,
            question: question,
            pipelineType: pipelineType,
            deadline: deadline,
            isActive: true
        }));

        emit CrossChainMarketReceived(marketId, sourceChainSelector);
    }

    function getMirroredCount(uint64 chainSelector) external view returns (uint256) {
        return mirroredToChain[chainSelector].length;
    }

    function getIncomingMarketsCount() external view returns (uint256) {
        return incomingMarkets.length;
    }

    function getIncomingMarket(uint256 index) external view returns (MirroredMarket memory) {
        return incomingMarkets[index];
    }
}
