import { tool } from "@langchain/core/tools";
import z from "zod";
import { client } from "../app";

const GetSelectedDatabaseTool = tool(
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
  },
  {
    name: "getSelectedDatabase",
    description: `Tool to get the name of the DB selected by the user.
        Params:
            - userId: The user's ID.
        Returns the selected database name or a message if not set.`,
    schema: z.object({
      userId: z.string(),
    }),
  }
);

export default GetSelectedDatabaseTool;
