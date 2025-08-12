import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getSchemaStructure } from "./utils";
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
  "defaultTool",
  "If there's no specific tool for the request, use this tool to handle general queries. Do not answer from memory or guess.",
  {},
  () => {
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
  "getSelectedDatabase",
  "Tool to get the name of the DB selected by the user",
  { userId: z.string() },
  async ({ userId }) => {
    if (!userId) {
      return {
        content: [
          {
            type: "text",
            text: "Please provide userId",
          },
        ],
      };
    }
    const userSettings = await client
      .db("chat")
      .collection("settings")
      .findOne({ userId });

    const dbName = userSettings?.selectedDb;
    return {
      content: [
        {
          type: "text",
          text: dbName
            ? `Name of the db selected by user: ${dbName}`
            : `User doesn't have any db selected, ask user for the db name if it's is not provided in the user query. Do not assume it or use default as it might not generate expected results for the user`,
        },
      ],
    };
  }
);

server.tool(
  "readFromDatabase",
  `If user asks to fetch data from a collection or table, use this tool to fetch them. Do not answer from memory.
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
    try {
      const result = await client
        .db(dbName || "sample_mflix")
        .collection(collectionName || "movies")
        .find(queryObject || {})
        .limit(limit || 5)
        .sort(sort || {})
        .project(project || {})
        .toArray();

      return {
        content: [
          {
            type: "text",
            text:
              JSON.stringify(result, null, 2) ||
              "No result found. Try again with a more specific query.",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve data from the database.",
          },
        ],
      };
    }
  }
);

server.tool(
  "tableJoin",
  `Tool that should be used to get data from join of two table`,
  {
    dbName: z.string(),
    tableName: z.string(),
    localField: z.string(),
    foreignTableName: z.string(),
    foreignColumnName: z.string(),
    newFieldName: z.string(),
    limit: z.number(),
  },
  async ({
    dbName,
    tableName,
    localField,
    foreignTableName,
    foreignColumnName,
    newFieldName,
    limit,
  }) => {
    try {
      const pipeline = [
        { $limit: limit || 2 },
        {
          $lookup: {
            localField,
            from: foreignTableName, // The collection to join from
            foreignField: foreignColumnName, // Field in the foreign collection
            as: newFieldName, // Name of the new array field to store matched documents
          },
        },
      ];

      const result = await client
        .db(dbName)
        .collection(tableName)
        .aggregate(pipeline)
        .toArray();

      return {
        content: [
          {
            type: "text",
            text: `Aggregated data: ${JSON.stringify(result)}`,
          },
        ],
      };
    } catch (error) {
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

server.tool(
  "tableSchema",
  "Tool that fetches schema structure of a particular table. expected parameters - table name and db name in which table is present",
  { tableName: z.string(), dbName: z.string() },
  async ({ tableName, dbName }) => {
    try {
      if (!tableName)
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve collections from the database. Table name not provided.",
            },
          ],
        };

      if (!dbName)
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve collections from the database. Table name not provided.",
            },
          ],
        };

      const result = await client
        .db(dbName)
        .collection(tableName)
        .find({})
        .limit(1) // Assuming every object has definite structure for now
        .toArray();

      const schema = getSchemaStructure(result[0]);
      return {
        content: [
          {
            type: "text",
            text: `Schema definition for the table ${tableName}: 
          ${JSON.stringify(schema)}
          `,
          },
        ],
      };
    } catch (error) {
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

export const fetchConversationHistory = async (userId: string) => {
  try {
    const history = await client
      .db("chat")
      .collection("conversation_history")
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    return history[0].chat || [];
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    return [];
  }
};

export const updateConversationHistory = async (
  userId: string,
  chat: { role: string; content: string }[]
) => {
  try {
    await client
      .db("chat")
      .collection("conversation_history")
      .updateOne(
        { userId },
        { $set: { userId, chat, timestamp: new Date() } },
        { upsert: true }
      );
  } catch (error) {
    console.error("Error updating conversation history:", error);
  }
};

export const selectDb = async (dbName: string, userId: string) => {
  const adminDb = client.db("admin");
  const result = await adminDb.command({ listDatabases: 1, nameOnly: true });
  const dbNames = result.databases.map((dbInfo: { name: string }) => {
    return dbInfo.name;
  });

  if (dbNames.includes(dbName)) {
    // save db name to chat table
    return await client
      .db("chat")
      .collection("settings")
      .updateOne(
        { userId },
        { $set: { userId, selectedDb: dbName, timestamp: new Date() } },
        { upsert: true }
      );
  }

  throw new Error(`Invalid DB name. Available DBs: ${dbNames.join(", ")}`);
};

// Start the server
async function mcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
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
