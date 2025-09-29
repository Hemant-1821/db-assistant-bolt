// export const fetchConversationHistory = async (userId: string) => {
//   try {
//     const history = await client
//       .db("chat")
//       .collection("conversation_history")
//       .find({ userId })
//       .sort({ timestamp: -1 })
//       .limit(100)
//       .toArray();
//     return history[0].chat || [];
//   } catch (error) {
//     console.error("Error fetching conversation history:", error);
//     return [];
//   }
// };

// export const updateConversationHistory = async (
//   userId: string,
//   chat: { role: string; content: string }[]
// ) => {
//   try {
//     await client
//       .db("chat")
//       .collection("conversation_history")
//       .updateOne(
//         { userId },
//         { $set: { userId, chat, timestamp: new Date() } },
//         { upsert: true }
//       );
//   } catch (error) {
//     console.error("Error updating conversation history:", error);
//   }
// };

// export const selectDb = async (dbName: string, userId: string) => {
//   const adminDb = client.db("admin");
//   const result = await adminDb.command({ listDatabases: 1, nameOnly: true });
//   const dbNames = result.databases.map((dbInfo: { name: string }) => {
//     return dbInfo.name;
//   });

//   if (dbNames.includes(dbName)) {
//     // save db name to chat table
//     return await client
//       .db("chat")
//       .collection("settings")
//       .updateOne(
//         { userId },
//         { $set: { userId, selectedDb: dbName, timestamp: new Date() } },
//         { upsert: true }
//       );
//   }

//   throw new Error(`Invalid DB name. Available DBs: ${dbNames.join(", ")}`);
// };
