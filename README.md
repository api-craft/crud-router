# CRUD ROUTER

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

// Auto-scan models directory and mount CRUD routers
await autoExposeFromCraft(app);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Configuration Options:**

- `basePath`: Base path for all routes (default: `/api`)
- `modelsDir`: Directory containing model files (default: `./models`)
- `ignore`: Array of model names to skip
- `filesIgnore`: Array of filenames to skip during import
- `routes.[ModelName].path`: Custom path for model (default: kebab-case pluralized model name)
- `routes.[ModelName].excluded`: Array of methods to exclude (`getAll`, `getById`, `create`, `update`, `remove`, `updateBulk`, `removeBulk`)
- `routes.[ModelName].hide`: Object with `getAll` and `getOne` arrays of fields to hide

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
