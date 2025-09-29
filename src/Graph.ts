import {
  StateGraph,
  MessagesAnnotation,
  END,
  START,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";

import tools from "./tools";
import { client } from "./app";

// Initialize memory to persist state between graph runs

const toolNodeForGraph = new ToolNode(tools);

const Graph = (modelWithTools: any) => {
  const checkpointer = new MongoDBSaver({ client, dbName: "sample_mflix" });
  let modelCalledInLoop = 0;

  const shouldContinue = (state: typeof MessagesAnnotation.State) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage?.response_metadata?.finishReason === "MALFORMED_FUNCTION_CALL"
    ) {
      if (modelCalledInLoop < 2) {
        modelCalledInLoop++;
        return "agent";
      } else {
        console.log("Retries exceeded the limit of 2", messages);
        return END;
      }
    }

    modelCalledInLoop = 0;
    if (
      "tool_calls" in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls?.length
    ) {
      return "tools";
    }

    return END;
  };

  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const { messages } = state;
    const response = await modelWithTools.invoke(messages);
    return { messages: response };
  };

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNodeForGraph)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, ["tools", "agent", END])
    .addEdge("tools", "agent");

  const app = workflow.compile({ checkpointer });
  return app;
};

export default Graph;
