import express from 'express';

/**
 * 
 * @param {import("mongoose").Model} model - Mongoose model
 * @param {{
 *   routeName?: string,
 *   excluded?: string[],
 *   hooks?: {
 *     beforeCreate?: (data) => Promise<any>,
 *     afterCreate?: (doc) => Promise<void>,
 *     beforeUpdate?: (id, data) => Promise<any>,
 *     afterUpdate?: (doc) => Promise<void>,
 *     beforeDelete?: (id) => Promise<void>,
 *     afterDelete?: (doc) => Promise<void>,
 *   }
 * }} options 
 * @returns {import("express").Router}
 */
export function createCrudRouter(model, options = {}) {
  const router = express.Router();
  const name = options.routeName || model.modelName.toLowerCase();
  const excluded = options.excluded || [];
  const hooks = options.hooks || {};

  // GET All
  if (!excluded.includes("getAll")) {
    router.get("/", async (req, res) => {
      const results = await model.find({});
      return res.json(results);
    });
  }

  // GET by ID
  if (!excluded.includes("getById")) {
    router.get("/:id", async (req, res) => {
      const item = await model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: "Not found" });
      return res.json(item);
    });
  }

  // CREATE
  if (!excluded.includes("create")) {
    router.post("/", async (req, res) => {
      const data = hooks.beforeCreate
        ? await hooks.beforeCreate(req.body)
        : req.body;
      const created = await model.create(data);
      if (hooks.afterCreate) await hooks.afterCreate(created);
      return res.status(201).json(created);
    });
  }

  // UPDATE
  if (!excluded.includes("update")) {
    router.put("/:id", async (req, res) => {
      const data = hooks.beforeUpdate
        ? await hooks.beforeUpdate(req.params.id, req.body)
        : req.body;
      const updated = await model.findByIdAndUpdate(req.params.id, data, {
        new: true,
      });
      if (!updated) return res.status(404).json({ error: "Not found" });
      if (hooks.afterUpdate) await hooks.afterUpdate(updated);
      return res.json(updated);
    });
  }

  // DELETE
  if (!excluded.includes("remove")) {
    router.delete("/:id", async (req, res) => {
      if (hooks.beforeDelete) await hooks.beforeDelete(req.params.id);
      const deleted = await model.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      if (hooks.afterDelete) await hooks.afterDelete(deleted);
      return res.json(deleted);
    });
  }

  return router;
}