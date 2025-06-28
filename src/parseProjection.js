export default function parseProjection(selectParam, blocklist = [], model) {
  const blocked = new Set(blocklist);
  const projection = {};

  if (typeof selectParam === "string") {
    const fields = selectParam
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map(f => f.trim())
      .filter(Boolean);

    if (!fields.length) return {};

    const isNegative = fields.some(f => f.startsWith("-"));

    for (const field of fields) {
      const key = field.replace(/^-/, "");
      if (blocked.has(key)) continue;

      projection[key] = isNegative && field.startsWith("-") ? 0 : 1;
    }

    return Object.keys(projection).length ? projection : {};
  }

  if (selectParam === undefined && model) {
    for (const field of Object.keys(model.schema.paths)) {
      if (!blocked.has(field)) projection[field] = 1;
    }
  }

  return projection;
}
