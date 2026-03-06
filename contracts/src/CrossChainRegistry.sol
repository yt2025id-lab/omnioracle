// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMarketFactory.sol";

// ---------------------------------------------------------------------------
// Inline Chainlink CCIP interfaces — compatible with IRouterClient v1.2
// Source: https://github.com/smartcontractkit/ccip/tree/main/contracts/src/v0.8/ccip
// ---------------------------------------------------------------------------
library Client {
    struct EVMTokenAmount {
        address token;
        uint256 amount;
    }

    struct EVM2AnyMessage {
        bytes receiver;       // abi.encode(address) of receiver on dest chain
        bytes data;           // encoded payload
        EVMTokenAmount[] tokenAmounts;
        address feeToken;     // address(0) = pay in native
        bytes extraArgs;      // abi.encode(EVMExtraArgsV1{gasLimit})
    }

    struct Any2EVMMessage {
        bytes32 messageId;
        uint64 sourceChainSelector;
        bytes sender;
        bytes data;
        EVMTokenAmount[] tokenAmounts;
    }

    // EVMExtraArgsV1 tag
    bytes4 public constant EVM_EXTRA_ARGS_V1_TAG = 0x97a657c9;
}

interface IRouterClient {
    function getFee(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage calldata message
    ) external view returns (uint256 fee);

    function ccipSend(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage calldata message
    ) external payable returns (bytes32 messageId);
}

interface IAny2EVMMessageReceiver {
    function ccipReceive(Client.Any2EVMMessage calldata message) external;
}

// ---------------------------------------------------------------------------

/// @title CrossChainRegistry — Chainlink CCIP market mirroring
/// @notice Mirrors prediction market metadata to any CCIP-supported chain.
///         Implements IAny2EVMMessageReceiver to accept incoming CCIP messages.
contract CrossChainRegistry is Ownable, IAny2EVMMessageReceiver {
    IMarketFactory public marketFactory;
    IRouterClient public ccipRouter;

    /// @dev Gas limit for CCIP receive on destination chain
    uint256 public constant CCIP_GAS_LIMIT = 200_000;

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
    // messageId => processed (prevent replay)
    mapping(bytes32 => bool) public processedMessages;

    uint256 public totalMirrored;

    event MarketMirrored(uint256 indexed marketId, uint64 indexed destChainSelector, bytes32 ccipMessageId);
    event CrossChainMarketReceived(uint256 indexed marketId, uint64 indexed sourceChainSelector, bytes32 messageId);

    error NotCCIPRouter(address caller);
    error MessageAlreadyProcessed(bytes32 messageId);
    error MarketAlreadyMirrored(uint256 marketId, uint64 chainSelector);

    constructor(address _marketFactory, address _ccipRouter) Ownable(msg.sender) {
        marketFactory = IMarketFactory(_marketFactory);
        ccipRouter = IRouterClient(_ccipRouter);
    }

    // -----------------------------------------------------------------------
    // SEND — mirror market to another chain via CCIP
    // -----------------------------------------------------------------------

    /// @notice Mirror a market to another chain via Chainlink CCIP
    /// @param marketId The market to mirror
    /// @param destChainSelector CCIP chain selector for destination
    /// @param destReceiver Address of CrossChainRegistry on destination chain
    function mirrorMarket(
        uint256 marketId,
        uint64 destChainSelector,
        address destReceiver
    ) external payable {
        IMarketFactory.Market memory m = marketFactory.getMarket(marketId);
        require(m.status == IMarketFactory.MarketStatus.OPEN, "Market not open");
        if (isMirrored[marketId][destChainSelector]) revert MarketAlreadyMirrored(marketId, destChainSelector);

        isMirrored[marketId][destChainSelector] = true;
        mirroredToChain[destChainSelector].push(marketId);
        totalMirrored++;

        // Encode market metadata as CCIP message payload
        bytes memory payload = abi.encode(
            marketId,
            m.question,
            uint8(m.pipelineType),
            m.deadline
        );

        // Build CCIP message — pay fee in native ETH (feeToken = address(0))
        Client.EVM2AnyMessage memory ccipMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(destReceiver),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            feeToken: address(0),
            extraArgs: abi.encodeWithSelector(
                Client.EVM_EXTRA_ARGS_V1_TAG,
                CCIP_GAS_LIMIT
            )
        });

        // Get fee and send
        uint256 fee = ccipRouter.getFee(destChainSelector, ccipMessage);
        require(msg.value >= fee, "Insufficient fee for CCIP");

        bytes32 messageId = ccipRouter.ccipSend{value: fee}(destChainSelector, ccipMessage);

        emit MarketMirrored(marketId, destChainSelector, messageId);

        // Refund excess
        if (msg.value > fee) {
            (bool ok, ) = msg.sender.call{value: msg.value - fee}("");
            require(ok, "Refund failed");
        }
    }

    // -----------------------------------------------------------------------
    // RECEIVE — accept incoming CCIP messages from other chains
    // -----------------------------------------------------------------------

    /// @notice Called by CCIP Router when a cross-chain message arrives
    /// @dev Implements IAny2EVMMessageReceiver — only callable by ccipRouter
    function ccipReceive(Client.Any2EVMMessage calldata message) external override {
        if (msg.sender != address(ccipRouter)) revert NotCCIPRouter(msg.sender);
        if (processedMessages[message.messageId]) revert MessageAlreadyProcessed(message.messageId);

        processedMessages[message.messageId] = true;

        // Decode market metadata from payload
        (uint256 marketId, string memory question, uint8 pipelineType, uint256 deadline) =
            abi.decode(message.data, (uint256, string, uint8, uint256));

        incomingMarkets.push(MirroredMarket({
            marketId: marketId,
            sourceChainSelector: message.sourceChainSelector,
            question: question,
            pipelineType: pipelineType,
            deadline: deadline,
            isActive: true
        }));

        emit CrossChainMarketReceived(marketId, message.sourceChainSelector, message.messageId);
    }

    // -----------------------------------------------------------------------
    // Views
    // -----------------------------------------------------------------------

    function getMirroredCount(uint64 chainSelector) external view returns (uint256) {
        return mirroredToChain[chainSelector].length;
    }

    function getIncomingMarketsCount() external view returns (uint256) {
        return incomingMarkets.length;
    }

    function getIncomingMarket(uint256 index) external view returns (MirroredMarket memory) {
        return incomingMarkets[index];
    }

    /// @notice Estimate CCIP fee before calling mirrorMarket
    function estimateFee(
        uint256 marketId,
        uint64 destChainSelector,
        address destReceiver
    ) external view returns (uint256 fee) {
        IMarketFactory.Market memory m = marketFactory.getMarket(marketId);
        bytes memory payload = abi.encode(marketId, m.question, uint8(m.pipelineType), m.deadline);
        Client.EVM2AnyMessage memory msg_ = Client.EVM2AnyMessage({
            receiver: abi.encode(destReceiver),
            data: payload,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            feeToken: address(0),
            extraArgs: abi.encodeWithSelector(Client.EVM_EXTRA_ARGS_V1_TAG, CCIP_GAS_LIMIT)
        });
        return ccipRouter.getFee(destChainSelector, msg_);
    }

    receive() external payable {}
}
