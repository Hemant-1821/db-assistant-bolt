import { Anthropic } from "@anthropic-ai/sdk";
import type {
  MessageParam,
  Tool,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages/messages.js";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { systemPrompt } from "./constants";
import {
  fetchConversationHistory,
  updateConversationHistory,
} from "./mcp-server";

require("dotenv").config();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

export default class MCPClient {
  private mcp: Client;
  private anthropic: Anthropic;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];

  constructor() {
    // Initialize Anthropic client and MCP client
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
  }

  async connectToServer(serverScriptPath: string) {
    /**
     * Connect to an MCP server
     *
     * @param serverScriptPath - Path to the server script (.py or .js)
     */
    try {
      const command = process.execPath;

      // Initialize transport and connect to server
      this.transport = new StdioClientTransport({
        command,
        args: [serverScriptPath],
      });
      this.mcp.connect(this.transport);

      // List available tools
      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        };
      });
      console.log(
        "Connected to server with tools:",
        this.tools.map(({ name }) => name)
      );
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  async getLlmResponse(
    userId: string,
    messages: MessageParam[]
  ): Promise<string> {
    const extendedMessages = [...messages];

    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: extendedMessages,
      tools: this.tools,
      system: systemPrompt,
    });

    let textFromClaude = "";
    let toolUsed = false;

    extendedMessages.push({
      role: "assistant",
      content: response.content,
    });

    for (const content of response.content) {
      if (content.type === "text") {
        textFromClaude = content.text;
      } else if (content.type === "tool_use") {
        toolUsed = true;
        // Execute tool call
        const toolName = content.name;
        const toolArgs = content.input as { [x: string]: unknown } | undefined;

        // Add userId to tool arguments
        const enrichedToolArgs = {
          ...toolArgs,
          userId, // Pass userId to all tool calls
        };

        const result = (await this.mcp.callTool({
          name: toolName,
          arguments: enrichedToolArgs,
        })) as unknown as ToolResultBlockParam; // Bug from library

        console.log(
          `[Calling tool ${toolName} with args ${JSON.stringify(
            enrichedToolArgs
          )}]`
        );

        console.log("Results from tool:", toolName, "---->", result);

        let toolResponse = "";
        if (result.content && typeof result.content === "object")
          result.content.forEach((ele) => {
            if (ele.type === "text") {
              toolResponse = ele.text;
            }
          });

        // Continue conversation with tool results
        extendedMessages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: content.id,
              content: toolResponse,
            },
          ],
        });
      }
    }

    if (!toolUsed) return textFromClaude;

    return this.getLlmResponse(userId, extendedMessages);
  }

  async processQuery(query: string, userId: string) {
    /**
     * Process a query using Claude and available tools
     *
     * @param query - The user's input query
     * @returns Processed response as a string
     */

    const history = await fetchConversationHistory(userId);

    const messages: MessageParam[] = [
      ...history,
      {
        role: "user",
        content: query,
      },
    ];

    const finalResult = await this.getLlmResponse(userId, messages);

    const chat = [
      ...history.slice(-8), // keeping last 8 messages pair for context and make bot stateful
      {
        role: "user",
        content: query,
      },
      {
        role: "assistant",
        content: finalResult,
      },
    ];
    await updateConversationHistory(userId, chat);

    return finalResult;
  }

  async cleanup() {
    /**
     * Clean up resources
     */
    await this.mcp.close();
  }
}
