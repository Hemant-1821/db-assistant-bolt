// import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  MessageContent,
  SystemMessage,
} from "@langchain/core/messages";
import tools from "./tools";
import Graph from "./Graph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { systemPrompt } from "./constants";
require("dotenv").config();

const modelWithTools = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-pro",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
}).bindTools(tools);

const QueryAgent = async (
  text: string,
  id: string
): Promise<MessageContent | undefined> => {
  // Invoke agent
  const graphInstance = await Graph(modelWithTools);
  let messages = [];

  const state = await graphInstance.getState({
    configurable: { thread_id: id },
  });

  // Check if system message already exists
  const hasSystem = state.values.messages?.some(
    (m: any) => m.getType?.() === "system"
  );

  if (!hasSystem) {
    messages.push(new SystemMessage(systemPrompt));
  }

  messages.push(new HumanMessage(text));

  const stream = await graphInstance.stream(
    {
      messages,
    },
    {
      streamMode: "values",
      configurable: { thread_id: id },
    }
  );
  let lastChunk;

  for await (const chunk of stream) {
    lastChunk = chunk;
  }

  const lastMessage =
    lastChunk?.messages[lastChunk.messages.length - 1]?.content;

  return lastMessage;
};

export default QueryAgent;
