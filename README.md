﻿# CRUD ROUTER

![NPM Downloads](https://img.shields.io/npm/dy/%40api-craft%2Fcrud-router?logo=npm)
![NPM Downloads](https://img.shields.io/npm/dm/%40api-craft%2Fcrud-router?logo=npm)
![GitHub Repo stars](https://img.shields.io/github/stars/api-craft/crud-router?style=flat&logo=github)
![GitHub Release](https://img.shields.io/github/v/release/api-craft/crud-router)
![GitHub contributors](https://img.shields.io/github/contributors/api-craft/crud-router?logo=github&color=green)


A flexible and customizable CRUD router generator for Express.js and Mongoose, designed to speed up API development with powerful filtering, pagination, bulk actions, projection, populate, and middleware support.

---

## Features

- **Automatic CRUD routes**: `getAll`, `getById`, `create`, `update`, and `remove` for any Mongoose model.
- **Auto-Expose API**: Automatically scan and expose CRUD endpoints from your models directory using `craft.yml` or `craft.json` configuration.
- **Bulk Action**: `bulkUpdate`, `bulkDelete`, `bulkCreate` actions are supported.
- **Exclude routes**: Easily exclude any CRUD method when generating the router.
- **Lifecycle hooks**: Attach hooks for `beforeGetAll`, `afterGetAll`, `beforeGetById`, `afterGetById`, `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, and `afterDelete`.
- **Query parsing**: Support MongoDB-style filtering via URL query parameters with operators like:
  - `gt` (greater than)
  - `gte` (greater than or equal)
  - `lt` (less than)
  - `lte` (less than or equal)
  - `ne` (not equal)
  - `in` (array inclusion)
- **Pagination**: Use `limit` and `page` query parameters for paginated results.
- **Custom middleware**: Apply middleware functions selectively per CRUD route (e.g., middleware only for `getAll` or `delete`).
- **Populate support**: Use `?populate=user,category` to populate references on any route.
- **Projection support**: Use `?fields=name,price` to return only specific fields, with the ability to hide sensitive fields by default.

---

## Installation

```bash
npm install @api-craft/crud-router
```

or with pnpm:

```bash
pnpm add @api-craft/crud-router
```

---

## Usage

> **💡 Important:** When using `autoExposeFromCraft`, always pass your mongoose instance (see [Using Your Mongoose Instance](#using-your-mongoose-instance-recommended)) to avoid version conflicts.

### Manual Router Setup

```js
import express from 'express';
import mongoose from 'mongoose';
import { createCrud } from '@api-craft/crud-router';

const app = express();
app.use(express.json());

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
});

const Product = mongoose.model('Product', productSchema);

const productRouter = createCrud(Product, {
  excluded: ['remove'], // Exclude single delete if needed
  hooks: {
    beforeCreate: async (data) => {
      // Modify data before creation
      return data;
    },
  },
  middlewares: {
    getAll: [(req, res, next) => {
      console.log('Middleware for getAll route');
      next();
    }],
  },
  hide: {
    getAll: ['internalCode'], // Example: Hide sensitive field from responses
  },
});

app.use('/api/products', productRouter);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Auto-Expose API from Models Directory

Automatically generate and mount CRUD routes for all models in a directory using configuration:

**1. Install js-yaml** (if using YAML config):
```bash
pnpm add js-yaml
```

**2. Create `craft.yml` or `craft.json`** in your project root:

```yaml
# craft.yml
basePath: /api
modelsDir: ./models

ignore:
  - InternalAudit

filesIgnore:
  - index.js
  - README.md

routes:
  Product:
    path: /products
    excluded: [remove]
    hide:
      getAll: [internalCode]
      getOne: [internalCode]
  User:
    path: /users
    excluded: [create, remove]
```

Or using JSON:

```json
{
  "basePath": "/api",
  "modelsDir": "./models",
  "ignore": ["InternalAudit"],
  "filesIgnore": ["index.js"],
  "routes": {
    "Product": {
      "path": "/products",
      "excluded": ["remove"],
      "hide": {
        "getAll": ["internalCode"]
      }
    },
    "User": {
      "path": "/users",
      "excluded": ["create", "remove"]
    }
  }
}
```

**3. Use autoExposeFromCraft** in your server:

```js
import express from 'express';
import mongoose from 'mongoose';
import { autoExposeFromCraft } from '@api-craft/crud-router';

const app = express();
app.use(express.json());

await mongoose.connect(process.env.MONGO_URI);

// RECOMMENDED: Pass your mongoose instance to avoid version conflicts
await autoExposeFromCraft(app, { mongoose });

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

> **💡 Best Practice:** Always pass your mongoose instance via `{ mongoose }` or `{ connection }` to avoid conflicts between different mongoose versions in your node_modules tree.

**Configuration Options:**

- `basePath`: Base path for all routes (default: `/api`)
- `modelsDir`: Directory containing model files (default: `./models`)
- `ignore`: Array of model names to skip
- `filesIgnore`: Array of filenames to skip during import
- `routes.[ModelName].path`: Custom path for model (default: kebab-case pluralized model name)
- `routes.[ModelName].excluded`: Array of methods to exclude (`getAll`, `getById`, `create`, `update`, `remove`, `updateBulk`, `removeBulk`)
- `routes.[ModelName].hide`: Object with `getAll` and `getOne` arrays of fields to hide

---

### Supported Model Export Patterns

The auto-expose feature intelligently handles various export patterns:

**Default Export - Model:**
```js
// User.js or user.model.js
import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: String });
export default mongoose.model('User', schema);
```

**Default Export - Schema:**
```js
// Product.js or product.model.js
import mongoose from 'mongoose';
export default new mongoose.Schema({ name: String, price: Number });
// Model name inferred from filename: Product
```

**Named Export - Model:**
```js
// category.model.js
import mongoose from 'mongoose';
const schema = new mongoose.Schema({ title: String });
export const Category = mongoose.model('Category', schema);
```

**Named Export - Schema:**
```js
// tag.model.js
import mongoose from 'mongoose';
export const TagSchema = new mongoose.Schema({ label: String });
// Model name inferred from filename: Tag
```

**Mixed Exports:**
```js
// Order.js
import mongoose from 'mongoose';
const OrderSchema = new mongoose.Schema({ total: Number });
const Order = mongoose.model('Order', OrderSchema);
export default Order;
export { OrderSchema }; // Also exported for reuse
```

**Grouped Exports:**
```js
// index.js
import User from './User.js';
import Product from './Product.js';
export const models = { User, Product };
```

**Factory Functions:**
```js
// Multi-tenant pattern
export default (connection) => {
  const schema = new connection.Schema({ name: String });
  return connection.model('Tenant', schema);
};
```

**File Naming Conventions:**
- `User.js`, `user.js` → Model name: `User`
- `user.model.js`, `UserModel.js` → Model name: `User`
- `user.schema.js`, `user-schema.js` → Model name: `User`
- The suffix `.model`, `.schema`, `.entity`, `.collection` is automatically removed

---

### Using Your Mongoose Instance (Recommended)

**Why pass your mongoose instance?**
- ✅ Avoids mongoose version conflicts between your app and node_modules
- ✅ Ensures models are registered on the same connection instance
- ✅ Prevents "Schema hasn't been registered" errors
- ✅ Required for multi-tenant or multi-database setups

```js
import mongoose from 'mongoose';
import { autoExposeFromCraft } from '@api-craft/crud-router';

// Method 1: Pass mongoose instance (RECOMMENDED)
await mongoose.connect(process.env.MONGO_URI);
await autoExposeFromCraft(app, { mongoose });

// Method 2: Pass specific connection (multi-tenant setups)
const tenantConn = await mongoose.createConnection(process.env.TENANT_DB_URI);
await autoExposeFromCraft(app, { 
  connection: tenantConn,
  mountBase: '/api/tenant'
});

// Method 3: Store in app locals (alternative)
app.locals.mongoose = mongoose;
await autoExposeFromCraft(app); // Will use app.locals.mongoose.connection

// Method 4: Using app.set (Express pattern)
app.set('mongoose', mongoose);
await autoExposeFromCraft(app); // Will use app.get('mongoose').connection
```

**Connection Resolution Priority:**
1. `opts.connection` (direct connection object)
2. `opts.mongoose.connection` (mongoose instance)
3. `app.locals.mongoose.connection` (stored in app locals)
4. `app.get('mongoose').connection` (stored in app settings)
5. `mongoose.connection` (global fallback - not recommended)

---

## API Response Format

All `getAll` endpoints return data in the following format:

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "limit": 10,
    "currentPage": 2,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

When pagination parameters (`limit` and `page`) are not provided, `meta.pagination` will be `false` and only `total` is included.

---

## Example Query Features

- Pagination: `/api/products?limit=10&page=2`
- Filtering: `/api/products?price=gt-100`
- Field Selection (Projection): `/api/products?fields=name,price`
- Populate Related Data: `/api/products?populate=category`

---
## Author
Developed and Maintained by [@tselven](https://github.com/tselven)

## Contributors

<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 20px;">
  <a href="https://github.com/tselven" style="text-align: center; text-decoration: none;">
    <img src="https://avatars.githubusercontent.com/tselven" width="60" style="border-radius: 50%;" alt="@tselven" />
    <div><sub><b>@tselven</b></sub></div>
  </a>
  <!-- Add more contributors here in same format -->
</div>


---
## Contributions

Contributions are welcome for:
- Impliment new drivers and extend the functionalities
- Create and Maintain Docs Pages
- Bug Fix and Code Quality Maintanence.
