import { FormEvent, useMemo, useState } from "react";
import type { PlayerSetup } from "@mighty-decks/spec/adventureState";
import { Button } from "./common/Button";
import { Section } from "./common/Section";
import { TextArea } from "./common/TextArea";
import { TextField } from "./common/TextField";
import { generateUuid } from "../lib/randomId";

interface CharacterSetupFormProps {
  isReady: boolean;
  connectedPlayers: number;
  readyPlayers: number;
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
  isReady,
  connectedPlayers,
  readyPlayers,
  onSubmit,
  onToggleReady,
}: CharacterSetupFormProps): JSX.Element => {
  const [characterName, setCharacterName] = useState("");
  const [visualDescription, setVisualDescription] = useState("");
  const [adventurePreference, setAdventurePreference] = useState("");
  const [savedPresets, setSavedPresets] = useState<SetupPreset[]>(() => loadPresets());

  const canReady = useMemo(
    () => characterName.trim().length > 0 && visualDescription.trim().length > 0,
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
    onToggleReady(true);
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
    onToggleReady(false);
  };

  const handleDeletePreset = (presetId: string): void => {
    const nextPresets = savedPresets.filter((preset) => preset.id !== presetId);
    setSavedPresets(nextPresets);
    persistPresets(nextPresets);
  };

  return (
    <Section>
      <form className="stack" onSubmit={handleSubmit}>
        <TextField
          label="Character name"
          placeholder="Nyra Flint"
          value={characterName}
          onChange={(event) => setCharacterName(event.target.value)}
          disabled={isReady}
          required
        />
        <TextArea
          label="Visual description"
          placeholder="A storm-chaser in patched leather with brass goggles"
          rows={3}
          value={visualDescription}
          onChange={(event) => setVisualDescription(event.target.value)}
          disabled={isReady}
          required
        />
        <TextArea
          label="Adventure preference"
          placeholder="I want a tense mystery with weird weather and ruins"
          rows={3}
          value={adventurePreference}
          onChange={(event) => setAdventurePreference(event.target.value)}
          disabled={isReady}
        />
        <div className="rounded-md border border-slate-200 bg-white/70 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">Saved Presets</p>
            <Button type="button" size="sm" variant="secondary" onClick={handleSavePreset} disabled={!canReady}>
              Save as Preset
            </Button>
          </div>
          {savedPresets.length === 0 ? (
            <p className="text-xs text-slate-600">No presets saved yet.</p>
          ) : (
            <div className="grid gap-2">
              {savedPresets.map((preset) => (
                <div key={preset.id} className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRecallPreset(preset)}
                    disabled={isReady}
                  >
                    {preset.label}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeletePreset(preset.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex gap-2">
            <Button type="submit" disabled={!canReady || isReady}>
              Ready
            </Button>
            <Button type="button" variant="ghost" onClick={() => onToggleReady(false)} disabled={!isReady}>
              Not ready
            </Button>
          </div>
          <p className="text-sm text-slate-700">
            {readyPlayers} / {connectedPlayers} connected players are ready.
          </p>
          <p className="text-xs text-slate-600">
            Phase advances when all connected player role clients are ready.
          </p>
        </div>
      </form>
    </Section>
  );
};

