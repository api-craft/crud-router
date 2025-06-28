import { describe, test, expect } from "vitest";
import parseProjection from "../../src/parseProjection.js";

describe("parseProjection utility", () => {
  test("parses comma separated fields", () => {
    const input = "name,email,age";
    const expected = { name: 1, email: 1, age: 1 };
    expect(parseProjection(input)).toEqual(expected);
  });

  test("trims spaces and ignores empty fields", () => {
    const input = " name , email , , age ";
    const expected = { name: 1, email: 1, age: 1 };
    expect(parseProjection(input)).toEqual(expected);
  });

  test("returns default fields if input is undefined", () => {
    const defaults = ["title", "content"];
    const expected = { title: 1, content: 1 };
    expect(parseProjection(undefined, defaults)).toEqual(expected);
  });

  test("returns empty object if no input and no defaults", () => {
    expect(parseProjection(undefined)).toEqual({});
  });

  test("handles single field input", () => {
    expect(parseProjection("email")).toEqual({ email: 1 });
  });
});

describe("parseProjection - Edge Cases", () => {
  test("ignores duplicate fields", () => {
    const input = "name,email,email,age,name";
    const expected = { name: 1, email: 1, age: 1 };
    expect(parseProjection(input)).toEqual(expected);
  });

  test("handles fields with dot notation", () => {
    const input = "author.name,comments.text";
    const expected = { "author.name": 1, "comments.text": 1 };
    expect(parseProjection(input)).toEqual(expected);
  });

  test("returns empty projection for empty string", () => {
    expect(parseProjection("")).toEqual({});
  });

  test("ignores fields with only whitespace", () => {
    const input = "  ,  ,  ";
    expect(parseProjection(input)).toEqual({});
  });

  test("handles fields with special characters", () => {
    const input = "field_1,field$2,field-3";
    const expected = { field_1: 1, "field$2": 1, "field-3": 1 };
    expect(parseProjection(input)).toEqual(expected);
  });
});
