import { describe, it, vi, expect, beforeAll, afterAll } from "vitest";
import mongoose, { model, Schema } from "mongoose";
import request from "supertest";
import express from "express";
import createCrud from "../src/createCrudRouter.js";
import dotenv from 'dotenv';

dotenv.config();

const DummySchema = new Schema({
  name: String,
  price: Number,
  category: String,
});

let Dummy;
let app;

describe("createCrudRouter - Full Edge Case Test", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL);
    Dummy = model("Dummy", DummySchema);
    await Dummy.deleteMany({}); // clean up

    await Dummy.insertMany([
      { name: "Item A", price: 100, category: "tools" },
      { name: "Item B", price: 200, category: "tools" },
      { name: "Item C", price: 300, category: "electronics" },
    ]);

    app = express();
    app.use(express.json());
    app.use("/api/dummy", createCrud(Dummy));
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return an Express Router", () => {
    const router = createCrud(Dummy);
    expect(router).toBeDefined();
  });

  it("should return all items without filters", async () => {
    const res = await request(app).get("/api/dummy");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
  });

  it("should filter by gt price", async () => {
    const res = await request(app).get("/api/dummy?price=gt-150");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it("should filter by lt price", async () => {
    const res = await request(app).get("/api/dummy?price=lt-150");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("should filter by in category", async () => {
    const res = await request(app).get("/api/dummy?category=in-tools,electronics");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
  });

  it("should paginate results correctly", async () => {
    const res = await request(app).get("/api/dummy?limit=1&page=2");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("should support default equality filtering", async () => {
    const res = await request(app).get("/api/dummy?price=100");
    expect(res.status).toBe(200);
    expect(res.body[0].price).toBe(100);
  });

  it("should handle unknown operators gracefully (return empty)", async () => {
    const res = await request(app).get("/api/dummy?price=unknown-9999");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it("should handle unknown operators gracefully (mix)", async () => {
    const res = await request(app).get("/api/dummy?name=Product A&price=unknown-9999");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it("should respect excluded routes", () => {
    const router = createCrud(Dummy, {
      excluded: ["create", "remove"],
    });
    const stack = router.stack.map((layer) => layer.route?.path).filter(Boolean);
    expect(stack.includes("/:id")).toBe(true); // getById
    expect(stack.includes("/")).toBe(true);    // getAll
  });

  it("should allow middleware injection for GET", async () => {
    let middlewareHit = false;

    const testMiddleware = (req, res, next) => {
      middlewareHit = true;
      next();
    };

    const app2 = express();
    app2.use(express.json());
    app2.use("/api/with-middleware", createCrud(Dummy, {
      middlewares: {
        getAll: [testMiddleware]
      }
    }));

    await request(app2).get("/api/with-middleware");
    expect(middlewareHit).toBe(true);
  });

  it("should bulk create items", async () => {
    const res = await request(app).post("/api/dummy").send([
      { name: "Bulk 1", price: 10, category: "bulk" },
      { name: "Bulk 2", price: 20, category: "bulk" }
    ]);
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it("should bulk update items", async () => {
    const docs = await Dummy.find({ category: "bulk" });
    const res = await request(app).put("/api/dummy/bulk").send(
      docs.map((doc, i) => ({
        filter: { _id: doc._id },
        update: { $set: { price: doc.price + 100 } }
      }))
    );
    expect(res.status).toBe(200);
    expect(res.body.modifiedCount || res.body.nModified).toBeDefined();
  });

  it("should bulk delete items", async () => {
    const docs = await Dummy.find({ category: "bulk" });
    const res = await request(app).delete("/api/dummy/bulk").send(
      docs.map((doc) => ({ _id: doc._id }))
    );
    expect(res.status).toBe(200);
    expect(res.body.deletedCount || res.body.nRemoved).toBeDefined();
  });

  it("should call getAll hooks", async () => {
    const beforeGetAll = vi.fn();
    const afterGetAll = vi.fn();

    const appHooked = express();
    appHooked.use(express.json());
    appHooked.use("/api/hooked", createCrud(Dummy, {
      hooks: { beforeGetAll, afterGetAll }
    }));

    await request(appHooked).get("/api/hooked");
    expect(beforeGetAll).toHaveBeenCalled();
    expect(afterGetAll).toHaveBeenCalled();
  });

  it("should call getById hooks", async () => {
    const beforeGetById = vi.fn();
    const afterGetById = vi.fn();
    const doc = await Dummy.findOne();

    const appHooked = express();
    appHooked.use(express.json());
    appHooked.use("/api/hooked2", createCrud(Dummy, {
      hooks: { beforeGetById, afterGetById }
    }));

    await request(appHooked).get(`/api/hooked2/${doc._id}`);
    expect(beforeGetById).toHaveBeenCalled();
    expect(afterGetById).toHaveBeenCalled();
  });
});