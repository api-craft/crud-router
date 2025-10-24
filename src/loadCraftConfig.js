import fs from "fs";
import path from "path";

/**
 * Load craft.yml or craft.json from project root.
 * If YAML is used, requires 'js-yaml' dependency.
 *
 * @param {string} [configPath] Optional custom path relative to project root
 * @returns {Promise<{ basePath: string, modelsDir: string, routes: Record<string, any>, ignore: string[], filesIgnore: string[] }>}
 */
export default async function loadCraftConfig(configPath, rootDir) {
  const root = rootDir ? path.resolve(rootDir) : process.cwd();
  const candidates = configPath
    ? [path.resolve(root, configPath)]
    : [
        path.resolve(root, "craft.yml"),
        path.resolve(root, "craft.yaml"),
        path.resolve(root, "craft.json"),
      ];

  let file;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      file = p;
      break;
    }
  }

  if (!file) return defaultConfig();

  const ext = path.extname(file).toLowerCase();
  const raw = fs.readFileSync(file, "utf8");

  if (ext === ".yml" || ext === ".yaml") {
    try {
      const yaml = await import("js-yaml");
      const data = yaml.load(raw) || {};
      return normalizeConfig(data);
    } catch (err) {
      throw new Error(
        "craft.yml found but 'js-yaml' is not installed. Install it (pnpm add js-yaml) or provide craft.json."
      );
    }
  }

  if (ext === ".json") {
    const data = JSON.parse(raw || "{}");
    return normalizeConfig(data);
  }

  return defaultConfig();
}

function defaultConfig() {
  return {
    basePath: "/api",
    modelsDir: "./models",
    routes: {},
    ignore: [],
    filesIgnore: [],
  };
}

function normalizeConfig(cfg = {}) {
  return {
    basePath: typeof cfg.basePath === "string" ? cfg.basePath : "/api",
    modelsDir: typeof cfg.modelsDir === "string" ? cfg.modelsDir : "./models",
    routes: cfg.routes && typeof cfg.routes === "object" ? cfg.routes : {},
    ignore: Array.isArray(cfg.ignore) ? cfg.ignore : [],
    filesIgnore: Array.isArray(cfg.filesIgnore) ? cfg.filesIgnore : [],
  };
}
