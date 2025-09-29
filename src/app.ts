import QueryAgent from "./QueryAgent";

const { App, ExpressReceiver } = require("@slack/bolt");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver,
});

// MongoDB setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

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
  // Process the message with langgraph
  const response = await QueryAgent(message.text, context.userId);
  await client.chat.delete({
    channel: message.channel,
    ts: result.ts,
  });
  await say({
    text: response,
  });
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
      // await selectDb(dbName, context.userId);
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

receiver.app.get("/check", async (req: any, res: any) => {
  res.send(`server up and running!!`);
});

(async () => {
  try {
    // Start your bolt app
    await app.start(process.env.PORT || 3000);
    app.logger.info("⚡️ Bolt app is running!");

    // MongoDB client connection
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (e) {
    app.logger.error(e);
    process.exit(1);
  }
})();

export { client };
