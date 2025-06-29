import { describe, test, expect } from "vitest";
import parseProjection from "../../src/parseProjection.js";

// Mock Mongoose model for tests
const mockModel = {
  schema: {
    paths: {
      name: {},
      email: {},
      password: {},
      age: {},
      "author.name": {},
      "comments.text": {},
      field_1: {},
      "field$2": {},
      "field-3": {},
    },
  },
};

describe("parseProjection utility with blocklist (hide) support", () => {
  const blocklist = ["password", "secret"]; // example blocklist

  test("parses comma separated fields and excludes blocklisted fields", () => {
    const input = "name,email,password,age";
    const expected = { name: 1, email: 1, age: 1 };
    expect(parseProjection(input, blocklist, mockModel)).toEqual(expected);
  });

  test("omit blocklisted fields even if they are included in input", () => {
    const input = "name,email,password,age,secret";
    const expected = { name: 1, email: 1, age: 1 };
    expect(parseProjection(input, blocklist, mockModel)).toEqual(expected);
  });

  test("trims spaces, ignores empty fields and excludes blocklist", () => {
    const input = " name , email , , password , age ";
    const expected = { name: 1, email: 1, age: 1 };
    expect(parseProjection(input, blocklist, mockModel)).toEqual(expected);
  });

  test("returns all fields except blocklisted if input is undefined", () => {
    // No fields provided → include all except blocklist
    const expected = {
      name: 1,
      email: 1,
      age: 1,
      "author.name": 1,
      "comments.text": 1,
      field_1: 1,
      "field$2": 1,
      "field-3": 1,
    };
    expect(parseProjection(undefined, blocklist, mockModel)).toEqual(expected);
  });

  test("returns empty object if no input, no model, and blocklist excludes all", () => {
    expect(parseProjection(undefined, blocklist, { schema: { paths: {} } })).toEqual({});
  });

  test("handles single field input, excludes if in blocklist", () => {
    expect(parseProjection("password", blocklist, mockModel)).toEqual({}); // blocked
    expect(parseProjection("email", blocklist, mockModel)).toEqual({ email: 1 }); // allowed
  });
});

describe("parseProjection - Edge Cases with blocklist", () => {
  const blocklist = ["password"];

  test("ignores duplicate fields and excludes blocklist", () => {
    const input = "name,email,email,age,password,name";
    const expected = { name: 1, email: 1, age: 1 };
    expect(parseProjection(input, blocklist, mockModel)).toEqual(expected);
  });

  test("handles fields with dot notation excluding blocklist", () => {
    const input = "author.name,comments.text,password";
    const expected = { "author.name": 1, "comments.text": 1 };
    expect(parseProjection(input, blocklist, mockModel)).toEqual(expected);
  });

  test("returns blocklist projection for empty string", () => {
    expect(parseProjection("", blocklist, mockModel)).toEqual({
      name: 1,
      email: 1,
      age: 1,
      "author.name": 1,
      "comments.text": 1,
      field_1: 1,
      "field$2": 1,
      "field-3": 1,
    });
  });

  test("return with hided fields with only whitespace", () => {
    const input = "  ,  ,  ";
    expect(parseProjection("", blocklist, mockModel)).toEqual({
      name: 1,
      email: 1,
      age: 1,
      "author.name": 1,
      "comments.text": 1,
      field_1: 1,
      "field$2": 1,
      "field-3": 1,
    });
  });

  test("handles fields with special characters excluding blocklist", () => {
    const input = "field_1,field$2,field-3,password";
    const expected = { field_1: 1, "field$2": 1, "field-3": 1 };
    expect(parseProjection(input, blocklist, mockModel)).toEqual(expected);
  });
});
