/**
 * Parses a comma-separated list of fields into a Mongoose projection object.
 * 
 * Used to control which fields are returned in a MongoDB query, either by:
 *   - Reading from the `?fields=` query parameter (comma-separated string), or
 *   - Falling back to a predefined array of default fields (e.g., for route-specific projections).
 *
 * Each valid field name will be added to the projection with a value of `1` (include).
 * 
 * Example:
 *   parseProjection("name,email") ➜ { name: 1, email: 1 }
 *   parseProjection(undefined, ["name", "role"]) ➜ { name: 1, role: 1 }
 * 
 * @param {string | undefined} selectParam - Comma-separated field names, usually from a query string (e.g., req.query.fields)
 * @param {string[]} [defaultFields=[]] - Array of field names to return if selectParam is not provided
 * @returns {Object} A Mongoose projection object where keys are field names and values are `1` (include)
 */
export default function parseProjection(selectParam, defaultFields = []) {
  // If no defaultFields, fallback to original behavior
  if (!defaultFields || defaultFields.length === 0) {
    const fields = selectParam
      ? selectParam.split(",").map(f => f.trim())
      : [];
    const projection = {};
    for (const field of fields) {
      if (field) projection[field] = 1;
    }
    return Object.keys(projection).length > 0 ? projection : {};
  }

  // defaultFields is non-empty array
  const defaultSet = new Set(defaultFields);

  // If selectParam is provided, restrict to intersection with defaultFields
  if (selectParam) {
    const selectedFields = selectParam
      .split(",")
      .map(f => f.trim())
      .filter(f => f && defaultSet.has(f)); // only keep if in defaultFields

    // If after filtering no valid fields, fallback to defaultFields
    if (selectedFields.length === 0) {
      const projection = {};
      for (const field of defaultFields) {
        projection[field] = 1;
      }
      return projection;
    }

    const projection = {};
    for (const field of selectedFields) {
      projection[field] = 1;
    }
    return projection;
  }

  // If no selectParam, use full defaultFields projection
  const projection = {};
  for (const field of defaultFields) {
    projection[field] = 1;
  }
  return projection;
}
