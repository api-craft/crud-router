export default function sanitizeResponse(data, blocklist = []) {
  if (!data) return data;

  const blocked = new Set(blocklist);

  function recursiveClean(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(recursiveClean);
    } else if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (blocked.has(key)) {
          delete obj[key];
        } else {
          recursiveClean(obj[key]);
        }
      }
    }
  }

  // Deep clone if you want immutable approach or modify in place
  recursiveClean(data);
  return data;
}