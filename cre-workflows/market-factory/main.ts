import CRE, {
  HTTPTrigger,
  CronCapability,
  GeminiLLM,
  EVMClient,
  type CREConfig,
} from "@anthropic-ai/cre-sdk";

import { httpCallback } from "./httpCallback";
import { cronCallback } from "./cronCallback";

const config: CREConfig = {
  name: "market-factory",
  description:
    "Creates prediction markets with composable oracle pipelines. HTTP trigger for user submissions, Cron for autonomous market generation.",
};

const cre = new CRE(config);

// HTTP trigger — payment-gated via x402
const httpTrigger = new HTTPTrigger({
  path: "/create-market",
  method: "POST",
});

// Cron trigger — auto-create trending markets every 6 hours
const cronTrigger = new CronCapability({
  schedule: "0 */6 * * *",
});

const gemini = new GeminiLLM({ model: "gemini-2.0-flash" });
const evmClient = new EVMClient({ chain: "base_sepolia" });

cre.onHTTPTrigger(httpTrigger, (trigger: any) =>
  httpCallback(trigger, cre, gemini, evmClient)
);

cre.onCron(cronTrigger, (trigger: any) =>
  cronCallback(trigger, cre, gemini, evmClient)
);

export default cre;
