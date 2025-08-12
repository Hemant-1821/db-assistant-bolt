import { dbKeywords } from "./constants";

export function isDbRelatedMessage(msg: string): boolean {
  const lower = msg.toLowerCase();
  return dbKeywords.some((keyword) => lower.includes(keyword));
}

export function getSchemaStructure(document: any) {
  const struct: any = {};
  for (const [key, value] of Object.entries(document)) {
    if (value === null || value === undefined) {
      struct[key] = "unknown-type";
      continue;
    }
    if (typeof value === "object" && Array.isArray(value)) {
      struct[key] = "array";
      continue;
    }
    struct[key] = typeof value;
  }
  return struct;
}
