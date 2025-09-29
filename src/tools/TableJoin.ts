import { tool } from "@langchain/core/tools";
import z from "zod";
import { client } from "../app";

const TableJoinTool = tool(
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
            from: foreignTableName,
            foreignField: foreignColumnName,
            as: newFieldName,
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
  },
  {
    name: "tableJoin",
    description: `Tool to get data from join of two tables.
        Params:
            - dbName: Database name.
            - tableName: Main table/collection name.
            - localField: Field from main table.
            - foreignTableName: Table to join from.
            - foreignColumnName: Field in foreign table.
            - newFieldName: Name for joined array field.
            - limit: Limit on results.
            
        Returns joined data.`,
    schema: z.object({
      dbName: z.string(),
      tableName: z.string(),
      localField: z.string(),
      foreignTableName: z.string(),
      foreignColumnName: z.string(),
      newFieldName: z.string(),
      limit: z.number(),
    }),
  }
);

export default TableJoinTool;
