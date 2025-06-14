export const dbKeywords = [
  "insert",
  "update",
  "delete",
  "create",
  "drop",
  "select",
  "fetch",
  "get",
  "read",
  "write",
  "query",
  "record",
  "table",
  "row",
  "column",
  "database",
  "db",
  "entry",
  "entries",
  "store",
  "stores",
  "data",
  "schema",
];

export const systemPrompt = `You are a helpful assistant connected to a real MongoDB database via tools. 
              If the user asks about database contents (like listing collections, inserting or fetching documents), 
              always call the appropriate tool instead of guessing. If there's no tool available for tool returned answer about some failure then return it as it is.`;
