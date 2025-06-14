import { dbKeywords } from "./constants";

export function isDbRelatedMessage(msg: string): boolean {
  const lower = msg.toLowerCase();
  return dbKeywords.some((keyword) => lower.includes(keyword));
}
