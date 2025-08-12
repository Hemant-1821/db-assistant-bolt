import MCPClient from "./mcp-client";
import { selectDb } from "./mcp-server";
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
  const { message, say, client, context } = props;
  if (
    message.subtype === "bot_message" ||
    !("text" in message) ||
    typeof message.text !== "string"
  ) {
    return; // silently ignore
  }

  const result = await client.chat.postMessage({
    text: "Thinking...",
    channel: message.channel,
  });
  // Process the message with MCP client
  const mcpMessage = await mcpClient.processQuery(message.text, context.userId);
  await client.chat.delete({
    channel: message.channel,
    ts: result.ts,
  });
  await say(mcpMessage);
});

app.command("/clearbotchat", async ({ command, ack, client, respond }: any) => {
  await ack();

  const channelId = command.channel_id;
  const countToDelete = parseInt(command.text) || 20;

  try {
    // Fetch last messages from the channel
    const history = await client.conversations.history({
      channel: channelId,
      limit: 100,
    });

    if (!history.messages) {
      await respond("Couldn't fetch messages.");
      return;
    }

    const botUserId = (await client.auth.test()).user_id;
    const botMessages = history.messages
      .filter((msg: any) => msg.user === botUserId && !msg.subtype)
      .slice(0, countToDelete);

    let deletedCount = 0;

    for (const msg of botMessages) {
      await client.chat.delete({
        channel: channelId,
        ts: msg.ts!,
      });
      deletedCount++;
    }

    await respond(`✅ Cleared ${deletedCount} message(s) posted by the bot.`);
  } catch (error) {
    console.error("Error clearing chat:", error);
    await respond("❌ Failed to clear messages.");
  }
});

app.command(
  "/selectdb",
  async ({ command, ack, respond, context, client }: any) => {
    const dbName = command.text.trim();
    const channelId = command.channel_id;

    if (!dbName) {
      await respond(
        "❌ invalid db name. Please mention just the db name after the slash command"
      );
    }
    try {
      await selectDb(dbName, context.userId);
      await respond("DB Selection successfully saved.");
      await client.conversations.setTopic({
        channel: channelId,
        topic: `Selected DB: ${dbName}`,
      });
    } catch (e: any) {
      console.error(e);
      await respond(`An error occurred: ${e.message}`);
    }
    await ack();
  }
);

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
