// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMarketFactory.sol";

/// @title OraclePipeline — Pipeline configuration registry for OmniOracle
/// @notice Stores immutable pipeline configs per market. Once set, configs cannot be changed.
contract OraclePipeline is Ownable {
    address public marketFactory;

    mapping(uint256 => IMarketFactory.PipelineConfig) private _configs;
    mapping(uint256 => bool) private _configured;

    event PipelineConfigured(uint256 indexed marketId, IMarketFactory.PipelineType pipelineType);

    modifier onlyMarketFactory() {
        require(msg.sender == marketFactory, "Only MarketFactory");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setMarketFactory(address _marketFactory) external onlyOwner {
        marketFactory = _marketFactory;
    }

    /// @notice Set pipeline config for a market. Can only be called once per market.
    function setPipelineConfig(
        uint256 marketId,
        IMarketFactory.PipelineConfig calldata config
    ) external onlyMarketFactory {
        require(!_configured[marketId], "Already configured");
        _configs[marketId] = config;
        _configured[marketId] = true;
        emit PipelineConfigured(marketId, config.pipelineType);
    }

    /// @notice Get the full pipeline configuration for a market.
    function getPipelineConfig(uint256 marketId) external view returns (IMarketFactory.PipelineConfig memory) {
        require(_configured[marketId], "Not configured");
        return _configs[marketId];
    }

    /// @notice Get just the pipeline type for a market.
    function getPipelineType(uint256 marketId) external view returns (IMarketFactory.PipelineType) {
        require(_configured[marketId], "Not configured");
        return _configs[marketId].pipelineType;
    }

    /// @notice Check if a market has a pipeline configured.
    function isConfigured(uint256 marketId) external view returns (bool) {
        return _configured[marketId];
    }
}
