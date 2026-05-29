import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import {
  spaceshipBoardStateErrorSchema,
  spaceshipBoardStateGetResponseSchema,
  spaceshipBoardStateListResponseSchema,
  spaceshipBoardStateSaveRequestSchema,
  spaceshipBoardStateSaveResponseSchema,
  spaceshipBoardStateSetDefaultRequestSchema,
  spaceshipBoardStateSetDefaultResponseSchema,
  spaceshipBoardStateIdSchema,
} from "@mighty-decks/spec/spaceshipBoardState";
import {
  SpaceshipBoardStateForbiddenError,
  SpaceshipBoardStateNotFoundError,
  SpaceshipBoardStateStore,
  SpaceshipBoardStateValidationError,
} from "../persistence/SpaceshipBoardStateStore";

interface RegisterSpaceshipBoardStateRoutesOptions {
  store: SpaceshipBoardStateStore;
}

const stateParamsSchema = z.object({
  stateId: spaceshipBoardStateIdSchema,
});

const sendError = (reply: FastifyReply, statusCode: number, message: string) =>
  reply.code(statusCode).send(spaceshipBoardStateErrorSchema.parse({ message }));

const sendKnownError = (reply: FastifyReply, error: unknown): FastifyReply => {
  if (error instanceof SpaceshipBoardStateNotFoundError) {
    return sendError(reply, 404, error.message);
  }
  if (error instanceof SpaceshipBoardStateForbiddenError) {
    return sendError(reply, 403, error.message);
  }
  if (error instanceof SpaceshipBoardStateValidationError) {
    return sendError(reply, 400, error.message);
  }
  if (error instanceof Error) {
    return sendError(reply, 400, error.message);
  }
  return sendError(reply, 400, "Request failed.");
};

export const registerSpaceshipBoardStateRoutes = (
  app: FastifyInstance,
  options: RegisterSpaceshipBoardStateRoutesOptions,
): void => {
  app.get("/api/spaceship-board-states", async (_request, reply) => {
    try {
      const list = await options.store.listStates();
      return reply.send(spaceshipBoardStateListResponseSchema.parse(list));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.get("/api/spaceship-board-states/default", async (_request, reply) => {
    try {
      const state = await options.store.getDefaultState();
      return reply.send(spaceshipBoardStateGetResponseSchema.parse(state));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.get("/api/spaceship-board-states/:stateId", async (request, reply) => {
    try {
      const params = stateParamsSchema.parse(request.params ?? {});
      const state = await options.store.getState(params.stateId);
      return reply.send(spaceshipBoardStateGetResponseSchema.parse(state));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put("/api/spaceship-board-states/default", async (request, reply) => {
    try {
      const payload = spaceshipBoardStateSetDefaultRequestSchema.parse(request.body);
      const list = await options.store.setDefaultState(payload.stateId);
      return reply.send(spaceshipBoardStateSetDefaultResponseSchema.parse(list));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.put("/api/spaceship-board-states/:stateId", async (request, reply) => {
    try {
      const params = stateParamsSchema.parse(request.params ?? {});
      const payload = spaceshipBoardStateSaveRequestSchema.parse(request.body);
      const state = await options.store.saveState({
        stateId: params.stateId,
        ...payload,
      });
      return reply.send(spaceshipBoardStateSaveResponseSchema.parse(state));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });
};
