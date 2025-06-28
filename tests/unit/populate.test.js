import { describe, test, expect, beforeEach, vi } from "vitest";
import applyPopulate from "../../src/applyPopulate.js";

describe("applyPopulate utility", () => {
  let query;

  beforeEach(() => {
    query = {
      populate: vi.fn().mockReturnThis(),
    };
  });

  test("applies populate with string param", () => {
    const result = applyPopulate(query, "author,comments.user");
    expect(query.populate).toHaveBeenCalledTimes(2);
    expect(query.populate).toHaveBeenCalledWith("author");
    expect(query.populate).toHaveBeenCalledWith("comments.user");
    expect(result).toBe(query);
  });

  test("applies populate with array param", () => {
    const result = applyPopulate(query, ["author", "comments.user"]);
    expect(query.populate).toHaveBeenCalledTimes(2);
    expect(query.populate).toHaveBeenCalledWith("author");
    expect(query.populate).toHaveBeenCalledWith("comments.user");
    expect(result).toBe(query);
  });

  test("applies default populate if no param", () => {
    const defaultPopulate = ["profile", "posts"];
    const result = applyPopulate(query, undefined, defaultPopulate);
    expect(query.populate).toHaveBeenCalledTimes(2);
    expect(query.populate).toHaveBeenCalledWith("profile");
    expect(query.populate).toHaveBeenCalledWith("posts");
    expect(result).toBe(query);
  });

  test("returns query without populate if no fields", () => {
    const result = applyPopulate(query, "", []);
    expect(query.populate).not.toHaveBeenCalled();
    expect(result).toBe(query);
  });
});

describe("applyPopulate - Edge Cases", () => {
  let query;

  beforeEach(() => {
    query = {
      populate: vi.fn().mockReturnThis(),
    };
  });

  test("ignores duplicate populate fields", () => {
    const result = applyPopulate(query, "author,author,comments.user");
    expect(query.populate).toHaveBeenCalledTimes(2);
    expect(query.populate).toHaveBeenCalledWith("author");
    expect(query.populate).toHaveBeenCalledWith("comments.user");
    expect(result).toBe(query);
  });

  test("ignores empty strings in populate param", () => {
    const result = applyPopulate(query, "author,,comments.user,");
    expect(query.populate).toHaveBeenCalledTimes(2);
    expect(query.populate).toHaveBeenCalledWith("author");
    expect(query.populate).toHaveBeenCalledWith("comments.user");
    expect(result).toBe(query);
  });

  test("handles populate param as empty array", () => {
    const result = applyPopulate(query, []);
    expect(query.populate).not.toHaveBeenCalled();
    expect(result).toBe(query);
  });

  test("handles non-string, non-array populate param gracefully", () => {
    const result = applyPopulate(query, 12345);
    expect(query.populate).not.toHaveBeenCalled();
    expect(result).toBe(query);
  });

  test("applies nested populate when given complex paths", () => {
    const result = applyPopulate(query, ["author", "comments.user.profile"]);
    expect(query.populate).toHaveBeenCalledTimes(2);
    expect(query.populate).toHaveBeenCalledWith("author");
    expect(query.populate).toHaveBeenCalledWith("comments.user.profile");
    expect(result).toBe(query);
  });
});