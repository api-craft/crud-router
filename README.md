# CRUD ROUTER

![NPM Downloads](https://img.shields.io/npm/dm/%40api-craft%2Fcrud-router?logo=npm)
![GitHub Repo stars](https://img.shields.io/github/stars/api-craft/crud-router?style=flat&logo=github)
![GitHub Release](https://img.shields.io/github/v/release/api-craft/crud-router)
![GitHub contributors](https://img.shields.io/github/contributors/api-craft/crud-router?logo=github&color=green)


A flexible and customizable CRUD router generator for Express.js and Mongoose, designed to speed up API development with powerful filtering, pagination, bulk actions, projection, populate, and middleware support.

---

## Features

- **Automatic CRUD routes**: `getAll`, `getById`, `create`, `update`, and `remove` for any Mongoose model.
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

```js
import express from 'express';
import mongoose from 'mongoose';
import createCrud from '@api-craft/crud-router';

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

---

## Example Query Features

- Pagination: `/api/products?limit=10&page=2`
- Filtering: `/api/products?price[gt]=100`
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
