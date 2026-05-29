import {
  spaceshipBoardStateGetResponseSchema,
  spaceshipBoardStateListResponseSchema,
  spaceshipBoardStateSaveResponseSchema,
  spaceshipBoardStateSetDefaultResponseSchema,
  type SpaceshipBoardState,
  type SpaceshipBoardStateListResponse,
  type SpaceshipBoardStateSaveRequest,
} from "@mighty-decks/spec/spaceshipBoardState";
import { resolveServerUrl } from "./socket";

const buildApiUrl = (path: string): string =>
  new URL(path, resolveServerUrl()).toString();

const fetchJson = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<unknown> => {
  const response = await fetch(input, init);
  const text = await response.text();
  const payload = text.trim().length > 0 ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
};

export const listSpaceshipBoardStates =
  async (): Promise<SpaceshipBoardStateListResponse> => {
    const payload = await fetchJson(buildApiUrl("/api/spaceship-board-states"));
    return spaceshipBoardStateListResponseSchema.parse(payload);
  };

export const getDefaultSpaceshipBoardState =
  async (): Promise<SpaceshipBoardState> => {
    const payload = await fetchJson(
      buildApiUrl("/api/spaceship-board-states/default"),
    );
    return spaceshipBoardStateGetResponseSchema.parse(payload);
  };

export const getSpaceshipBoardState = async (
  stateId: string,
): Promise<SpaceshipBoardState> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/spaceship-board-states/${encodeURIComponent(stateId)}`),
  );
  return spaceshipBoardStateGetResponseSchema.parse(payload);
};

export const saveSpaceshipBoardState = async (
  stateId: string,
  request: SpaceshipBoardStateSaveRequest,
): Promise<SpaceshipBoardState> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/spaceship-board-states/${encodeURIComponent(stateId)}`),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );
  return spaceshipBoardStateSaveResponseSchema.parse(payload);
};

export const setDefaultSpaceshipBoardState = async (
  stateId: string,
): Promise<SpaceshipBoardStateListResponse> => {
  const payload = await fetchJson(
    buildApiUrl("/api/spaceship-board-states/default"),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stateId }),
    },
  );
  return spaceshipBoardStateSetDefaultResponseSchema.parse(payload);
};
