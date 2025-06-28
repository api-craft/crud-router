export default function applyPopulate(populateParam) {
  let fields = [];
  
  if (Array.isArray(populateParam)) {
    fields = populateParam
      .filter(f => typeof f === 'string')
      .map(f => f.trim())
      .filter(Boolean);
  } else if (typeof populateParam === "string" && populateParam.trim()) {
    fields = populateParam.split(",").map(f => f.trim()).filter(Boolean);
  }
  // Deduplicate
  return Array.from(new Set(fields));
}