import { describe, it, expect } from "vitest";
import sanitizeResponse from "../../src/sanitizeResponse.js";

describe("sanitizeResponse", () => {
  it("removes blocked fields from a single object", () => {
    const input = {
      name: "John",
      email: "john@example.com",
      password: "secret",
    };
    const blocklist = ["password"];

    const output = sanitizeResponse(input, blocklist);

    expect(output).toEqual({
      name: "John",
      email: "john@example.com",
    });
    expect(output).not.toHaveProperty("password");
  });

  it("removes blocked fields from an array of objects", () => {
    const input = [
      { name: "Alice", email: "a@test.com", password: "123" },
      { name: "Bob", email: "b@test.com", password: "456" },
    ];
    const blocklist = ["password"];

    const output = sanitizeResponse(input, blocklist);

    expect(output).toEqual([
      { name: "Alice", email: "a@test.com" },
      { name: "Bob", email: "b@test.com" },
    ]);
    expect(output[0]).not.toHaveProperty("password");
  });

  it("handles empty input safely", () => {
    expect(sanitizeResponse(null, ["password"])).toBeNull();
    expect(sanitizeResponse(undefined, ["password"])).toBeUndefined();
  });

  it("does not remove fields when blocklist is empty", () => {
    const input = { name: "Sam", role: "admin" };
    const output = sanitizeResponse(input, []);
    expect(output).toEqual(input);
  });

  it("removes multiple fields correctly", () => {
    const input = {
      name: "Jane",
      role: "admin",
      password: "topsecret",
      token: "jwt123",
    };
    const blocklist = ["password", "token"];

    const output = sanitizeResponse(input, blocklist);

    expect(output).toEqual({
      name: "Jane",
      role: "admin",
    });
    expect(output).not.toHaveProperty("password");
    expect(output).not.toHaveProperty("token");
  });
});