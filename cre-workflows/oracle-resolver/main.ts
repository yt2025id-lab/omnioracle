import CRE, {
  EVMLogTrigger,
  GeminiLLM,
  EVMClient,
  type CREConfig,
} from "@anthropic-ai/cre-sdk";

import { logCallback } from "./logCallback";

const config: CREConfig = {
  name: "oracle-resolver",
  description:
    "Dynamic oracle pipeline resolver. Triggered by ResolutionRequested events, executes the appropriate pipeline (Data Feeds, Data Streams, Functions, AI, Composite) based on market config.",
};

const cre = new CRE(config);

// EVM Log trigger — listen for ResolutionRequested events
// ResolutionRequested(uint256 indexed marketId, IMarketFactory.PipelineType pipelineType)
const evmLogTrigger = new EVMLogTrigger({
  chain: "base_sepolia",
  contractAddress: "${MARKET_FACTORY_ADDRESS}",
  eventSignature:
    "ResolutionRequested(uint256,uint8)",
  // topic0 = keccak256("ResolutionRequested(uint256,uint8)")
});

const gemini = new GeminiLLM({ model: "gemini-2.0-flash" });
const evmClient = new EVMClient({ chain: "base_sepolia" });

cre.onEVMLog(evmLogTrigger, (trigger: any) =>
  logCallback(trigger, cre, gemini, evmClient)
);

export default cre;
