import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import express from "express";
import mongoose from "mongoose";
import createCrud from "./createCrudRouter.js";
import loadCraftConfig from "./loadCraftConfig.js";

/**
 * Convert string to PascalCase for model name inference
 */
function toPascal(s) {
  return s
    .replace(/(^|[_\-\.\s])(\w)/g, (_, __, c) => c.toUpperCase())
    .replace(/[_\-\.\s]/g, "");
}

const toKebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/**
 * Derive model name from file path (e.g., User.js, user.model.js -> User)
 */
function deriveModelNameFromFile(filePath) {
  const base = path
    .basename(filePath)
    .replace(/\.(mjs|cjs|js)$/i, "")
    .replace(/\.(model|schema|entity|collection)$/i, "");
  return toPascal(base);
}

/**
 * Check if value is a Mongoose Model
 */
function isMongooseModel(v) {
  return typeof v === "function" && v?.modelName && v?.schema;
}

/**
 * Check if value is a Mongoose Schema
 */
function isMongooseSchema(v) {
  return v && v?.constructor?.name === "Schema" && typeof v?.add === "function";
}

/**
 * Resolve mongoose connection from app or options
 */
function resolveConnection(app, opts) {
  return (
    opts.connection ||
    (opts.mongoose && opts.mongoose.connection) ||
    app?.locals?.mongoose?.connection ||
    app?.get?.("mongoose")?.connection ||
    mongoose.connection
  );
}

function collectFiles(dir, files, ignoreNames) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, files, ignoreNames);
    } else if (
      /\.(mjs|cjs|js)$/i.test(entry.name) &&
      !(ignoreNames || []).includes(entry.name)
    ) {
      files.push(full);
    }
  }
}

/**
 * Detect and register models/schemas from various export patterns
 */
async function detectAndRegisterExports(mod, filePath, conn) {
  const tryRegisterSchema = (schema) => {
    const name = deriveModelNameFromFile(filePath);
    if (!conn.models[name]) {
      try {
        conn.model(name, schema);
      } catch (err) {
        // Model may already exist, skip
      }
    }
  };

  const tryRegisterModel = (model) => {
    if (!conn.models[model.modelName]) {
      try {
        conn.model(model.modelName, model.schema);
      } catch (err) {
        // Model may already exist, skip
      }
    }
  };

  const all = { ...(mod || {}) };

  // Handle default export
  if (isMongooseModel(all.default)) {
    tryRegisterModel(all.default);
  } else if (isMongooseSchema(all.default)) {
    tryRegisterSchema(all.default);
  } else if (typeof all.default === "function") {
    // Factory function pattern: export default (conn) => conn.model(...)
    try {
      const maybe = await all.default(conn);
      if (isMongooseModel(maybe)) tryRegisterModel(maybe);
      else if (isMongooseSchema(maybe)) tryRegisterSchema(maybe);
    } catch (_) {
      // Not a factory function or failed
    }
  }

  // Handle named exports
  for (const [key, val] of Object.entries(all)) {
    if (key === "default") continue;

    if (isMongooseModel(val)) {
      tryRegisterModel(val);
    } else if (isMongooseSchema(val)) {
      tryRegisterSchema(val);
    } else if (typeof val === "function") {
      // Named factory function
      try {
        const maybe = await val(conn);
        if (isMongooseModel(maybe)) tryRegisterModel(maybe);
        else if (isMongooseSchema(maybe)) tryRegisterSchema(maybe);
      } catch (_) {
        // Not a factory or failed
      }
    } else if (val && typeof val === "object") {
      // Grouped exports: export const models = { User, Post }
      if (val.models && typeof val.models === "object") {
        for (const m of Object.values(val.models)) {
          if (isMongooseModel(m)) tryRegisterModel(m);
        }
      }
      // Grouped schemas: export const schemas = { UserSchema, PostSchema }
      if (val.schemas && typeof val.schemas === "object") {
        for (const s of Object.values(val.schemas)) {
          if (isMongooseSchema(s)) tryRegisterSchema(s);
        }
      }
    }
  }
}

/**
 * Auto expose CRUD endpoints from models directory using craft.yml or craft.json.
 *
 * @param {import("express").Express} app Express application instance
 * @param {{
 *   rootDir?: string,
 *   configPath?: string,
 *   mountBase?: string,
 *   mongoose?: import("mongoose").Mongoose,
 *   connection?: import("mongoose").Connection
 * }} [opts]
 * @returns {Promise<import("express").Router>} Mounted router
 */
export default async function autoExposeFromCraft(app, opts = {}) {
  const config = await loadCraftConfig(opts.configPath, opts.rootDir);
  const rootDir = opts.rootDir ? path.resolve(opts.rootDir) : process.cwd();
  const modelsDirAbs = path.resolve(rootDir, config.modelsDir);

  // Resolve mongoose connection from app or options
  const conn = resolveConnection(app, opts);

  const files = [];
  if (fs.existsSync(modelsDirAbs)) {
    collectFiles(modelsDirAbs, files, config.filesIgnore || []);
  }

  // Import and register all models
  for (const f of files) {
    try {
      const mod = await import(pathToFileURL(f).href);
      // Detect and register models from various export patterns
      await detectAndRegisterExports(mod, f, conn);
    } catch (err) {
      // Skip failed imports to continue with other models
    }
  }

  const router = express.Router();

  // Create CRUD routers for all registered models
  for (const name of conn.modelNames()) {
    if ((config.ignore || []).includes(name)) continue;

    const perModel = (config.routes || {})[name] || {};
    const routePath = perModel.path || `/${toKebab(name)}s`;

    const options = {
      excluded: perModel.excluded || [],
      hide: perModel.hide || {},
      middlewares: perModel.middlewares || {},
      hooks: perModel.hooks || {},
    };

    const model = conn.model(name);
    router.use(routePath, createCrud(model, options));
  }

  const mountBase = opts.mountBase ?? config.basePath;
  if (app && mountBase) app.use(mountBase, router);

  return router;
}
