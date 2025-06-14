import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Create server instance
const server = new McpServer({
  name: "database-agent",
  version: "1.0.0",
});

server.tool(
  "default-tool",
  "If there's no specific tool for the request, use this tool to handle general queries. Do not answer from memory or guess.",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: "I didn’t understand that as a DB operation. Try commands like:\n• Get all users from the last 30 days\n• Insert a new record into the orders table",
        },
      ],
    };
  }
);

server.tool(
  "ReadFromDatabase",
  `If someone asks for the list of collections or tables in the database, use this tool to fetch them. Do not answer from memory.
  Params:
  - dbName: The name of the database to query (default: "sample_mflix")
  - collectionName: The name of the collection to query (default: "movies")
  - queryObject: An optional query object to filter the results (default: give top 5 entries from the collection and let user know that prompt is too generic)
  - limit: An optional limit on the number of results to return (default: 5)
  - sort: An optional sort object to sort the results (default: no sorting)
  - project: An optional projection object to specify which fields to return

  Returns a list of collection names in the specified database. If no collections are found, returns a message indicating that.`,
  {
    dbName: z.string(),
    collectionName: z.string(),
    queryObject: z.object({}),
    limit: z.number().optional(),
    sort: z.object({}).optional(),
    project: z.object({}).optional(),
  },
  async ({ dbName, collectionName, queryObject, limit, sort, project }) => {
    console.log("params", {
      dbName,
      collectionName,
      queryObject,
      limit,
      sort,
      project,
    });
    try {
      const result = await client
        .db(dbName || "sample_mflix")
        .collection(collectionName || "movies")
        .find(queryObject || {})
        .limit(limit || 5)
        .sort(sort || {})
        .project(project || {});

      return {
        content: [
          {
            type: "text",
            text:
              result.toString() ||
              "No result found. Try again with a more specific query.",
          },
        ],
      };
    } catch (error) {
      console.error("Error retrieving collections:", error);
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve collections from the database.",
          },
        ],
      };
    }
  }
);

// Start the server
async function mcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
  // Connect to MongoDB
  await client.connect();
  // Send a ping to confirm a successful connection
  await client.db("admin").command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
}

mcpServer().catch((e) => {
  console.error("Error starting MCP server:", e);
  process.exit(1);
});
