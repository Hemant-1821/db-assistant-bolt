# 🧠 Natural Language Slack Bot for MongoDB

A Slack bot that allows users to query a MongoDB database using **natural language**, powered by the **Anthropic SDK**/**Langchain** and built with **BoltJS**.

## 🚀 Features
Phase 1
- Accepts natural language instructions in Slack
- Connects to a MongoDB database
- Supports:
  - Reading from collections
  - Filtering rows
  - Sorting by fields
- Uses Anthropic Claude via SDK for language understanding

Phase 2
- New tools:
  - Getting root level schema of a collection
  - Perform left outer join of two collections using mongodb aggregation pipeline 
- Allow users to **select DB** using /selectdb command
- **stateful** bot — follow-up queries supported (e.g., “Now sort by price”)
- Recursive prompting to execute tools consecutively and achieve final desired answer.

Phase 3 (Available on langchain-agent branch)
- Switched from Anthropic SDK → LangChain + LangGraph for tool orchestration and LLM communication.
- Restructured the system prompt for clearer, more reliable instructions.

## 🧰 Tech Stack

- ⚡️ [Slack BoltJS](https://slack.dev/bolt-js/) (Node.js)
- 🧠 [Anthropic Claude SDK](https://docs.anthropic.com/)
- 🧠 [Langchain](https://www.langchain.com/) (Available on langchain-agent branch)
- 🗃️ MongoDB

## 📸 Demo

Phase 1 - https://www.loom.com/share/5ad57d56d3cc4ab4b019b657da02ea6f?sid=18a52682-d941-4873-b9e3-d91fa1d7810f

Phase 2 - https://www.linkedin.com/posts/hemant-singh-2496a0112_buildinpublic-slackbot-claude-activity-7361248938252742657-DKDL?utm_source=share&utm_medium=member_desktop&rcm=ACoAABw401kBEtkoUodwZ0dwUiVF6jndDitDAb8

## ⚙️ Setup

- Add a `.env` file with these variables: `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`, `ANTHROPIC_API_KEY`/`GOOGLE_API_KEY`/`OPENAI_API_KEY`, and `MONGODB_URI`.
- Create a Slack Bot from the [Slack API Dashboard](https://api.slack.com/apps) and install it to your workspace.
- For local testing, use a tool like **ngrok** to expose your local server and paste the public URL in your Slack bot’s Event Subscriptions.
- Make sure your bot has required scopes like `chat:write`, `commands`, and `app_mentions:read`.
- Start your dev server — you’re ready to chat with your DB using plain English in Slack!


---

Feel free to star ⭐ the repo or open an issue if you’d like to contribute or give feedback!
