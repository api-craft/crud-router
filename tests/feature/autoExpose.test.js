import { describe, it, beforeAll, afterAll, expect } from "vitest";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import os from "os";
import dotenv from "dotenv";
import autoExposeFromCraft from "../../src/autoExpose.js";

dotenv.config();

describe("autoExposeFromCraft - scans models dir and mounts CRUD routers", () => {
  let app;
  let tmpRoot;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL);

    // Prepare temporary project root and craft.json
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "crud-router-auto-"));
    const craft = {
      basePath: "/api",
      modelsDir: "./models", // not strictly needed since models are pre-registered below
      ignore: ["InternalAudit"],
      filesIgnore: ["README.md"],
      routes: {
        Product: { path: "/products" },
        User: { path: "/users", excluded: ["create"] }
      }
    };
    fs.writeFileSync(path.join(tmpRoot, "craft.json"), JSON.stringify(craft, null, 2));

    // Register models directly to ensure availability regardless of dynamic import
    const ProductSchema = new mongoose.Schema({ name: String, price: Number });
    const UserSchema = new mongoose.Schema({ name: String, email: String });
    const InternalAuditSchema = new mongoose.Schema({ detail: String });
    mongoose.models.Product || mongoose.model("Product", ProductSchema);
    mongoose.models.User || mongoose.model("User", UserSchema);
    mongoose.models.InternalAudit || mongoose.model("InternalAudit", InternalAuditSchema);

    // Initialize app and mount routers
    app = express();
    app.use(express.json());
    await autoExposeFromCraft(app, { rootDir: tmpRoot });

    // Seed data
    const Product = mongoose.model("Product");
    const User = mongoose.model("User");
    await Product.deleteMany({});
    await User.deleteMany({});
    await Product.insertMany([
      { name: "P1", price: 10 },
      { name: "P2", price: 20 },
    ]);
    await User.insertMany([{ name: "U1", email: "u1@test.com" }]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
  });

  it("mounts product router and returns seeded items", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    // createCrud returns an object with data/meta for getAll
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it("respects per-model excluded (User.create excluded)", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "U2", email: "u2@test.com" });
    expect(res.status).toBe(404);
  });

  it("ignores models listed in config.ignore", async () => {
    const res = await request(app).get("/api/internal-audits");
    expect(res.status).toBe(404);
  });
});
