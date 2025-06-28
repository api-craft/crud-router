import express from "express";
import queryParser from "./queryParser.js";
import parseProjection from "./parseProjection.js";
import applyPopulate from "./applyPopulate.js";

/**
 * Creates a CRUD router for a Mongoose model with lifecycle hooks and middleware support.
 *
 * @param {import("mongoose").Model} model - The Mongoose model to build CRUD routes for
 * @param {CrudOptions} [options] - Optional settings for excluded routes, hooks, and middleware
 * @returns {import("express").Router}
 */
export default function createCrud(model, options = {}) {
  const router = express.Router();
  const excluded = options.excluded || [];
  const projections = options.projections || {};
  const isSafe = options.isSafe || false;
  const hooks = options.hooks || {};
  const middlewares = options.middlewares || {};

  // Helper: normalize populate param (string or undefined)
function normalizePopulate(populate) {
  if (typeof populate === "string" && populate.trim() !== "") {
    return populate
      .split(",")
      .map((field) => field.trim())
      .filter((field) => field.length > 0);
  }
  return undefined;
}

  // GET All with query parsing
  if (!excluded.includes("getAll") && !isSafe) {
    router.get("/", ...(middlewares.getAll || []), async (req, res) => {
      try {
        if (hooks.beforeGetAll) await hooks.beforeGetAll(req);

        const { filters, limit, pagination } = queryParser(req.query);
        const projection = parseProjection(
          projections.getAll ? undefined : req.query.fields,
          projections.getAll
        );

        let query = model.find(filters, projection).skip(pagination.skip).limit(limit);

        const populateParam = normalizePopulate(req.query.populate);

        query = applyPopulate(query, populateParam, options.populate?.getAll);

        const results = await query.lean();

        if (hooks.afterGetAll) await hooks.afterGetAll(results);

        return res.json(results);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });
  }

  // GET by ID
  if (!excluded.includes("getById")) {
    router.get("/:id", ...(middlewares.getById || []), async (req, res) => {
      try {
        if (hooks.beforeGetById) await hooks.beforeGetById(req.params.id);

        const projection = parseProjection(
          projections.getById ? undefined : req.query.fields,
          projections.getById
        );

        let query = model.findById(req.params.id, projection);

        const populateParam = normalizePopulate(req.query.populate);

        query = applyPopulate(query, populateParam, options.populate?.getById);

        const item = await query.lean();
        if (!item) return res.status(404).json({ error: "Not found" });

        if (hooks.afterGetById) await hooks.afterGetById(item);

        return res.json(item);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });
  }

  // CREATE (single or bulk based on body)
  if (!excluded.includes("create")) {
    router.post("/", ...(middlewares.create || []), async (req, res) => {
      try {
        let data = req.body;
        if (hooks.beforeCreate) data = await hooks.beforeCreate(data);

        const created = Array.isArray(data)
          ? await model.insertMany(data)
          : await model.create(data);

        if (hooks.afterCreate) await hooks.afterCreate(created);

        return res.status(201).json(created);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    });
  }

  // BULK UPDATE
  if (!excluded.includes("update")) {
    if (!isSafe) {
      router.put("/bulk", ...(middlewares.update || []), async (req, res) => {
        try {
          let updates = req.body; // Array of { filter, update }
          if (!Array.isArray(updates))
            return res.status(400).json({ error: "Expected array of updates" });

          if (hooks.beforeUpdate) {
            updates = await hooks.beforeUpdate(updates);
          }

          const result = await model.bulkWrite(
            updates.map((u) => ({
              updateOne: {
                filter: u.filter,
                update: u.update,
              },
            }))
          );

          if (hooks.afterUpdate) await hooks.afterUpdate(result);

          return res.json(result);
        } catch (err) {
          return res.status(400).json({ error: err.message });
        }
      });
    }

    // Single update
    router.put("/:id", ...(middlewares.update || []), async (req, res) => {
      try {
        let data = hooks.beforeUpdate
          ? await hooks.beforeUpdate([{ filter: { _id: req.params.id }, update: req.body }])
          : req.body;

        const updated = await model.findByIdAndUpdate(req.params.id, data.update || data, {
          new: true,
        });

        if (!updated) return res.status(404).json({ error: "Not found" });

        if (hooks.afterUpdate) await hooks.afterUpdate(updated);

        return res.json(updated);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    });
  }

  // BULK DELETE
  if (!excluded.includes("remove")) {
    if (!isSafe) {
      router.delete(
        "/bulk",
        ...(middlewares.remove || []),
        async (req, res) => {
          try {
            let filters = req.body; // Array of filters

            if (!Array.isArray(filters))
              return res.status(400).json({ error: "Expected array of filters" });

            if (hooks.beforeDelete) {
              filters = await hooks.beforeDelete(filters);
            }

            const result = await model.bulkWrite(
              filters.map((f) => ({
                deleteOne: { filter: f },
              }))
            );

            if (hooks.afterDelete) await hooks.afterDelete(result);

            return res.json(result);
          } catch (err) {
            return res.status(400).json({ error: err.message });
          }
        }
      );
    }

    // Single delete
    router.delete("/:id", ...(middlewares.remove || []), async (req, res) => {
      try {
        if (hooks.beforeDelete) await hooks.beforeDelete([{ _id: req.params.id }]);

        const deleted = await model.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Not found" });

        if (hooks.afterDelete) await hooks.afterDelete(deleted);

        return res.json(deleted);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    });
  }

  return router;
}