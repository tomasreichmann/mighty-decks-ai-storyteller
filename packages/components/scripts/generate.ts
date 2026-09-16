import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cardCatalog, contentVersion } from "../src/catalog";

const packageRoot = resolve(import.meta.dirname, "..");
const outputRoot = resolve(packageRoot, "generated");
const quote = (value: string | undefined): string => `"${(value ?? "").replaceAll('"', '""')}"`;

await rm(outputRoot, { recursive: true, force: true });
await mkdir(resolve(outputRoot, "csv"), { recursive: true });
await mkdir(resolve(outputRoot, "png"), { recursive: true });
const catalogByFamily = cardCatalog.reduce<Record<string, typeof cardCatalog>>((groups, card) => {
  (groups[card.family] ??= []).push(card);
  return groups;
}, {});
for (const [family, cards] of Object.entries(catalogByFamily)) {
  const rows = cards ?? [];
  const csv = ["id,locale,family,slug,title,description,artwork_path,content_version", ...rows.map((card) => [card.id, card.locale, card.family, card.slug, card.title, card.description, card.artworkPath, contentVersion].map(quote).join(","))].join("\n") + "\n";
  await writeFile(resolve(outputRoot, "csv", `${family}.csv`), csv, "utf8");
}
await writeFile(resolve(outputRoot, "manifest.json"), JSON.stringify({ contentVersion, locale: "en", cards: cardCatalog, presets: { full: [{ width: 629, height: 1024 }, { width: 315, height: 512 }], compact: [{ width: 157, height: 256 }] } }, null, 2) + "\n");
const webPublic = resolve(packageRoot, "../../apps/web/public");
for (const directory of ["outcomes", "effects", "stunts", "actors", "assets", "counters", "backgrounds", "types", "text-icons"]) {
  await cp(resolve(webPublic, directory), resolve(packageRoot, "assets", directory), { recursive: true, force: true });
}
console.log(`Generated ${cardCatalog.length} catalog records and CSV projections.`);
