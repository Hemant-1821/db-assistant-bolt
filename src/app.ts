import MCPClient from "./mcp-client";

const { App } = require("@slack/bolt");
require("dotenv").config();

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);
  app.logger.info("⚡️ Bolt app is running!");
  const mcpClient = new MCPClient();
  try {
    await mcpClient.connectToServer(process.argv[2]);
    await mcpClient.processQuery('What is the capital of France?');
  } finally {
    await mcpClient.cleanup();
    process.exit(0);
  }
})();
