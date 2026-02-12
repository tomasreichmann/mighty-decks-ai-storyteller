import { FormEvent, useEffect, useMemo, useState } from "react";
import type { PlayerSetup } from "@mighty-decks/spec/adventureState";
import { Button } from "./common/Button";
import { Section } from "./common/Section";
import { DepressedInput } from "./common/DepressedInput";
import { generateUuid } from "../lib/randomId";
import { Label } from "./common/Label";
import { Text } from "./common/Text";
import { Panel } from "./common/Panel";
import { Message } from "./common/Message";

type SetupMode = "ready_gate" | "profile_only";

interface CharacterSetupFormProps {
  mode: SetupMode;
  isReady: boolean;
  connectedPlayers: number;
  readyPlayers: number;
  initialSetup?: PlayerSetup | null;
  adventureGenerationInProgress?: boolean;
  onSubmit: (setup: PlayerSetup) => void;
  onToggleReady: (ready: boolean) => void;
}

interface SetupPreset {
  id: string;
  label: string;
  setup: PlayerSetup;
  createdAtIso: string;
}

const PRESETS_STORAGE_KEY = "mighty_decks_player_setup_presets_v1";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPlayerSetup = (value: unknown): value is PlayerSetup => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PlayerSetup>;
  return (
    isNonEmptyString(candidate.characterName) &&
    isNonEmptyString(candidate.visualDescription) &&
    typeof candidate.adventurePreference === "string"
  );
};

const loadPresets = (): SetupPreset[] => {
  try {
    const rawValue = window.localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((item): item is SetupPreset => {
        if (!item || typeof item !== "object") {
          return false;
        }

        const candidate = item as Partial<SetupPreset>;
        return (
          isNonEmptyString(candidate.id) &&
          isNonEmptyString(candidate.label) &&
          isNonEmptyString(candidate.createdAtIso) &&
          isPlayerSetup(candidate.setup)
        );
      })
      .slice(0, 20);
  } catch {
    return [];
  }
};

const persistPresets = (presets: SetupPreset[]): void => {
  window.localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
};

