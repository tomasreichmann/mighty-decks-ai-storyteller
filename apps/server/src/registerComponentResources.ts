import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import staticPlugin from "@fastify/static";
import type { FastifyInstance } from "fastify";

const componentsRoot = dirname(fileURLToPath(import.meta.resolve("@mighty-decks/components/package.json")));

export const registerComponentResources = async (app: FastifyInstance): Promise<void> => {
  for (const directory of ["assets", "generated"] as const) {
    const root = resolve(componentsRoot, directory);
    if (!existsSync(root)) throw new Error(`Missing Components ${directory} directory: ${root}`);
    await app.register(staticPlugin, { root, prefix: `/mighty-decks/${directory}/`, decorateReply: false });
  }
  for (const prefix of ["actors", "backgrounds"] as const) {
    await app.register(staticPlugin, { root: resolve(componentsRoot, "assets", prefix), prefix: `/${prefix}/`, decorateReply: false });
  }
  for (const name of ["LICENSE", "NOTICE"] as const) {
    app.get(`/mighty-decks/${name}`, async (_request, reply) => reply.type("text/plain; charset=utf-8").send(await readFile(resolve(componentsRoot, name), "utf8")));
  }
};
