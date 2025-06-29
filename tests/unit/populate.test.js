import { describe, test, expect } from "vitest";
import applyPopulate from "../../src/applyPopulate.js";

describe("applyPopulate - Query Param Only", () => {
  test("handles string param: comma-separated", () => {
    const fields = applyPopulate("author,comments.user");
    expect(fields).toEqual(["author", "comments.user"]);
  });

  test("handles array param", () => {
    const fields = applyPopulate(["author", "comments.user"]);
    expect(fields).toEqual(["author", "comments.user"]);
  });

  test("ignores empty string param", () => {
    const fields = applyPopulate("");
    expect(fields).toEqual([]);
  });

  test("ignores empty array", () => {
    const fields = applyPopulate([]);
    expect(fields).toEqual([]);
  });

  test("ignores non-string, non-array input", () => {
    const fields = applyPopulate(123);
    expect(fields).toEqual([]);
  });

  test("deduplicates repeated fields", () => {
    const fields = applyPopulate("author,author,comments.user");
    expect(fields).toEqual(["author", "comments.user"]);
  });

  test("skips empty entries in string", () => {
    const fields = applyPopulate("author,, ,comments.user,");
    expect(fields).toEqual(["author", "comments.user"]);
  });

  test("handles nested paths", () => {
    const fields = applyPopulate(["user.profile", "comments.author"]);
    expect(fields).toEqual(["user.profile", "comments.author"]);
  });
});
