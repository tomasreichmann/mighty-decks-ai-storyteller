import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { LoadingIndicator } from "../components/common/LoadingIndicator";
import { Panel } from "../components/common/Panel";
import { PendingIndicator } from "../components/PendingIndicator";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";
import { resolveAnimatedLoadingValue } from "./styleguideLoadingProgress";

const loadingRingSamples = [
  { title: "Gold", color: "gold" as const },
  { title: "Cloth", color: "cloth" as const },
  { title: "Fire", color: "fire" as const },
  { title: "Bone", color: "bone" as const },
  { title: "Steel", color: "steel" as const },
  { title: "Blood", color: "blood" as const },
  { title: "Curse", color: "curse" as const },
  { title: "Monster", color: "monster" as const },
  { title: "Skin", color: "skin" as const },
  { title: "Iron", color: "iron" as const },
] as const;

const loadingRingTargetValue = 100;
const loadingRingAnimationDurationMs = 4000;

const useAnimatedLoadingProgress = (
  targetValue: number,
  durationMs: number,
): number => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (targetValue <= 0) {
      setProgress(0);
      return;
    }

    if (typeof window === "undefined") {
      setProgress(targetValue);
      return;
    }

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (prefersReducedMotion) {
      setProgress(targetValue);
      return;
    }

    let startTime: number | null = null;
    let frameId = 0;

    const step = (now: number): void => {
      if (startTime === null) {
        startTime = now;
      }

      const elapsedMs = now - startTime;
      setProgress(
        resolveAnimatedLoadingValue(elapsedMs, targetValue, durationMs),
      );

      if (elapsedMs < durationMs) {
        frameId = window.requestAnimationFrame(step);
      }
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [durationMs, targetValue]);

  return progress;
};

const pendingSamples = [
  {
    label: "Gold",
    pendingLabel: "Loading gold",
    color: "gold" as const,
  },
  {
    label: "Cloth",
    pendingLabel: "Loading cloth",
    color: "cloth" as const,
  },
  {
    label: "Fire",
    pendingLabel: "Loading fire",
    color: "fire" as const,
  },
  {
    label: "Bone",
    pendingLabel: "Loading bone",
    color: "bone" as const,
  },
  {
    label: "Steel",
    pendingLabel: "Loading steel",
    color: "steel" as const,
  },
  {
    label: "Blood",
    pendingLabel: "Loading blood",
    color: "blood" as const,
  },
  {
    label: "Curse",
    pendingLabel: "Loading curse",
    color: "curse" as const,
  },
  {
    label: "Monster",
    pendingLabel: "Loading monster",
    color: "monster" as const,
  },
  {
    label: "Skin",
    pendingLabel: "Loading skin",
    color: "skin" as const,
  },
  {
    label: "Iron",
    pendingLabel: "Loading iron",
    color: "iron" as const,
  },
] as const;

export const StyleguideLoadingPage = (): JSX.Element => {
  const animatedLoadingProgress = useAnimatedLoadingProgress(
    loadingRingTargetValue,
    loadingRingAnimationDurationMs,
  );

  return (
    <div className="styleguide-loading-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Heading
          level="h1"
          color="iron"
          className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
          highlightProps={{
            color: "cloth",
            lineHeight: 8,
            brushHeight: 6,
            lineOffsets: [0, 8, 14, 20],
            className:
              "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
          }}
        >
          Loading
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Keep loading language visible and specific. Use the ring when
          progress can be quantified, animate it from 0 to 100 over 4 seconds,
          keep the percent small, and move the label below the ring. Use the
          dots when the work is still in flight but a percentage would be fake
          precision.
        </Text>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Progress ring
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            The shared `LoadingIndicator` now keeps the percentage tiny and
            moves the color label below the ring. The track defaults to iron,
            iron progress flips to bone so the arc stays readable, and the
            ring animates from 0 to 100 over 4 seconds on page load.
          </Text>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {loadingRingSamples.map((sample) => (
            <div
              key={sample.title}
              className="stack items-center gap-2 rounded-sm border-2 border-kac-iron bg-kac-bone-light/35 p-3 shadow-[3px_3px_0_0_#121b23]"
            >
              <LoadingIndicator
                value={animatedLoadingProgress}
                total={100}
                radius={28}
                thickness={10}
                color={sample.color}
                trackColor={sample.color === "iron" ? "bone" : "iron"}
                ariaLabel={`${sample.title} progress`}
              >
                <Text
                  as="span"
                  variant="note"
                  color="iron"
                  className="text-[0.75rem] font-bold leading-none tracking-[0.08em] opacity-100"
                >
                  {Math.round(animatedLoadingProgress)}%
                </Text>
              </LoadingIndicator>

              <Label
                color={sample.color === "iron" ? "steel" : sample.color}
                size="sm"
                rotate={false}
                className="self-center"
              >
                {sample.title}
              </Label>
            </div>
          ))}
        </div>
      </Panel>

      <Panel as="section" tone="cloth" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Pending dots
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            The shared `PendingIndicator` now shows the full color family, with
            an iron border for most tones and a steel border when the dots
            themselves are iron.
          </Text>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pendingSamples.map((sample) => (
            <div
              key={sample.label}
              className="stack gap-3 rounded-sm border-2 border-kac-iron bg-kac-bone-light/35 p-3 shadow-[3px_3px_0_0_#121b23]"
            >
              <Label
                color={sample.color === "iron" ? "steel" : sample.color}
                size="sm"
                rotate={false}
                className="self-start"
              >
                {sample.label}
              </Label>
              <PendingIndicator
                label={sample.pendingLabel}
                color={sample.color}
              />
            </div>
          ))}
        </div>
      </Panel>

      <Link
        to="/styleguide"
        className="inline-flex items-center gap-2 self-start font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron transition hover:text-kac-blood-dark"
      >
        <span aria-hidden="true">&larr;</span>
        Back to Overview
      </Link>
    </div>
  );
};
