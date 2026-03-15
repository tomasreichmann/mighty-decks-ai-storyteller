import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdventureModuleLocationMapPin } from "@mighty-decks/spec/adventureModule";
import type { AdventureModuleResolvedActor } from "@mighty-decks/spec/adventureModuleAuthoring";
import { resolveServerUrl } from "../../lib/socket";
import { ActorCard } from "../cards/ActorCard";
import { Button } from "../common/Button";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";

export interface AdventureModuleLocationPinTarget {
  fragmentId: string;
  kind: "location" | "actor" | "encounter" | "quest";
  title: string;
  slug: string;
  summary?: string;
  routePath: string;
  titleImageUrl?: string;
  actorCard?: {
    baseLayerSlug: AdventureModuleResolvedActor["baseLayerSlug"];
    tacticalRoleSlug: AdventureModuleResolvedActor["tacticalRoleSlug"];
    tacticalSpecialSlug?: AdventureModuleResolvedActor["tacticalSpecialSlug"];
  };
}

interface AdventureModuleLocationMapEditorProps {
  mapImageUrl?: string;
  pins: AdventureModuleLocationMapPin[];
  editable: boolean;
  pinTargets: AdventureModuleLocationPinTarget[];
  onPinsChange: (nextPins: AdventureModuleLocationMapPin[]) => void;
  onFieldBlur: () => void;
  onOpenPinTarget: (target: AdventureModuleLocationPinTarget) => void;
}

const clampPercentage = (value: number): number =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

const toImageSrc = (imageUrl: string): string => {
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  return new URL(imageUrl, resolveServerUrl()).toString();
};

const makeNextPinId = (pins: AdventureModuleLocationMapPin[]): string => {
  const pinIds = new Set(pins.map((pin) => pin.pinId));
  for (let index = 1; index < 10_000; index += 1) {
    const candidate = `pin-${index}`;
    if (!pinIds.has(candidate)) {
      return candidate;
    }
  }
  return `pin-${Date.now()}`;
};

const formatPinTargetLabel = (
  target: AdventureModuleLocationPinTarget,
): string => {
  const kindLabel =
    target.kind.charAt(0).toLocaleUpperCase() + target.kind.slice(1);
  return `${kindLabel}: ${target.title}`;
};

