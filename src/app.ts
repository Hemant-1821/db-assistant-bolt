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

app.message(async (props: any) => {
  const { message, say, client } = props;
  if (!message || !message.text) {
    app.logger.error("Invalid message format", message);
    await say("Invalid message format. Please try again.");
    return;
  }

  if (!isDbRelatedMessage(message.text)) {
    await say(
      "I didn’t understand that as a DB operation. Try commands like:\n• Get all users from the last 30 days\n• Insert a new record into the orders table"
    );
    return;
  }

  const result = await client.chat.postMessage({
    text: "Thinking...",
    channel: message.channel,
  });
  // Process the message with MCP client
  const mcpMessage = await mcpClient.processQuery(message.text);
  await client.chat.delete({
    channel: message.channel,
    ts: result.ts,
  });
  await say(mcpMessage);
  return;
});

(async () => {
  try {
    // Start your bolt app
    await app.start(process.env.PORT || 3000);
    app.logger.info("⚡️ Bolt app is running!");
    // Connect to mcp server
    mcpClient.connectToServer("./dist/mcp-server.js");
  } catch (e) {
    app.logger.error(e);
    await mcpClient.cleanup();
    process.exit(1);
  }
})();
