#!/usr/bin/env node
import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const main = async (): Promise<void> => {
  const [, , command, option, destination] = process.argv;
  if (command === "copy-static" && option === "--out" && destination) {
  const packageRoot = resolve(import.meta.dirname, "..");
  await mkdir(destination, { recursive: true });
  for (const folder of ["assets", "generated", "docs", "skills"]) {
    await cp(resolve(packageRoot, folder), resolve(destination, "mighty-decks", folder), { recursive: true, force: true });
  }
  } else {
    console.error("Usage: mighty-decks-components copy-static --out <directory>");
    process.exitCode = 1;
  }
};

void main();