export const CharacterSetupForm = ({
  mode,
  isReady,
  connectedPlayers,
  readyPlayers,
  initialSetup = null,
  adventureGenerationInProgress = false,
  onSubmit,
  onToggleReady,
}: CharacterSetupFormProps): JSX.Element => {
  const [characterName, setCharacterName] = useState("");
  const [visualDescription, setVisualDescription] = useState("");
  const [adventurePreference, setAdventurePreference] = useState("");
  const [savedPresets, setSavedPresets] = useState<SetupPreset[]>(() =>
    loadPresets(),
  );
  const [hydratedSetupKey, setHydratedSetupKey] = useState<string>("");

  const isReadyGateMode = mode === "ready_gate";
  const showAdventurePreference = isReadyGateMode;
  const setupLocked =
    isReadyGateMode && (isReady || adventureGenerationInProgress);
  const showReadyControls = isReadyGateMode && !adventureGenerationInProgress;
  const showNotReadyButton = showReadyControls && connectedPlayers > 1;

  useEffect(() => {
    if (!initialSetup) {
      return;
    }

    const setupKey = [
      initialSetup.characterName,
      initialSetup.visualDescription,
      initialSetup.adventurePreference,
    ].join("||");
    if (setupKey === hydratedSetupKey) {
      return;
    }

    setCharacterName(initialSetup.characterName);
    setVisualDescription(initialSetup.visualDescription);
    setAdventurePreference(initialSetup.adventurePreference);
    setHydratedSetupKey(setupKey);
  }, [hydratedSetupKey, initialSetup]);

  const canReady = useMemo(
    () =>
      characterName.trim().length > 0 && visualDescription.trim().length > 0,
    [characterName, visualDescription],
  );

  const trimmedSetup: PlayerSetup = useMemo(
    () => ({
      characterName: characterName.trim(),
      visualDescription: visualDescription.trim(),
      adventurePreference: adventurePreference.trim(),
    }),
    [adventurePreference, characterName, visualDescription],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!canReady) {
      return;
    }

    onSubmit(trimmedSetup);
    if (isReadyGateMode) {
      onToggleReady(true);
    }
  };

  const handleSavePreset = (): void => {
    if (!canReady) {
      return;
    }

    const labelBase = trimmedSetup.characterName;
    const now = new Date();
    const preset: SetupPreset = {
      id: `preset-${generateUuid()}`,
      label: labelBase,
      setup: trimmedSetup,
      createdAtIso: now.toISOString(),
    };

    const nextPresets = [preset, ...savedPresets].slice(0, 20);
    setSavedPresets(nextPresets);
    persistPresets(nextPresets);
  };

  const handleRecallPreset = (preset: SetupPreset): void => {
    setCharacterName(preset.setup.characterName);
    setVisualDescription(preset.setup.visualDescription);
    setAdventurePreference(preset.setup.adventurePreference);
    if (isReadyGateMode) {
      onToggleReady(false);
    }
  };

  const handleDeletePreset = (presetId: string): void => {
    const nextPresets = savedPresets.filter((preset) => preset.id !== presetId);
    setSavedPresets(nextPresets);
    persistPresets(nextPresets);
  };

  return (
    <Section>
      <form className="stack gap-4 mt-8" onSubmit={handleSubmit}>
        <Text variant="h2">Your Character</Text>
        <DepressedInput
          id="character-name"
          label="What do they call your character?"
          placeholder="Nyra Flint"
          value={characterName}
          onChange={(event) => setCharacterName(event.target.value)}
          disabled={setupLocked}
          required
        />
        <DepressedInput
          multiline
          id="character-visual-description"
          label="What do they look like?"
          placeholder="A storm-chaser in patched leather with brass goggles."
          rows={3}
          value={visualDescription}
          onChange={(event) => setVisualDescription(event.target.value)}
          disabled={setupLocked}
          required
        />
        {showAdventurePreference ? (
          <DepressedInput
            multiline
            id="adventure-preference"
            label="What adventure do you want to play?"
            placeholder="A tense mystery with weird weather and ruins."
            rows={3}
            value={adventurePreference}
            onChange={(event) => setAdventurePreference(event.target.value)}
            disabled={setupLocked}
          />
        ) : null}
        <Panel className="relative">
          <Label className="absolute -top-2 -left-2">Saved Presets</Label>
          <Button
            type="button"
            size="sm"
            variant="solid"
            color="cloth"
            onClick={handleSavePreset}
            disabled={!canReady}
            className="absolute -top-2 -right-2"
          >
            Save as Preset
          </Button>
          <div className="pt-4">
            {savedPresets.length === 0 ? (
              <Text
                variant="note"
                color="steel-dark"
                className="normal-case tracking-normal"
              >
                No presets saved yet.
              </Text>
            ) : (
              <div className="grid gap-2">
                {savedPresets.map((preset) => (
                  <div key={preset.id} className="flex flex-wrap items-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="solid"
                      color="bone"
                      onClick={() => handleRecallPreset(preset)}
                      disabled={setupLocked}
                    >
                      {preset.label}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="solid"
                      color="curse"
                      onClick={() => handleDeletePreset(preset.id)}
                      className="relative -ml-1 z-5"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
        <Panel contentClassName="flex flex-row flex-wrap items-center gap-4">
          {isReadyGateMode ? (
            <>
              {showReadyControls ? (
                <>
                  <Button type="submit" disabled={!canReady || isReady}>
                    I am ready
                  </Button>
                  {showNotReadyButton ? (
                    <Button
                      type="button"
                      variant="solid"
                      color="bone"
                      onClick={() => onToggleReady(false)}
                      disabled={!isReady}
                    >
                      Not ready
                    </Button>
                  ) : null}
                </>
              ) : (
                <Message color="cloth">
                  Adventure generation is in progress. Please wait.
                </Message>
              )}
              <div>
                <Text variant="emphasised">
                  {readyPlayers} / {connectedPlayers} connected players are
                  ready.
                </Text>
                <Text
                  variant="note"
                  color="steel-dark"
                  className="normal-case tracking-normal"
                >
                  {adventureGenerationInProgress
                    ? "We will be pitching adventures shortly..."
                    : "We will begin when all connected players are ready."}
                </Text>
              </div>
            </>
          ) : (
            <>
              <Button type="submit" disabled={!canReady}>
                Save character
              </Button>
              <Text
                variant="note"
                color="steel-dark"
                className="normal-case tracking-normal"
              >
                Adventure is already underway. Add your character details to
                join in.
              </Text>
            </>
          )}
        </Panel>
      </form>
    </Section>
  );
};
