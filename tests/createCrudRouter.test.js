import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
});