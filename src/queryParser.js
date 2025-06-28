/**
 * Parses query parameters into a MongoDB-compatible filter object and pagination settings.
 * 
 * Supports basic equality filtering and advanced operators (e.g., gt, lt, in).
 * Gracefully handles unknown operators by returning a filter that matches no documents.
 * 
 * @param {Object} query - The query object from Express (i.e., req.query).
 * @returns {{
 *   filters: Object,
 *   page: number,
 *   limit: number,
 *   pagination: { skip: number, limit: number }
 * }} An object containing MongoDB filters, page info, and pagination data.
 * 
 * @example
 * Query: ?age=gt-30&status=active&page=2&limit=5
 * queryParser(req.query)
 * 
 * Result:
 * {
 *   filters: { age: { $gt: 30 }, status: 'active' },
 *   page: 2,
 *   limit: 5,
 *   pagination: { skip: 5, limit: 5 }
 * }
 */
export default function queryParser(query) {
  const filters = {};
  const limit = parseInt(query.limit, 10) || 10;
  const page = parseInt(query.page, 10) || 1;
  const skip = (page - 1) * limit;

  const operatorMap = {
    ne: '$ne',
    gt: '$gt',
    gte: '$gte',
    lt: '$lt',
    lte: '$lte',
    in: '$in',
  };

  let unknownOperatorFound = false;

  for (const key in query) {
    if (['limit', 'page', 'sort', 'select', 'fields','populate'].includes(key)) continue;

    const value = query[key];

    if (typeof value === 'string' && value.includes('-')) {
      const [op, raw] = value.split('-', 2);
      const mongoOp = operatorMap[op];

      if (mongoOp) {
        const parsed = op === 'in'
          ? raw.split(',') // e.g., "in-a,b,c" → [a, b, c]
          : isNaN(raw) ? raw : Number(raw);

        filters[key] = { [mongoOp]: parsed };
        continue;
      } else {
        unknownOperatorFound = true;
        break; // No need to continue once an invalid operator is found
      }
    }

    // Default equality
    filters[key] = isNaN(value) ? value : Number(value);
  }

  if (unknownOperatorFound) {
    return {
      filters: { _id: { $exists: false } }, // Ensures no documents match
      page,
      limit,
      pagination: { skip, limit },
    };
  }

  return {
    filters,
    page,
    limit,
    pagination: { skip, limit },
  };
}