const renderPinTargetPreview = (
  target: AdventureModuleLocationPinTarget,
): JSX.Element => {
  if (target.kind === "actor" && target.actorCard) {
    return (
      <div className="stack gap-2">
        <ActorCard
          className="mx-auto w-full max-w-[10rem]"
          baseLayerSlug={target.actorCard.baseLayerSlug}
          tacticalRoleSlug={target.actorCard.tacticalRoleSlug}
          tacticalSpecialSlug={target.actorCard.tacticalSpecialSlug}
        />
        <div className="stack gap-1">
          <Text variant="emphasised" color="iron" className="text-sm">
            {target.title}
          </Text>
          <Text variant="body" color="iron-light" className="text-xs">
            {target.summary ?? "Actor"}
          </Text>
        </div>
      </div>
    );
  }

  if (target.kind === "location" && target.titleImageUrl) {
    return (
      <div className="stack gap-2">
        <div className="aspect-[4/3] overflow-hidden rounded-sm border border-kac-iron/20 bg-kac-bone-light/70">
          <img
            src={toImageSrc(target.titleImageUrl)}
            alt={target.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="stack gap-1">
          <Text variant="emphasised" color="iron" className="text-sm">
            {target.title}
          </Text>
          <Text variant="body" color="iron-light" className="text-xs">
            {target.summary ?? "Location"}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="stack gap-1 rounded-sm border border-kac-iron/20 bg-kac-bone-light/70 p-3">
      <Text variant="note" color="gold-dark" className="text-[11px] uppercase">
        {target.kind}
      </Text>
      <Text variant="emphasised" color="iron" className="text-sm">
        {target.title}
      </Text>
      <Text variant="body" color="iron-light" className="text-xs">
        {target.summary ?? "No summary yet."}
      </Text>
    </div>
  );
};

export const AdventureModuleLocationMapEditor = ({
  mapImageUrl,
  pins,
  editable,
  pinTargets,
  onPinsChange,
  onFieldBlur,
  onOpenPinTarget,
}: AdventureModuleLocationMapEditorProps): JSX.Element => {
  const mapFrameRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ pinId: string; moved: boolean } | null>(null);
  const suppressClickPinIdRef = useRef<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(
    pins[0]?.pinId ?? null,
  );

  const pinTargetsByFragmentId = useMemo(
    () =>
      new Map(pinTargets.map((target) => [target.fragmentId, target] as const)),
    [pinTargets],
  );
  const groupedPinTargets = useMemo(
    () => ({
      location: pinTargets.filter((target) => target.kind === "location"),
      actor: pinTargets.filter((target) => target.kind === "actor"),
      encounter: pinTargets.filter((target) => target.kind === "encounter"),
      quest: pinTargets.filter((target) => target.kind === "quest"),
    }),
    [pinTargets],
  );

  useEffect(() => {
    if (!selectedPinId) {
      setSelectedPinId(pins[0]?.pinId ?? null);
      return;
    }
    if (!pins.some((pin) => pin.pinId === selectedPinId)) {
      setSelectedPinId(pins[0]?.pinId ?? null);
    }
  }, [pins, selectedPinId]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent): void => {
      const dragState = dragStateRef.current;
      const mapFrame = mapFrameRef.current;
      if (!dragState || !mapFrame || !editable) {
        return;
      }

      const rect = mapFrame.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      dragState.moved = true;
      const nextX = clampPercentage(
        ((event.clientX - rect.left) / rect.width) * 100,
      );
      const nextY = clampPercentage(
        ((event.clientY - rect.top) / rect.height) * 100,
      );
      onPinsChange(
        pins.map((pin) =>
          pin.pinId === dragState.pinId
            ? { ...pin, x: nextX, y: nextY }
            : pin,
        ),
      );
    };

    const handlePointerUp = (): void => {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      dragStateRef.current = null;
      if (dragState.moved) {
        suppressClickPinIdRef.current = dragState.pinId;
        window.setTimeout(() => {
          if (suppressClickPinIdRef.current === dragState.pinId) {
            suppressClickPinIdRef.current = null;
          }
        }, 0);
        onFieldBlur();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [editable, onFieldBlur, onPinsChange, pins]);

  const hoveredPin = useMemo(
    () => pins.find((pin) => pin.pinId === hoveredPinId) ?? null,
    [hoveredPinId, pins],
  );
  const hoveredTarget = hoveredPin
    ? pinTargetsByFragmentId.get(hoveredPin.targetFragmentId) ?? null
    : null;

  const handleAddPin = useCallback((): void => {
    if (!editable || !mapImageUrl || pinTargets.length === 0) {
      return;
    }

    const nextPin: AdventureModuleLocationMapPin = {
      pinId: makeNextPinId(pins),
      x: 50,
      y: 50,
      targetFragmentId: pinTargets[0]!.fragmentId,
    };
    onPinsChange([...pins, nextPin]);
    setSelectedPinId(nextPin.pinId);
  }, [editable, mapImageUrl, onPinsChange, pinTargets, pins]);

  const updatePin = useCallback(
    (
      pinId: string,
      updater: (
        pin: AdventureModuleLocationMapPin,
      ) => AdventureModuleLocationMapPin,
    ): void => {
      onPinsChange(
        pins.map((pin) => (pin.pinId === pinId ? updater(pin) : pin)),
      );
    },
    [onPinsChange, pins],
  );

  const removePin = useCallback(
    (pinId: string): void => {
      onPinsChange(pins.filter((pin) => pin.pinId !== pinId));
      if (hoveredPinId === pinId) {
        setHoveredPinId(null);
      }
      if (selectedPinId === pinId) {
        setSelectedPinId(null);
      }
    },
    [hoveredPinId, onPinsChange, pins, selectedPinId],
  );

  const handleOpenTarget = useCallback(
    (pin: AdventureModuleLocationMapPin): void => {
      if (suppressClickPinIdRef.current === pin.pinId) {
        suppressClickPinIdRef.current = null;
        return;
      }
      const target = pinTargetsByFragmentId.get(pin.targetFragmentId);
      if (target) {
        onOpenPinTarget(target);
      }
    },
    [onOpenPinTarget, pinTargetsByFragmentId],
  );

  return (
    <Panel contentClassName="stack gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Map Pins
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Drag pins to reposition them. Hover to preview linked content and
            click to open the target.
          </Text>
        </div>
        <Button
          color="gold"
          size="sm"
          disabled={!editable || !mapImageUrl || pinTargets.length === 0}
          onClick={handleAddPin}
        >
          Add Pin
        </Button>
      </div>

      {!mapImageUrl ? (
        <Text variant="body" color="iron-light" className="text-sm">
          Add a map image URL before placing pins.
        </Text>
      ) : null}
      {mapImageUrl && pinTargets.length === 0 ? (
        <Text variant="body" color="iron-light" className="text-sm">
          Create at least one actor, location, encounter, or quest before
          adding pins.
        </Text>
      ) : null}

      {mapImageUrl ? (
        <div
          ref={mapFrameRef}
          className="relative overflow-hidden rounded-sm border-2 border-kac-iron bg-kac-iron-dark shadow-[3px_3px_0_0_#121b23]"
        >
          <img
            src={toImageSrc(mapImageUrl)}
            alt="Interactive location map"
            className="block h-auto w-full"
          />

          {pins.map((pin, index) => {
            const target = pinTargetsByFragmentId.get(pin.targetFragmentId) ?? null;
            const isSelected = selectedPinId === pin.pinId;
            return (
              <button
                key={pin.pinId}
                type="button"
                className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                  isSelected
                    ? "border-kac-bone-light bg-kac-gold text-kac-iron"
                    : "border-kac-iron bg-kac-blood-light text-kac-iron-dark"
                } shadow-[1px_1px_0_0_#121b23] transition duration-100 hover:scale-110 ${editable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                }}
                title={target ? target.title : `Pin ${index + 1}`}
                onPointerDown={(event) => {
                  setSelectedPinId(pin.pinId);
                  if (!editable) {
                    return;
                  }
                  event.preventDefault();
                  dragStateRef.current = { pinId: pin.pinId, moved: false };
                }}
                onPointerEnter={() => setHoveredPinId(pin.pinId)}
                onPointerLeave={() =>
                  setHoveredPinId((current) =>
                    current === pin.pinId ? null : current,
                  )
                }
                onClick={() => handleOpenTarget(pin)}
              >
                <span className="sr-only">
                  {target ? target.title : `Pin ${index + 1}`}
                </span>
              </button>
            );
          })}

          {hoveredPin && hoveredTarget ? (
            <div
              className="pointer-events-none absolute z-20 w-56 rounded-sm border-2 border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light p-3 shadow-[4px_4px_0_0_#121b23]"
              style={{
                left: `${hoveredPin.x}%`,
                top: `${hoveredPin.y}%`,
                transform: `translate(${hoveredPin.x > 60 ? "-105%" : "1rem"}, ${hoveredPin.y > 70 ? "-105%" : "1rem"})`,
              }}
            >
              {renderPinTargetPreview(hoveredTarget)}
            </div>
          ) : null}
        </div>
      ) : null}

      {pins.length === 0 ? (
        <Text variant="body" color="iron-light" className="text-sm">
          No pins added yet.
        </Text>
      ) : (
        <div className="stack gap-3">
          {pins.map((pin, index) => {
            const target = pinTargetsByFragmentId.get(pin.targetFragmentId) ?? null;
            return (
              <div
                key={pin.pinId}
                className={`grid gap-3 rounded-sm border-2 px-3 py-3 ${
                  selectedPinId === pin.pinId
                    ? "border-kac-gold-dark bg-kac-gold-light/10"
                    : "border-kac-iron/25 bg-kac-bone-light/30"
                } md:grid-cols-[minmax(0,1fr)_minmax(0,15rem)_auto]`}
                onMouseEnter={() => setHoveredPinId(pin.pinId)}
                onMouseLeave={() =>
                  setHoveredPinId((current) =>
                    current === pin.pinId ? null : current,
                  )
                }
              >
                <div className="stack gap-1">
                  <Text variant="emphasised" color="iron">
                    {target ? target.title : `Pin ${index + 1}`}
                  </Text>
                  <Text variant="body" color="iron-light" className="text-sm">
                    {target?.summary ?? "Choose what this pin links to."}
                  </Text>
                  <Text variant="note" color="steel-dark" className="text-xs">
                    {`${pin.x.toFixed(1)}%, ${pin.y.toFixed(1)}%`}
                  </Text>
                </div>

                <label className="grid gap-1">
                  <Text as="span" variant="note" color="iron" className="text-base">
                    Linked Target
                  </Text>
                  <select
                    className="w-full rounded-sm border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 font-ui text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23]"
                    value={pin.targetFragmentId}
                    onChange={(event) => {
                      updatePin(pin.pinId, (current) => ({
                        ...current,
                        targetFragmentId: event.target.value,
                      }));
                    }}
                    onBlur={onFieldBlur}
                    disabled={!editable}
                  >
                    {groupedPinTargets.location.length > 0 ? (
                      <optgroup label="Locations">
                        {groupedPinTargets.location.map((option) => (
                          <option key={option.fragmentId} value={option.fragmentId}>
                            {formatPinTargetLabel(option)}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                    {groupedPinTargets.actor.length > 0 ? (
                      <optgroup label="Actors">
                        {groupedPinTargets.actor.map((option) => (
                          <option key={option.fragmentId} value={option.fragmentId}>
                            {formatPinTargetLabel(option)}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                    {groupedPinTargets.encounter.length > 0 ? (
                      <optgroup label="Encounters">
                        {groupedPinTargets.encounter.map((option) => (
                          <option key={option.fragmentId} value={option.fragmentId}>
                            {formatPinTargetLabel(option)}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                    {groupedPinTargets.quest.length > 0 ? (
                      <optgroup label="Quests">
                        {groupedPinTargets.quest.map((option) => (
                          <option key={option.fragmentId} value={option.fragmentId}>
                            {formatPinTargetLabel(option)}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                  </select>
                </label>

                <div className="flex items-start justify-end">
                  <Button
                    variant="circle"
                    color="blood"
                    size="sm"
                    aria-label={`Delete pin ${index + 1}`}
                    title={`Delete pin ${index + 1}`}
                    disabled={!editable}
                    onClick={() => removePin(pin.pinId)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 fill-none stroke-current"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M6 6l1 14h10l1-14" />
                      <path d="M10 10v7" />
                      <path d="M14 10v7" />
                    </svg>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
};
