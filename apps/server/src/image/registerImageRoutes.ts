import { readFile } from "node:fs/promises";
import type { FastifyInstance, FastifyReply } from "fastify";
import type {
  ImageGenerateJobRequest,
  ImageLookupGroupRequest,
} from "@mighty-decks/spec/imageGeneration";
import { imageProviderSchema } from "@mighty-decks/spec/imageGeneration";
import { ZodError } from "zod";
import { isSafeFileName } from "./ImageNaming";
import {
  ImageGenerationError,
  type ImageGenerationService,
} from "./ImageGenerationService";

const sendError = (
  reply: FastifyReply,
  error: unknown,
  fallbackMessage: string,
): FastifyReply => {
  if (error instanceof ImageGenerationError) {
    return reply.code(error.statusCode).send({
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return reply.code(400).send({
      message: "Invalid request payload.",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  return reply.code(500).send({
    message: fallbackMessage,
  });
};

const parseJobRequest = (value: unknown): ImageGenerateJobRequest => {
  if (!value || typeof value !== "object") {
    throw new ImageGenerationError("Invalid image job payload.", 400);
  }

  return value as ImageGenerateJobRequest;
};

const parseProviderQuery = (value: unknown): "fal" | "leonardo" => {
  const provider =
    typeof value === "string" && value.trim().length > 0 ? value : "fal";
  const parsed = imageProviderSchema.safeParse(provider);
  if (!parsed.success) {
    throw new ImageGenerationError("Invalid provider. Use 'fal' or 'leonardo'.", 400);
  }

  return parsed.data;
};

export const registerImageRoutes = (
  app: FastifyInstance,
  service: ImageGenerationService,
): void => {
  app.get("/api/image/models", async (request, reply) => {
    try {
      const query = request.query as { provider?: unknown };
      const models = await service.listModels(parseProviderQuery(query.provider));
      return reply.send({ models });
    } catch (error) {
      return sendError(reply, error, "Could not fetch image models.");
    }
  });

  app.post("/api/image/groups/lookup", async (request, reply) => {
    try {
      const group = service.lookupGroup(
        request.body as ImageLookupGroupRequest,
      );
      return reply.send({ group });
    } catch (error) {
      return sendError(reply, error, "Could not lookup image group.");
    }
  });

  app.get("/api/image/groups/:groupKey", async (request, reply) => {
    const params = request.params as { groupKey?: string };
    const groupKey = params.groupKey?.trim();
    if (!groupKey) {
      return reply.code(400).send({
        message: "groupKey is required.",
      });
    }

    try {
      const group = service.getGroup(groupKey);
      if (!group) {
        return reply.code(404).send({
          message: "Image group not found.",
        });
      }

      return reply.send({ group });
    } catch (error) {
      return sendError(reply, error, "Could not fetch image group.");
    }
  });

  app.post("/api/image/jobs", async (request, reply) => {
    try {
      const job = await service.createJob(
        parseJobRequest(request.body),
        request.ip,
      );
      return reply.code(201).send({ job });
    } catch (error) {
      return sendError(reply, error, "Could not create image generation job.");
    }
  });

  app.get("/api/image/jobs/:jobId", async (request, reply) => {
    const params = request.params as { jobId?: string };
    const jobId = params.jobId?.trim();
    if (!jobId) {
      return reply.code(400).send({
        message: "jobId is required.",
      });
    }

    try {
      const job = service.getJob(jobId);
      if (!job) {
        return reply.code(404).send({
          message: "Image job not found.",
        });
      }

      return reply.send({ job });
    } catch (error) {
      return sendError(reply, error, "Could not fetch image job.");
    }
  });

  app.patch("/api/image/groups/:groupKey/active", async (request, reply) => {
    const params = request.params as { groupKey?: string };
    const groupKey = params.groupKey?.trim();
    if (!groupKey) {
      return reply.code(400).send({
        message: "groupKey is required.",
      });
    }

    try {
      const group = await service.setActiveImage(
        groupKey,
        request.body as { imageId: string },
      );
      return reply.send({ group });
    } catch (error) {
      return sendError(reply, error, "Could not set active image.");
    }
  });

  app.delete(
    "/api/image/groups/:groupKey/images/:imageId",
    async (request, reply) => {
      const params = request.params as { groupKey?: string; imageId?: string };
      const groupKey = params.groupKey?.trim();
      const imageId = params.imageId?.trim();
      if (!groupKey || !imageId) {
        return reply.code(400).send({
          message: "groupKey and imageId are required.",
        });
      }

      try {
        const group = await service.deleteImage(groupKey, imageId);
        return reply.send({ group });
      } catch (error) {
        return sendError(reply, error, "Could not delete image.");
      }
    },
  );

  app.delete(
    "/api/image/groups/:groupKey/batches/:batchIndex",
    async (request, reply) => {
      const params = request.params as {
        groupKey?: string;
        batchIndex?: string;
      };
      const groupKey = params.groupKey?.trim();
      const parsedBatchIndex = Number(params.batchIndex);
      if (!groupKey || !Number.isInteger(parsedBatchIndex) || parsedBatchIndex < 0) {
        return reply.code(400).send({
          message: "groupKey and a non-negative batchIndex are required.",
        });
      }

      try {
        const group = await service.deleteBatch(groupKey, parsedBatchIndex);
        return reply.send({ group });
      } catch (error) {
        return sendError(reply, error, "Could not delete batch.");
      }
    },
  );

  app.get("/api/image/files/:fileName", async (request, reply) => {
    const params = request.params as { fileName?: string };
    const fileName = params.fileName ?? "";
    if (!isSafeFileName(fileName)) {
      return reply.code(400).send({
        message: "Invalid file name.",
      });
    }

    try {
      const imageFile = await service.getImageFileRecord(fileName);
      if (!imageFile) {
        return reply.code(404).send({
          message: "Image file not found.",
        });
      }

      const body = await readFile(imageFile.absolutePath);
      reply.type(imageFile.contentType);
      return reply.send(body);
    } catch (error) {
      return sendError(reply, error, "Could not load image file.");
    }
  });
};
