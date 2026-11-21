import { createHash } from "crypto";

export const getFirstStackFrame = (stackTrace: string): string => {
  const frames = stackTrace
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return frames.find((line) => line.startsWith("at ") || line.includes("@")) ?? frames[0];
};

export const createFingerprint = (
  errorType: string,
  message: string,
  firstFrame: string
): string => {
  return createHash("sha256")
    .update(JSON.stringify([errorType, message, firstFrame]))
    .digest("hex");
};
