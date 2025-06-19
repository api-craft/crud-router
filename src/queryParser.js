function queryParser(query) {
  const filters = {};
  const limit = parseInt(query.limit) || 10;
  const page = parseInt(query.page) || 1;
  const skip = (page - 1) * limit;

  const operatorMap = {
    ne: '$ne',
    gt: '$gt',
    gte: '$gte',
    lt: '$lt',
    lte: '$lte',
    in: '$in',
  };

  let unknownOperatorFound = false; // <-- Move this here

  for (const key in query) {
    if (['limit', 'page', 'sort', 'select'].includes(key)) continue;

    const value = query[key];

    if (typeof value === 'string' && value.includes('-')) {
      const [op, raw] = value.split('-', 2);
      const mongoOp = operatorMap[op];

      if (mongoOp) {
        const parsed = op === 'in'
          ? raw.split(',') // "in-a,b,c"
          : isNaN(raw) ? raw : Number(raw);

        filters[key] = { [mongoOp]: parsed };
        continue;
      } else {
        unknownOperatorFound = true;
      }
    }

    // Default equality (no operator)
    filters[key] = isNaN(value) ? value : Number(value);
  }

  if (unknownOperatorFound) {
    // Filter that matches no documents
    return {
      filters: { _id: { $exists: false } },
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

export default queryParser;