import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import request from "supertest";
import createCrud from "../../src/createCrudRouter.js";

describe("createCrud router with bulk excludes (Vitest)", () => {
  let app;
  let server;
  let ModelMock;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    ModelMock = {
      bulkWrite: vi.fn().mockResolvedValue({ acknowledged: true }),
      findByIdAndUpdate: vi.fn().mockResolvedValue({ _id: "1", name: "Updated" }),
      findByIdAndDelete: vi.fn().mockResolvedValue({ _id: "1" }),
      findById: vi.fn().mockResolvedValue({ _id: "1", name: "Test" }),
      find: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ _id: "1", name: "Test" }]),
      populate: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };

    const router = createCrud(ModelMock, {
      excluded: ["updateBulk", "removeBulk", "remove", "update"],
    });

    app.use("/items", router);
    server = app.listen(0); // random free port
  });

  afterAll(() => {
    server.close();
  });

  it("should 404 on PUT /bulk when 'updateBulk' is excluded", async () => {
    const res = await request(app)
      .put("/items/bulk")
      .send([{ filter: {}, update: { name: "New" } }]);
    expect(res.status).toBe(404);
  });

  it("should 404 on DELETE /bulk when 'removeBulk' is excluded", async () => {
    const res = await request(app)
      .delete("/items/bulk")
      .send([{ _id: "1" }]);
    expect(res.status).toBe(404);
  });

  it("should 404 on PUT /:id (single update) when 'update' is excluded", async () => {
    const res = await request(app)
      .put("/items/1")
      .send({ name: "Updated" });
    expect(res.status).toBe(404);
  });

  it("should 404 on DELETE /:id (single delete) when 'remove' is excluded", async () => {
    const res = await request(app)
      .delete("/items/1");
    expect(res.status).toBe(404);
  });
});
