// crudOptions.js

/**
 * @typedef {'getAll' | 'getById' | 'create' | 'update' | 'remove'} CrudMethod
 */

/**
 * @typedef {Object} CrudHooks
 * @property {(data: any) => Promise<any>} [beforeCreate]
 * @property {(result: any) => Promise<void>} [afterCreate]
 * @property {(id: string, data: any) => Promise<any>} [beforeUpdate]
 * @property {(result: any) => Promise<void>} [afterUpdate]
 * @property {(id: string) => Promise<void>} [beforeDelete]
 * @property {(result: any) => Promise<void>} [afterDelete]
 */

/**
 * @typedef {Object} CrudOptions
 * @property {CrudMethod[]} [excluded]
 * @property {CrudHooks} [hooks]
 * @property {string} [routeName]
 */

// Export nothing, just types for JSDoc usage
export {};
