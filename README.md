# 🧠 Natural Language Slack Bot for MongoDB

A Slack bot that allows users to query a MongoDB database using **natural language**, powered by the **Anthropic SDK** and built with **BoltJS**.

## 🚀 Features (Phase 1)

- Accepts natural language instructions in Slack
- Connects to a MongoDB database
- Supports:
  - Reading from collections
  - Filtering rows
  - Sorting by fields
- Uses Anthropic Claude via SDK for language understanding
- Allow users to **select DB** using /selectdb command
- **stateful** bot — follow-up queries supported (e.g., “Now sort by price”)

## 🧰 Tech Stack

- ⚡️ [Slack BoltJS](https://slack.dev/bolt-js/) (Node.js)
- 🧠 [Anthropic Claude SDK](https://docs.anthropic.com/)
- 🗃️ MongoDB

## 🎯 Upcoming Features

- Add **join support** between collections
- Use **Langchain** instead of anthropic library for handling tools and LLM connection  

## 📸 Demo

https://www.loom.com/share/5ad57d56d3cc4ab4b019b657da02ea6f?sid=18a52682-d941-4873-b9e3-d91fa1d7810f

## ⚙️ Setup

- Add a `.env` file with these variables: `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`, `ANTHROPIC_API_KEY`, and `MONGODB_URI`.
- Create a Slack Bot from the [Slack API Dashboard](https://api.slack.com/apps) and install it to your workspace.
- For local testing, use a tool like **ngrok** to expose your local server and paste the public URL in your Slack bot’s Event Subscriptions.
- Make sure your bot has required scopes like `chat:write`, `commands`, and `app_mentions:read`.
- Start your dev server — you’re ready to chat with your DB using plain English in Slack!


---

Feel free to star ⭐ the repo or open an issue if you’d like to contribute or give feedback!
