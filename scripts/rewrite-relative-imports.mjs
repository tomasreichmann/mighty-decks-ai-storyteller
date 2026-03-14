import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const targetDir = process.argv[2];

if (!targetDir) {
  console.error("Usage: node scripts/rewrite-relative-imports.mjs <directory>");
  process.exit(1);
}

const rootDir = resolve(process.cwd(), targetDir);

const walkFiles = (dir) => {
  const files = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
};

const needsExtensionRewrite = (specifier) =>
  (specifier.startsWith("./") || specifier.startsWith("../")) &&
  !/[.](?:cjs|js|json|mjs)$/.test(specifier);

const rewriteSpecifier = (_, prefix, specifier, suffix) =>
  `${prefix}${needsExtensionRewrite(specifier) ? `${specifier}.js` : specifier}${suffix}`;

const rewriteImports = (source) =>
  source
    .replace(/(from\s+["'])(\.\.?(?:\/[^"'?#]+)+)(["'])/g, rewriteSpecifier)
    .replace(/(import\(\s*["'])(\.\.?(?:\/[^"'?#]+)+)(["']\s*\))/g, rewriteSpecifier);

for (const filePath of walkFiles(rootDir)) {
  const current = readFileSync(filePath, "utf8");
  const next = rewriteImports(current);

  if (next !== current) {
    writeFileSync(filePath, next, "utf8");
  }
}
