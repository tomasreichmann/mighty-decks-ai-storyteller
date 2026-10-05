import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const owned = /^(?:spec\/|apps\/(?:server|web)\/(?:src|test|tests|scripts)\/|scripts\/).*\.tsx?$/;

export function physicalLines(content) {
  if (content.length === 0) return 0;
  const parts = content.replace(/\r\n?/g, "\n").split("\n");
  return parts.length - (parts.at(-1) === "" ? 1 : 0);
}

export function inspectLengths(root, paths, exceptions = {}) {
  const findings = [];
  const seen = new Set();
  for (const path of paths) {
    if (!owned.test(path)) continue;
    seen.add(path);
    const lines = physicalLines(readFileSync(resolve(root, path), "utf8"));
    const reason = exceptions[path];
    if (lines > 350 && !reason) findings.push({ path, lines, level: "error" });
    else if (lines > 300 && !reason) findings.push({ path, lines, level: "warning" });
  }
  for (const [path, reason] of Object.entries(exceptions)) {
    if (!owned.test(path) || typeof reason !== "string" || !reason.trim()) {
      findings.push({ path, lines: 0, level: "error", reason: "invalid exception" });
    } else if (!seen.has(path) || physicalLines(readFileSync(resolve(root, path), "utf8")) <= 350) {
      findings.push({ path, lines: 0, level: "error", reason: "stale exception" });
    }
  }
  return findings.sort((a, b) => a.path.localeCompare(b.path));
}

export function gitSourcePaths(root) {
  const bytes = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root });
  return [...new Set(bytes.toString("utf8").split("\0").filter(Boolean).map((p) => p.replaceAll("\\", "/")))]
    .filter((path) => existsSync(resolve(root, path)));
}

export function run(root = defaultRoot) {
  const exceptions = JSON.parse(readFileSync(resolve(root, "scripts/file-length-exceptions.json"), "utf8"));
  const findings = inspectLengths(root, gitSourcePaths(root), exceptions);
  for (const item of findings) console.log(`${item.level}: ${item.path}: ${item.reason ?? `${item.lines} lines`}`);
  const errors = findings.filter((item) => item.level === "error").length;
  console.log(`File lengths: ${errors} errors, ${findings.length - errors} warnings (limit 350; warning above 300).`);
  return errors ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = run(process.argv[2] ? resolve(process.argv[2]) : defaultRoot);
}
