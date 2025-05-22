import { dbPatterns } from "./constants";

export function isDbRelatedMessage(msg: string): boolean {
  const lower = msg.toLowerCase();
  return dbPatterns.some((pattern) => pattern.test(lower));
}
