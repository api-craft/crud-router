import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import express from "express";
import mongoose from "mongoose";
import createCrud from "./createCrudRouter.js";
import loadCraftConfig from "./loadCraftConfig.js";

const toKebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

function collectFiles(dir, files, ignoreNames) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, files, ignoreNames);
    } else if (
      /\.(mjs|cjs|js)$/.test(entry.name) &&
      !(ignoreNames || []).includes(entry.name)
    ) {
      files.push(full);
    }
  }
}

/**
 * Auto expose CRUD endpoints from models directory using craft.yml or craft.json.
 *
 * @param {import("express").Express} app Express application instance
 * @param {{ rootDir?: string, configPath?: string, mountBase?: string }} [opts]
 * @returns {Promise<import("express").Router>} Mounted router
 */
export default async function autoExposeFromCraft(app, opts = {}) {
  const config = await loadCraftConfig(opts.configPath, opts.rootDir);
  const rootDir = opts.rootDir ? path.resolve(opts.rootDir) : process.cwd();
  const modelsDirAbs = path.resolve(rootDir, config.modelsDir);

  const files = [];
  if (fs.existsSync(modelsDirAbs)) {
    collectFiles(modelsDirAbs, files, config.filesIgnore || []);
  }

  for (const f of files) {
    try {
      await import(pathToFileURL(f).href);
    } catch (err) {
      // Skip failed imports to continue with other models
    }
  }

  const router = express.Router();

  for (const name of mongoose.modelNames()) {
    if ((config.ignore || []).includes(name)) continue;

    const perModel = (config.routes || {})[name] || {};
    const routePath = perModel.path || `/${toKebab(name)}s`;

    const options = {
      excluded: perModel.excluded || [],
      hide: perModel.hide || {},
      middlewares: perModel.middlewares || {},
      hooks: perModel.hooks || {},
    };

    const model = mongoose.model(name);
    router.use(routePath, createCrud(model, options));
  }

  const mountBase = opts.mountBase ?? config.basePath;
  if (app && mountBase) app.use(mountBase, router);

  return router;
}
