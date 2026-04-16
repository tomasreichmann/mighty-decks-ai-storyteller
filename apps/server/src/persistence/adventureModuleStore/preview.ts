import {
  adventureModulePreviewResponseSchema,
  type AdventureModulePreviewResponse,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type { AdventureModuleStoreRuntime } from "./shared";
import { loadModuleDetail } from "./detail";
import { buildPreviewGroups } from "./records";

export const buildPreview = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    creatorToken?: string;
    showSpoilers?: boolean;
  },
): Promise<AdventureModulePreviewResponse> => {
  const detail = await loadModuleDetail(runtime, options.moduleId, options.creatorToken);
  if (!detail) {
    throw new Error("Adventure module not found.");
  }

  const showSpoilers =
    typeof options.showSpoilers === "boolean" ? options.showSpoilers : detail.ownedByRequester;
  const fragmentsById = new Map(
    detail.fragments.map((fragment) => [fragment.fragment.fragmentId, fragment]),
  );

  const toSummary = (fragmentId: string) => {
    const fragmentRef = detail.index.fragments.find(
      (fragment) => fragment.fragmentId === fragmentId,
    );
    if (!fragmentRef) {
      return undefined;
    }
    const fragmentRecord = fragmentsById.get(fragmentId);
    const hidden = fragmentRef.containsSpoilers && !showSpoilers;
    return {
      fragmentId,
      title: hidden
        ? `Spoiler Fragment ${fragmentRef.kind.replaceAll("_", " ")}`
        : fragmentRef.title,
      hidden,
      containsSpoilers: fragmentRef.containsSpoilers,
      intendedAudience: fragmentRef.intendedAudience,
      content: hidden ? undefined : fragmentRecord?.content,
    };
  };

  return adventureModulePreviewResponseSchema.parse({
    index: detail.index,
    ownedByRequester: detail.ownedByRequester,
    showSpoilers,
    playerSummary: toSummary(detail.index.playerSummaryFragmentId),
    storytellerSummary: toSummary(detail.index.storytellerSummaryFragmentId),
    groups: buildPreviewGroups(detail, showSpoilers),
  });
};
