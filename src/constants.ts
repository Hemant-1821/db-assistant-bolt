export const dbPatterns = [
  /^\/db /i, // Slash command
  /^(create|add|insert) record/i, // Create
  /^insert into/i,
  /^add new (user|record|entry)/i,

  /^(read|get|fetch|show) (data|record)/i, // Read
  /^get all/i,
  /^fetch .* from/i,

  /^(update|edit|modify) (record|row|entry)/i, // Update
  /^update .* set/i,

  /^(delete|remove|drop) (record|entry)/i, // Delete
  /^delete from/i,
];
