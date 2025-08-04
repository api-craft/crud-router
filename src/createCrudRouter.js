import express from "express";
import queryParser from "./queryParser.js";
import parseProjection from "./parseProjection.js";
import applyPopulate from "./applyPopulate.js";
import sanitizeResponse from "./sanitizeResponse.js";

/**
 * Create a CRUD router for a Mongoose model
 *
 * @param {import("mongoose").Model} model
 * @param {CrudOptions} [options]
 * @returns {import("express").Router}
 */
export default function createCrud(model, options = {}) {
  const router = express.Router();
  const {
    excluded = [],
    hide = {}, // blocklists per route
    middlewares = {},
    hooks = {},
  } = options;
  //console.log("Excluded routes:", excluded);
  function normalizePopulate(populateParam) {
    let input = populateParam;
    if (Array.isArray(populateParam)) {
      input = populateParam.join(",");
    }

    return input
      ?.replace(/^\[|\]$/g, "") // strip brackets
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
  }

  // ========== GET ALL ==========
  if (!excluded.includes("getAll")) {
    router.get("/", ...(middlewares.getAll || []), async (req, res) => {
      try {
        if (hooks.beforeGetAll) await hooks.beforeGetAll(req);

        const { filters: userFilters, limit, pagination } = queryParser(req.query);
        const filters = {
          ...userFilters,
          ...(req.mongoFilters || {}),
        };

        const projection = parseProjection(req.query.fields, hide.getAll, model);
        const populateFields = applyPopulate(normalizePopulate(req.query.populate));

        let query = model.find(filters, projection);
        if (populateFields.length) query = query.populate(populateFields);
        query = query.skip(pagination.skip).limit(limit);

        const [results, total] = await Promise.all([
          query.lean(),
          model.countDocuments(filters),
        ]);

        const sanitizedResults = sanitizeResponse(results, hide.getAll || []);
        const totalPages = Math.ceil(total / limit);
        const currentPage = Math.floor(pagination.skip / limit) + 1;

        if (hooks.afterGetAll) await hooks.afterGetAll(sanitizedResults);

        res.json({
          data: sanitizedResults,
          meta: {
            total,
            limit,
            currentPage,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
          },
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }


  // ========== GET BY ID ==========
  if (!excluded.includes("getById")) {
    router.get("/:id", ...(middlewares.getById || []), async (req, res) => {
      try {
        if (hooks.beforeGetById) await hooks.beforeGetById(req);

        const projection = parseProjection(req.query.fields, hide.getOne, model);

        let query = model.findById(req.params.id, projection);
        const populateFields = applyPopulate(normalizePopulate(req.query.populate));
        if (populateFields.length) query = query.populate(populateFields);

        const item = await query.lean();
        if (!item) return res.status(404).json({ error: "Not found" });

        const sanitizedItem = sanitizeResponse(item, hide.getOne || []);

        if (hooks.afterGetById) await hooks.afterGetById(sanitizedItem);

        res.json(sanitizedItem);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  // ========== CREATE ==========
  if (!excluded.includes("create")) {
    router.post("/", ...(middlewares.create || []), async (req, res) => {
      try {
        let data = req.body;
        if (hooks.beforeCreate) data = await hooks.beforeCreate(req, data);

        const created = Array.isArray(data)
          ? await model.insertMany(data)
          : await model.create(data);

        if (hooks.afterCreate) await hooks.afterCreate(req, created);
        res.status(201).json(created);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });
  }


  // ========== BULK UPDATE ==========
  if (!excluded.includes("updateBulk")) {
    router.put("/bulk", ...(middlewares.update || []), async (req, res) => {
      try {
        let updates = req.body;
        if (!Array.isArray(updates)) {
          return res.status(400).json({ error: "Expected array of updates" });
        }

        if (hooks.beforeUpdate) {
          updates = await hooks.beforeUpdate(req, updates);
        }

        const result = await model.bulkWrite(
          updates.map((u) => ({
            updateOne: { filter: u.filter, update: u.update },
          }))
        );

        if (hooks.afterUpdate) await hooks.afterUpdate(result);
        res.json(result);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });
  }

  // ========== BULK DELETE ==========
  if (!excluded.includes("removeBulk")) {
    router.delete("/bulk", ...(middlewares.remove || []), async (req, res) => {
      try {
        let filters = req.body;
        if (!Array.isArray(filters))
          return res.status(400).json({ error: "Expected array of filters" });

        if (hooks.beforeDelete) filters = await hooks.beforeDelete(req, filters);

        const result = await model.bulkWrite(
          filters.map((f) => ({ deleteOne: { filter: f } }))
        );

        if (hooks.afterDelete) await hooks.afterDelete(req, result);
        res.json(result);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });
  }

  // ========== SINGLE UPDATE ==========
  if (!excluded.includes("update")) {
    router.put("/:id", ...(middlewares.update || []), async (req, res) => {
      try {
        let data = hooks.beforeUpdate
          ? await hooks.beforeUpdate([
            { req: req, filter: { _id: req.params.id }, update: req.body },
          ])
          : req.body;

        const updatePayload = data.update || data;
        const updated = await model.findByIdAndUpdate(req.params.id, updatePayload, {
          new: true,
        });

        if (!updated) return res.status(404).json({ error: "Not found" });

        if (hooks.afterUpdate) await hooks.afterUpdate(req, updated);
        res.json(updated);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });
  }

  // ========== SINGLE DELETE ==========
  if (!excluded.includes("remove")) {
    router.delete("/:id", ...(middlewares.remove || []), async (req, res) => {
      try {
        if (hooks.beforeDelete) await hooks.beforeDelete(req);

        const deleted = await model.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Not found" });

        if (hooks.afterDelete) await hooks.afterDelete(req, deleted);
        res.json(deleted);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });
  }

  return router;
}
