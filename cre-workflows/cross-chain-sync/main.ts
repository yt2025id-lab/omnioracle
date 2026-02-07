import CRE, {
  CronCapability,
  EVMClient,
  type CREConfig,
} from "@anthropic-ai/cre-sdk";

import { cronCallback } from "./cronCallback";

const config: CREConfig = {
  name: "cross-chain-sync",
  description:
    "Syncs OmniOracle market data across chains via CCIP. Reads active markets on Base Sepolia and mirrors metadata to other chains.",
};

const cre = new CRE(config);

// Cron trigger — sync every 4 hours
const cronTrigger = new CronCapability({
  schedule: "0 */4 * * *",
});

const evmClient = new EVMClient({ chain: "base_sepolia" });

cre.onCron(cronTrigger, (trigger: any) =>
  cronCallback(trigger, cre, evmClient)
);

export default cre;
