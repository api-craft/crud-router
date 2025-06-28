/**
 * Parses populate parameters and applies `.populate()` calls to a Mongoose query.
 * 
 * @param {import('mongoose').Query} query - The Mongoose query object to apply populate on
 * @param {string | string[] | undefined} populateParam - Populate string or array (e.g., "author,comments.user")
 * @param {string[] | undefined} defaultPopulate - Default populate paths if populateParam not provided
 * @returns {import('mongoose').Query} The query with all populates applied
 */
export default function applyPopulate(query, populateParam, defaultPopulate) {
  const parsePopulate = (p) => {
    if (!p) return [];
    if (Array.isArray(p)) return p;
    if (typeof p === "string") {
      return p.split(",").map(f => f.trim()).filter(f => f.length > 0);
    }
    return [];
  };

  const populateFields = parsePopulate(populateParam);

  // Remove duplicates using Set
  const fieldsToPopulate = populateFields.length > 0 
    ? [...new Set(populateFields)]
    : [...new Set(defaultPopulate || [])];

  if (fieldsToPopulate.length === 0) {
    return query;
  }

  fieldsToPopulate.forEach(field => {
    query = query.populate(field);
  });

  return query;
}