import { describe, it, beforeAll, afterAll, expect } from "vitest";
import mongoose, { Schema, model } from "mongoose";
import express from "express";
import request from "supertest";
import createCrud from "../../src/createCrudRouter.js";
import dotenv from "dotenv";

dotenv.config();

// Define schemas
const UserSchema = new Schema({
  name: String,
  email: { type: String, default: () => `${Math.random()}@test.com` } // prevent null
});
const PostSchema = new Schema({
  title: String,
  author: { type: Schema.Types.ObjectId, ref: "User" },
  editor: { type: Schema.Types.ObjectId, ref: "User" },
});

// Declare models
let User, Post, app;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL);
  User = mongoose.models.User || model("User", UserSchema);
  Post = mongoose.models.Post || model("Post", PostSchema);

  await User.deleteMany({});
  await Post.deleteMany({});

  const author = await User.create({ name: "Author User" });
  const editor = await User.create({ name: "Editor User" });

  await Post.insertMany([
    { title: "Post A", author: author._id, editor: editor._id },
    { title: "Post B", author: author._id, editor: editor._id },
  ]);

  app = express();
  app.use(express.json());
  app.use("/api/posts", createCrud(Post));
});

afterAll(async () => {
  await Post.deleteMany({});
  await User.deleteMany({});
  await mongoose.connection.close();
});

const normalizePopulate = (param) => {
  if (Array.isArray(param)) {
    return param.map(f => f.trim()).filter(Boolean);
  }
  if (typeof param === "string" && param.trim()) {
    return param.split(",").map(f => f.trim()).filter(Boolean);
  }
  return undefined;
};

describe("createCrud - populate only via query param", () => {
  it("should return plain ObjectIds when no populate param", async () => {
    const res = await request(app).get("/api/posts");
    expect(res.status).toBe(200);
    expect(typeof res.body[0].author).toBe("string"); // ObjectId
    expect(typeof res.body[0].editor).toBe("string");
  });

  it("should populate author only when populate=author", async () => {
    const res = await request(app).get("/api/posts?populate=author");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0); // Add this line
    expect(res.body[0].author).toHaveProperty("name", "Author User");
    expect(typeof res.body[0].editor).toBe("string");
  });

  it("should populate both author and editor when populate=author,editor", async () => {
    const res = await request(app).get("/api/posts?populate=author,editor");
    expect(res.status).toBe(200);
    expect(res.body[0].author).toHaveProperty("name", "Author User");
    expect(res.body[0].editor).toHaveProperty("name", "Editor User");
  });

  it("should ignore empty populate string", async () => {
    const res = await request(app).get("/api/posts?populate=, ,");
    expect(res.status).toBe(200);
    expect(typeof res.body[0].author).toBe("string");
    expect(typeof res.body[0].editor).toBe("string");
  });

  it("should handle populate as array (simulate controller behavior)", async () => {
    const res = await request(app)
      .get("/api/posts")
      .query({ populate: ["author", "editor"] });

    expect(res.status).toBe(200);
    expect(res.body[0].author).toHaveProperty("name", "Author User");
    expect(res.body[0].editor).toHaveProperty("name", "Editor User");
  });
});
