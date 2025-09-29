import { tool } from "@langchain/core/tools";
import z from "zod";
import { client } from "../app";

const ReadFromDBTool = tool(
  async ({ dbName, collectionName, queryObject, limit, sort, project }) => {
    console.log("read from db", {
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
        .project(project || {})
        .toArray();

      //   console.log("results", result);
      return (
        JSON.stringify(result, null, 2) ||
        "No result found. Try again with a more specific query."
      );
    } catch (error) {
      console.error(error);
      return "Failed to retrieve data from the database.";
    }
  },
  {
    name: "readFromDB",
    description: `If user asks to fetch data from a collection or table, use this tool to fetch them. Do not answer from memory.
      Params:
      - dbName(type - string): The name of the database to query (default: "sample_mflix")
      - collectionName(type - string): The name of the collection to query (default: "movies")
      - queryObject(type - JSON object): An optional query object to filter the results. example -> Query for a movie that has the title 'The Room' - { title: "The Room" }
      - limit(type - number): An optional limit on the number of results to return (default: 5)
      - sort(type - JSON object): An optional sort object to sort the results (default: no sorting). example - Sort matched documents in descending order by rating - { "rating": -1 }
      - project(type - JSON object): An optional projection object to specify which fields to return. example - { _id: 0, title: 1, imdb: 1 }.
    
      Returns a list of collection names in the specified database. If no collections are found, returns a message indicating that.`,
    schema: z.object({
      dbName: z.string(),
      collectionName: z.string(),
      queryObject: z.record(z.string(), z.any()).optional(),
      limit: z.number().optional(),
      sort: z.record(z.string(), z.any()).optional(),
      project: z.record(z.string(), z.any()).optional(),
    }),
  }
);

export default ReadFromDBTool;
