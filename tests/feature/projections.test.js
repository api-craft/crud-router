import { describe, it, beforeAll, afterAll, expect } from "vitest";
import mongoose, { model, Schema } from "mongoose";
import express from "express";
import request from "supertest";
import createCrud from "../../src/createCrudRouter.js";
import dotenv from "dotenv";

dotenv.config();

const ProjectionProductSchema = new Schema({
  name: String,
  price: Number,
  description: String,
});

let ProjectionProduct;

describe("createCrudRouter - Projections Feature Tests with blocklist (hide)", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL);
    ProjectionProduct = mongoose.models.ProjectionProduct || model("ProjectionProduct", ProjectionProductSchema);
    await ProjectionProduct.deleteMany({});
    await ProjectionProduct.create([
      { name: "Prod A", price: 10, description: "Desc A" },
      { name: "Prod B", price: 20, description: "Desc B" },
    ]);
  });

  afterAll(async () => {
    await ProjectionProduct.deleteMany({});
    await mongoose.connection.close();
  });

  // Helper to create express app with given hide option
  function createApp(hide) {
    const app = express();
    app.use(express.json());
    app.use("/api/products", createCrud(ProjectionProduct, { hide }));
    return app;
  }

  it("should return only selected fields excluding blocklisted with fields param", async () => {
    const app = createApp({ getAll: ["description"] }); // blocklist 'description'
    const res = await request(app).get("/api/products?fields=name,price,description");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((item) => {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("price");
      expect(item).not.toHaveProperty("description"); // blocked
    });
  });

  it("should return all fields except blocklisted when fields param not provided", async () => {
    const app = createApp({ getAll: ["description"] }); // blocklist description
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((item) => {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("price");
      expect(item).not.toHaveProperty("description"); // blocked
    });
  });

  it("should ignore empty or whitespace-only fields and exclude blocklisted", async () => {
    const app = createApp({ getAll: ["description"] });
    const res = await request(app).get("/api/products?fields=name, ,price,,");

    expect(res.status).toBe(200);
    res.body.data.forEach((item) => {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("price");
      expect(item).not.toHaveProperty("description");
    });
  });

  it("should handle single field input excluding blocklisted", async () => {
    const app = createApp({ getAll: ["description"] });
    const res = await request(app).get("/api/products?fields=price");

    expect(res.status).toBe(200);
    res.body.data.forEach((item) => {
      expect(item).toHaveProperty("price");
      expect(item).not.toHaveProperty("name");
      expect(item).not.toHaveProperty("description");
    });
  });

  it("should return all fields except blocklisted when no fields param and blocklist is empty", async () => {
    const app = createApp({ getAll: [] }); // no blocklist, all allowed
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((item) => {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("price");
      expect(item).toHaveProperty("description");
    });
  });

  it("should ignore blocklisted fields even if requested in fields param", async () => {
    const app = createApp({ getAll: ["description"] });
    const res = await request(app).get("/api/products?fields=description");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((item) => {
      expect(item).not.toHaveProperty("description");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("price");
    });
  });

  it("should handle empty ?fields= query", async () => {
    const app = createApp({ getAll: ["description"] });
    const res = await request(app).get("/api/products?fields=");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((item) => {
      expect(item).not.toHaveProperty("description");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("price");
    });
  });

  it("should allow subset of allowed fields with fields param", async () => {
    const app = createApp({ getAll: ["description"] });
    const res = await request(app).get("/api/products?fields=name");

    expect(res.status).toBe(200);
    res.body.data.forEach((item) => {
      expect(item).toHaveProperty("name");
      expect(item).not.toHaveProperty("price");
      expect(item).not.toHaveProperty("description");
    });
  });
});
