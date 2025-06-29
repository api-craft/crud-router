
/**
 * @typedef {Object} CrudOptions
 * 
 * @property {Object} [projections] - Optional field selection per route
 * @property {string[]} [projections.getAll]
 * @property {string[]} [projections.getById]
 * @property {string[]} [projections.create] - Fields to return after creation
 * @property {string[]} [projections.update] - Fields to return after update
 * @property {string[]} [projections.remove] - Fields to return after deletion
 * 
 * @property {string[]} [excluded] - Array of methods to exclude (e.g. ["getAll", "getById", "create"])
 * @property {boolean} [isSafe] - If true, disables bulk operations (create, update, delete)
 * 
 * @property {Object} [middlewares] - Optional Express middlewares for each route
 * @property {import("express").RequestHandler[]} [middlewares.getAll]
 * @property {import("express").RequestHandler[]} [middlewares.getById]
 * @property {import("express").RequestHandler[]} [middlewares.create]
 * @property {import("express").RequestHandler[]} [middlewares.update]
 * @property {import("express").RequestHandler[]} [middlewares.remove]
 * 
 * @property {Object} [hooks] - Optional lifecycle hooks for CRUD operations
 * @property {(req: import("express").Request) => Promise<void>} [hooks.beforeGetAll]
 * @property {(results: any[]) => Promise<void>} [hooks.afterGetAll]
 * 
 * @property {(id: string) => Promise<void>} [hooks.beforeGetById]
 * @property {(result: any) => Promise<void>} [hooks.afterGetById]
 * 
 * @property {(data: any | any[]) => Promise<any | any[]>} [hooks.beforeCreate]
 * @property {(created: any | any[]) => Promise<void>} [hooks.afterCreate]
 * 
 * @property {(updates: { filter: any, update: any }[]) => Promise<any>} [hooks.beforeUpdate]
 * @property {(result: any) => Promise<void>} [hooks.afterUpdate]
 * 
 * @property {(filters: any[]) => Promise<any[]>} [hooks.beforeDelete]
 * @property {(result: any) => Promise<void>} [hooks.afterDelete]
 */