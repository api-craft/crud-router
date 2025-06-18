/**
 * @typedef {'getAll'|'getById'|'create'|'update'|'remove'} CrudMethod
 */

/**
 * @typedef CrudHooks
 * @property {(data:any) => Promise<any>} [beforeCreate]
 * @property {(result:any) => Promise<void>} [afterCreate]
 * @property {(id:string, data:any) => Promise<any>} [beforeUpdate]
 * @property {(result:any) => Promise<void>} [afterUpdate]
 * @property {(id:string) => Promise<void>} [beforeDelete]
 * @property {(result:any) => Promise<void>} [afterDelete]
 */

/**
 * @typedef CrudOptions
 * @property {CrudMethod[]} [excluded] Optional methods to exclude
 * @property {CrudHooks} [hooks] Optional lifecycle hooks
 * @property {string} [routeName] Optional route name
 */