// test/createCrudRouter.test.js
import { describe, it, expect } from "vitest";
import { createCrud } from "../src/createCrudRouter.js";
import { model, Schema } from "mongoose";

describe("createCrudRouter", () => {
  it("should return an Express Router", () => {
    const Dummy = model("Dummy", new Schema({ name: String }));
    const router = createCrud(Dummy);
    expect(router).toBeDefined();
  });
});
