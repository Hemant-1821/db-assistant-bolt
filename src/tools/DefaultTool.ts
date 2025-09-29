import { tool } from "@langchain/core/tools";

const DefaultTool = tool(
  () => {
    return "I didn’t understand that as a DB operation. Try commands like:\n• Get all users from the last 30 days";
  },
  {
    name: "defaultTool",
    description:
      "If there's no specific tool for the request, use this tool to handle general queries. Do not answer from memory or guess.",
  }
);

export default DefaultTool;
