import { tool } from "@langchain/core/tools";
import z from "zod";
import { client } from "../app";
import { getSchemaStructure } from "../utils";

const TableSchemaTool = tool(
  async ({ dbName, tableName }) => {
    console.log("Schema tool called", dbName, tableName);
    try {
      if (!dbName || !tableName) {
        return "Error! Both dbName and tableName must be provided.";
      }

      const result = await client
        .db(dbName)
        .collection(tableName)
        .find({})
        .limit(1)
        .toArray();

      if (!result[0]) {
        return `No documents found in table ${tableName}.`;
      }

      const schema = getSchemaStructure(result[0]);

      return `Schema definition for the table ${tableName}: ${JSON.stringify(
        schema,
        null,
        2
      )}`;
    } catch (error) {
      return "Something went wrong! Failed to retrieve schema from the database.";
    }
  },
  {
    name: "tableSchema",
    description: `Fetches schema structure of a particular table. 
      Params:
      - dbName: The name of the database.
      - tableName: The name of the table/collection.
      Returns the schema definition inferred from the first document in the collection.`,
    schema: z.object({
      dbName: z.string(),
      tableName: z.string(),
    }),
  }
);

export default TableSchemaTool;
