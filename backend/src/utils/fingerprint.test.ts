import { describe, it, expect } from "vitest";
import { createFingerprint, getFirstStackFrame } from "./fingerprint";

describe("Issue Fingerprinting", () => {
  it("should extract the first stack frame", () => {
    const stackTrace = `TypeError: Something went wrong
    at CartItem (cart.js:42:13)
    at renderList (list.js:10:5)`;

    const result = getFirstStackFrame(stackTrace);

    expect(result).toBe("at CartItem (cart.js:42:13)");
  });

  it("should generate the same fingerprint for identical errors", () => {
    const first = createFingerprint(
      "TypeError",
      "Cannot read property",
      "at CartItem (cart.js:42:13)"
    );

    const second = createFingerprint(
      "TypeError",
      "Cannot read property",
      "at CartItem (cart.js:42:13)"
    );

    expect(first).toBe(second);
  });

  it("should generate different fingerprints for different stack frames", () => {
    const first = createFingerprint(
      "TypeError",
      "Cannot read property",
      "at CartItem (cart.js:42:13)"
    );

    const second = createFingerprint(
      "TypeError",
      "Cannot read property",
      "at ProductItem (product.js:20:5)"
    );

    expect(first).not.toBe(second);
  });
});
