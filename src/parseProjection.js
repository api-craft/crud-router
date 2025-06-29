export default function parseProjection(selectParam, blocklist = [], model) {
  const blocked = new Set(blocklist);
  const projection = {};

  // Case: empty string like "?fields="
  if (selectParam === "") {
    if (model) {
      for (const field of Object.keys(model.schema.paths)) {
        if (!blocked.has(field)) projection[field] = 1;
      }
    }
    return projection;
  }

  // Case: fields provided as string
  if (typeof selectParam === "string") {
    const fields = selectParam
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map(f => f.trim())
      .filter(Boolean);

    if (!fields.length) {
      // After cleaning, nothing valid → fallback to default projection
      if (model) {
        for (const field of Object.keys(model.schema.paths)) {
          if (!blocked.has(field)) projection[field] = 1;
        }
      }
      return projection;
    }

    const isNegative = fields.some(f => f.startsWith("-"));

    for (const field of fields) {
      const key = field.replace(/^-/, "");
      if (blocked.has(key)) continue;

      projection[key] = isNegative && field.startsWith("-") ? 0 : 1;
    }

    // ✅ Final safeguard: remove any blocked fields that were mistakenly marked
    for (const key of Object.keys(projection)) {
      if (blocked.has(key)) delete projection[key];
    }
    
    return Object.keys(projection).length ? projection : {};
  }

  // Case: selectParam is undefined → full field access minus blocklist
  if (selectParam === undefined || selectParam == "" && model) {
    for (const field of Object.keys(model.schema.paths)) {
      if (!blocked.has(field)) projection[field] = 1;
    }
  }

  return projection;
}
