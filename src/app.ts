import { messageProp } from "./Types";
import MCPClient from "./mcp-client";
import { isDbRelatedMessage } from "./utils";

const { App } = require("@slack/bolt");
require("dotenv").config();

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// MCP client initialization
const mcpClient = new MCPClient();
mcpClient.connectToServer("./dist/mcp-server.js");

app.message(async ({ message, say }: messageProp) => {
  console.log("Received message:", message.text);
  if (!isDbRelatedMessage(message.text)) return; // Future enhancement: Add a NLP model to detect DB-related messages (Combine with NLP)

  // const response = await processWithClaude(message.text);
  await say(`your message is related to DB - ${message.text}`);
});

// default message:
// I didn’t understand that as a DB operation. Try commands like:
// • Get all users from the last 30 days
// • Insert a new record into the orders table

(async () => {
  try {
    // Start your bolt app
    await app.start(process.env.PORT || 3000);
    app.logger.info("⚡️ Bolt app is running!");
    // console.log(
    //   await mcpClient.processQuery(
    //     "What will be the weather in indore at 8 pm ist?"
    //   )
    // );
  } catch (e) {
    app.logger.error(e);
    await mcpClient.cleanup();
    process.exit(1);
  }
})();
