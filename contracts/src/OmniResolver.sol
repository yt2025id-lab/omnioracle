// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMarketFactory.sol";
import "./OraclePipeline.sol";

/// @title OmniResolver — Dynamic resolution executor for OmniOracle
/// @notice Emits resolution requests for CRE and handles pipeline results.
contract OmniResolver is Ownable {
    IMarketFactory public marketFactory;
    OraclePipeline public oraclePipeline;
    address public creForwarder;

    event ResolutionTriggered(uint256 indexed marketId, IMarketFactory.PipelineType pipelineType);
    event PipelineResultReceived(uint256 indexed marketId, IMarketFactory.Outcome outcome, uint16 confidence);

    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || msg.sender == creForwarder,
            "Not authorized"
        );
        _;
    }

    constructor(address _marketFactory, address _oraclePipeline, address _creForwarder) Ownable(msg.sender) {
        marketFactory = IMarketFactory(_marketFactory);
        oraclePipeline = OraclePipeline(_oraclePipeline);
        creForwarder = _creForwarder;
    }

    /// @notice Request resolution for a market. Emits event for CRE EVM Log trigger.
    function requestResolution(uint256 marketId) external {
        IMarketFactory.Market memory m = marketFactory.getMarket(marketId);
        require(
            m.status == IMarketFactory.MarketStatus.RESOLUTION_REQUESTED ||
            m.status == IMarketFactory.MarketStatus.OPEN,
            "Cannot resolve"
        );

        IMarketFactory.PipelineType pType = oraclePipeline.getPipelineType(marketId);
        emit ResolutionTriggered(marketId, pType);
    }

    /// @notice CRE Forwarder callback — receives pipeline execution results
    function onReport(bytes calldata report) external {
        require(msg.sender == creForwarder, "Only CRE Forwarder");

        (uint256 marketId, uint8 outcomeRaw, uint16 confidence) =
            abi.decode(report, (uint256, uint8, uint16));

        IMarketFactory.Outcome outcome = IMarketFactory.Outcome(outcomeRaw);

        emit PipelineResultReceived(marketId, outcome, confidence);

        // Forward result to MarketFactory for finalization
        marketFactory.resolveMarket(marketId, outcome, confidence);
    }
}
