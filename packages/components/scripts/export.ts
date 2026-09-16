import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";
import { enumerateStaticCards, type StaticCardEntry } from "../src/catalog";

const packageRoot = resolve(import.meta.dirname, "..");
const parseArgs = (): { family?: string; slug?: string; layout?: string; height?: number } => {
  const args = process.argv.slice(2);
  const get = (name: string): string | undefined => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const height = get("--height");
  return { family: get("--type"), slug: get("--id"), layout: get("--layout"), height: height ? Number.parseInt(height, 10) : undefined };
};
const outputPath = (entry: StaticCardEntry): string => `png/en/${entry.family}/${entry.slug}/${entry.layout}/${entry.height}.png`;
const matches = (entry: StaticCardEntry, filter: ReturnType<typeof parseArgs>): boolean =>
  (!filter.family || entry.family === filter.family) && (!filter.slug || entry.slug === filter.slug) && (!filter.layout || entry.layout === filter.layout) && (!filter.height || entry.height === filter.height);

const filter = parseArgs();
const requestedCompact512 = filter.layout === "compact" && filter.height === 512;
const entries = (requestedCompact512
  ? enumerateStaticCards()
      .filter((entry) => entry.layout === "compact")
      .map((entry) => ({ ...entry, width: 315, height: 512 }))
  : enumerateStaticCards()
).filter((entry) => matches(entry, filter));
if (entries.length === 0) throw new Error("No static cards match the requested filter.");
const staging = resolve(packageRoot, ".export-staging");
await rm(staging, { recursive: true, force: true });
await mkdir(staging, { recursive: true });
const server = await createServer({ root: packageRoot, logLevel: "error", server: { host: "127.0.0.1" } });
await server.listen();
const address = server.resolvedUrls?.local[0];
if (!address) throw new Error("Vite did not expose a local exporter URL.");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 700, height: 1100 }, deviceScaleFactor: 1 });
const manifests: Array<StaticCardEntry & { path: string; checksum: string }> = [];
let browserErrors: string[] = [];
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("createRoot()")) browserErrors.push(message.text());
});
try {
  for (const [index, entry] of entries.entries()) {
    const query = new URLSearchParams({ family: entry.family, slug: entry.slug, layout: entry.layout, width: String(entry.width) });
    browserErrors = [];
    await page.goto(`${address}?${query}`, { waitUntil: "networkidle" });
    const missingAssets = await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
      return [...document.images].filter((image) => image.naturalWidth === 0).map((image) => image.currentSrc || image.src);
    });
    const card = page.locator("[data-card-export] article");
    const box = await card.boundingBox();
    if (!box || Math.abs(box.width - entry.width) > 1 || Math.abs(box.height - entry.height) > 1) throw new Error(`Incorrect export geometry for ${entry.id}: ${JSON.stringify(box)}`);
    if (missingAssets.length > 0) throw new Error(`Missing artwork for ${entry.id}: ${missingAssets.join(", ")}`);
    if (browserErrors.length > 0) throw new Error(`Browser errors for ${entry.id}: ${browserErrors.join("; ")}`);
    const relativePath = outputPath(entry);
    const destination = resolve(staging, relativePath);
    await mkdir(resolve(destination, ".."), { recursive: true });
    await page.screenshot({ path: destination, clip: { x: box.x, y: box.y, width: entry.width, height: entry.height }, omitBackground: true });
    manifests.push({ ...entry, path: relativePath, checksum: createHash("sha256").update(await readFile(destination)).digest("hex") });
    if ((index + 1) % 25 === 0 || index + 1 === entries.length) console.log(`Rendered ${index + 1}/${entries.length}.`);
  }
} finally {
  await browser.close();
  await server.close();
}
await writeFile(resolve(staging, "manifest.json"), JSON.stringify({ locale: "en", entries: manifests }, null, 2) + "\n");
const generated = resolve(packageRoot, "generated");
if (filter.family || filter.slug || filter.layout || filter.height) {
  await cp(staging, generated, { recursive: true, force: true });
} else {
  await rm(resolve(generated, "png"), { recursive: true, force: true });
  // Windows can retain a directory handle briefly after Vite closes, making a
  // same-volume rename fail with EPERM. Copy the fully validated staging tree
  // instead; staging is retained until this branch completes successfully.
  await cp(resolve(staging, "png"), resolve(generated, "png"), {
    recursive: true,
    force: true,
  });
  await writeFile(resolve(generated, "png-manifest.json"), JSON.stringify({ locale: "en", entries: manifests }, null, 2) + "\n");
}
await rm(staging, { recursive: true, force: true });
console.log(`Exported ${manifests.length} PNG cards (${basename(staging)} staging).`);
