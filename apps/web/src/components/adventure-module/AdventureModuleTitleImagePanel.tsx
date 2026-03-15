import { useEffect, useMemo, useRef, useState } from "react";
import { updateAdventureModuleCoverImage } from "../../lib/adventureModuleApi";
import {
  AdventureModuleGeneratedImageField,
  toImagePromptSnippet,
  toImagePromptTagListSnippet,
} from "./AdventureModuleGeneratedImageField";

const CONTEXT_TAG_OPTIONS = [
  "Module Title",
  "Module Summary",
  "Module Intent",
  "Premise",
  "Have Tags",
  "Avoid Tags",
  "Player Summary",
  "Player Info",
  "Storyteller Summary",
  "Storyteller Info",
] as const;

const DEFAULT_CONTEXT_TAGS: string[] = [
  "Module Title",
  "Premise",
  "Have Tags",
  "Avoid Tags",
  "Player Summary",
];

interface AdventureModuleTitleImagePanelProps {
  moduleId: string;
  creatorToken?: string;
  moduleTitle: string;
  moduleSummary: string;
  moduleIntent: string;
  premise: string;
  haveTags: string[];
  avoidTags: string[];
  playerSummary: string;
  playerInfo: string;
  storytellerSummary: string;
  storytellerInfo: string;
  coverImageUrl?: string;
  disabled?: boolean;
}

const resolveContextLines = (
  selectedContextTags: string[],
  props: AdventureModuleTitleImagePanelProps,
): string[] => {
  const lines: string[] = [];

  for (const selectedTag of selectedContextTags) {
    switch (selectedTag) {
      case "Module Title": {
        const snippet = toImagePromptSnippet(props.moduleTitle, 120);
        if (snippet.length > 0) {
          lines.push(`Module title: ${snippet}`);
        }
        break;
      }
      case "Module Summary": {
        const snippet = toImagePromptSnippet(props.moduleSummary, 300);
        if (snippet.length > 0) {
          lines.push(`Module summary: ${snippet}`);
        }
        break;
      }
      case "Module Intent": {
        const snippet = toImagePromptSnippet(props.moduleIntent, 320);
        if (snippet.length > 0) {
          lines.push(`Authoring intent: ${snippet}`);
        }
        break;
      }
      case "Premise": {
        const snippet = toImagePromptSnippet(props.premise, 500);
        if (snippet.length > 0) {
          lines.push(`Premise: ${snippet}`);
        }
        break;
      }
      case "Have Tags": {
        const snippet = toImagePromptTagListSnippet(props.haveTags, 260);
        if (snippet.length > 0) {
          lines.push(`Preferred themes/tropes: ${snippet}`);
        }
        break;
      }
      case "Avoid Tags": {
        const snippet = toImagePromptTagListSnippet(props.avoidTags, 260);
        if (snippet.length > 0) {
          lines.push(`Avoid these themes/tropes: ${snippet}`);
        }
        break;
      }
      case "Player Summary": {
        const snippet = toImagePromptSnippet(props.playerSummary, 450);
        if (snippet.length > 0) {
          lines.push(`Player summary: ${snippet}`);
        }
        break;
      }
      case "Player Info": {
        const snippet = toImagePromptSnippet(props.playerInfo, 500);
        if (snippet.length > 0) {
          lines.push(`Player info details: ${snippet}`);
        }
        break;
      }
      case "Storyteller Summary": {
        const snippet = toImagePromptSnippet(props.storytellerSummary, 450);
        if (snippet.length > 0) {
          lines.push(`Storyteller summary: ${snippet}`);
        }
        break;
      }
      case "Storyteller Info": {
        const snippet = toImagePromptSnippet(props.storytellerInfo, 500);
        if (snippet.length > 0) {
          lines.push(`Storyteller info details: ${snippet}`);
        }
        break;
      }
      default:
        break;
    }
  }

  return lines;
};

export const AdventureModuleTitleImagePanel = ({
  disabled = false,
  coverImageUrl,
  ...context
}: AdventureModuleTitleImagePanelProps): JSX.Element => {
  const [persistError, setPersistError] = useState<string | null>(null);
  const [persisting, setPersisting] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(
    coverImageUrl?.trim() ?? "",
  );
  const lastPersistedImageUrlRef = useRef(coverImageUrl?.trim() ?? "");

  useEffect(() => {
    const normalizedCoverImageUrl = coverImageUrl?.trim() ?? "";
    setSelectedImageUrl(normalizedCoverImageUrl);
    lastPersistedImageUrlRef.current = normalizedCoverImageUrl;
    setPersistError(null);
    setPersisting(false);
  }, [context.moduleId, coverImageUrl]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const normalizedImageUrl = selectedImageUrl.trim();
    if (normalizedImageUrl === lastPersistedImageUrlRef.current) {
      return;
    }

    let cancelled = false;
    const persistCoverImage = async (): Promise<void> => {
      setPersisting(true);
      setPersistError(null);
      try {
        await updateAdventureModuleCoverImage(
          context.moduleId,
          {
            coverImageUrl:
              normalizedImageUrl.length > 0 ? normalizedImageUrl : null,
          },
          context.creatorToken,
        );
        if (cancelled) {
          return;
        }
        lastPersistedImageUrlRef.current = normalizedImageUrl;
      } catch (nextPersistError) {
        if (cancelled) {
          return;
        }
        setPersistError(
          nextPersistError instanceof Error
            ? nextPersistError.message
            : "Could not save module cover image.",
        );
      } finally {
        if (!cancelled) {
          setPersisting(false);
        }
      }
    };

    void persistCoverImage();

    return () => {
      cancelled = true;
    };
  }, [
    context.creatorToken,
    context.moduleId,
    disabled,
    selectedImageUrl,
  ]);

  const resolveSelectedContextLines = useMemo(
    () =>
      (selectedContextTags: string[]) =>
        resolveContextLines(selectedContextTags, {
          ...context,
          coverImageUrl,
          disabled,
        }),
    [context, coverImageUrl, disabled],
  );

  return (
    <div className="stack gap-3">
      <AdventureModuleGeneratedImageField
        label="Title Image"
        promptLabel="Title Image Prompt"
        promptDescription="Base text used for title image generation."
        contextLabel="Title Image Context"
        contextDescription="Edit the base prompt text. Selected context tags are appended for generation and lookup, but are not shown in the prompt field."
        workflowContextIntro="Title image prompt for adventure module cover art. Refine wording while preserving visual clarity and cinematic composition."
        value={selectedImageUrl}
        onChange={setSelectedImageUrl}
        disabled={disabled}
        identityKey={context.moduleId}
        contextTagOptions={CONTEXT_TAG_OPTIONS}
        defaultContextTags={DEFAULT_CONTEXT_TAGS}
        emptyLabel="No title image selected yet."
        pendingLabel="Generating title image..."
        generateLabel="Generate Title Image"
        valueFieldLabel="Title Image URL"
        resolveContextLines={resolveSelectedContextLines}
      />

      {persisting ? (
        <div className="text-sm text-kac-steel-dark font-ui">
          Saving as module cover image...
        </div>
      ) : null}
      {persistError ? (
        <div className="text-sm text-kac-blood-dark font-ui">
          {persistError}
        </div>
      ) : null}
    </div>
  );
};
