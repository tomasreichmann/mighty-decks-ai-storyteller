import { readFile } from "node:fs/promises";
import type { FastifyInstance, FastifyReply } from "fastify";
import { isSafeFileName } from "../image/ImageNaming";
import type { AdventureArtifactStore } from "../persistence/AdventureArtifactStore";

const IMAGE_CONTENT_TYPE_PATTERN = /^image\/.*$/i;
const RAW_IMAGE_BODY_LIMIT_BYTES = 10 * 1024 * 1024;

const sendError = (reply: FastifyReply, message: string, statusCode = 400): FastifyReply =>
  reply.code(statusCode).send({
    message,
  });

const parseUploadHint = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const registerAdventureArtifactRoutes = (
  app: FastifyInstance,
  options: {
    store: AdventureArtifactStore;
  },
): void => {
  app.addContentTypeParser(
    IMAGE_CONTENT_TYPE_PATTERN,
    { parseAs: "buffer" },
    (_request, body, done) => {
      done(null, body);
    },
  );

  app.get("/api/adventure-artifacts/:fileName", async (request, reply) => {
    const params = request.params as { fileName?: string };
    const fileName = params.fileName ?? "";
    if (!isSafeFileName(fileName)) {
      return sendError(reply, "Invalid file name.", 400);
    }

    const record = await options.store.getFileRecord(fileName);
    if (!record) {
      return sendError(reply, "Adventure artifact not found.", 404);
    }

    const body = await readFile(options.store.resolveAbsolutePath(fileName));
    reply.type(record.contentType);
    return reply.send(body);
  });

  app.post(
    "/api/adventure-artifacts/images",
    {
      bodyLimit: RAW_IMAGE_BODY_LIMIT_BYTES,
    },
    async (request, reply) => {
      const contentTypeHeader = request.headers["content-type"];
      if (
        typeof contentTypeHeader !== "string" ||
        !IMAGE_CONTENT_TYPE_PATTERN.test(contentTypeHeader)
      ) {
        return sendError(reply, "Unsupported image content type.", 415);
      }

      if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
        return sendError(reply, "Image upload is empty.", 400);
      }

      const hint =
        parseUploadHint(request.headers["x-upload-hint"]) ??
        parseUploadHint(request.headers["x-file-hint"]);

      try {
        const artifact = await options.store.persistImageBuffer(
          request.body,
          contentTypeHeader,
          {
            hint,
          },
        );
        return reply.code(201).send({ artifact });
      } catch (error) {
        return sendError(
          reply,
          error instanceof Error ? error.message : "Could not save image upload.",
          400,
        );
      }
    },
  );
};
