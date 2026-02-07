// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMarketFactory.sol";

/// @title AutoResolver — Chainlink Automation for auto-triggering market resolution
/// @notice Scans for markets past deadline and auto-requests resolution.
contract AutoResolver is Ownable {
    IMarketFactory public marketFactory;
    uint256 public maxScanRange = 50;

    event AutoResolutionTriggered(uint256 indexed marketId);

    constructor(address _marketFactory) Ownable(msg.sender) {
        marketFactory = IMarketFactory(_marketFactory);
    }

    function setMaxScanRange(uint256 _range) external onlyOwner {
        maxScanRange = _range;
    }

    /// @notice Chainlink Automation checkUpkeep — scan for markets needing resolution
    function checkUpkeep(bytes calldata) external view returns (bool upkeepNeeded, bytes memory performData) {
        uint256 total = marketFactory.nextMarketId();
        uint256 start = total > maxScanRange ? total - maxScanRange : 0;

        for (uint256 i = start; i < total; i++) {
            IMarketFactory.Market memory m = marketFactory.getMarket(i);
            if (
                m.status == IMarketFactory.MarketStatus.OPEN &&
                block.timestamp > m.deadline
            ) {
                return (true, abi.encode(i));
            }
        }

        return (false, "");
    }

    /// @notice Chainlink Automation performUpkeep — trigger resolution
    function performUpkeep(bytes calldata performData) external {
        uint256 marketId = abi.decode(performData, (uint256));

        IMarketFactory.Market memory m = marketFactory.getMarket(marketId);
        require(m.status == IMarketFactory.MarketStatus.OPEN, "Not open");
        require(block.timestamp > m.deadline, "Not past deadline");

        // Note: In production, this would call MarketFactory.requestResolution()
        // For now we emit an event that CRE can pick up
        emit AutoResolutionTriggered(marketId);
    }
}
