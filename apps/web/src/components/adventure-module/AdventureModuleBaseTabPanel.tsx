import {
  DEFAULT_AVOID_TAG_OPTIONS,
  DEFAULT_HAVE_TAG_OPTIONS,
} from "../../data/paletteTagOptions";
import { AdventureModuleTitleImagePanel } from "./AdventureModuleTitleImagePanel";
import { SmartInput } from "../common/SmartInput";
import { Tags } from "../common/Tags";
import { Text } from "../common/Text";

interface AdventureModuleBaseTabPanelProps {
  moduleId: string;
  creatorToken?: string;
  coverImageUrl?: string;
  premise: string;
  haveTags: string[];
  avoidTags: string[];
  moduleTitle: string;
  moduleSummary: string;
  moduleIntent: string;
  playerSummary: string;
  playerInfo: string;
  storytellerSummary: string;
  storytellerInfo: string;
  editable: boolean;
  validationMessage?: string | null;
  onPremiseChange: (nextValue: string) => void;
  onHaveChange: (nextValue: string[]) => void;
  onAvoidChange: (nextValue: string[]) => void;
  onFieldBlur: () => void;
}

export const AdventureModuleBaseTabPanel = ({
  moduleId,
  creatorToken,
  coverImageUrl,
  premise,
  haveTags,
  avoidTags,
  moduleTitle,
  moduleSummary,
  moduleIntent,
  playerSummary,
  playerInfo,
  storytellerSummary,
  storytellerInfo,
  editable,
  validationMessage,
  onPremiseChange,
  onHaveChange,
  onAvoidChange,
  onFieldBlur,
}: AdventureModuleBaseTabPanelProps): JSX.Element => {
  return (
    <div className="stack gap-4">
      <SmartInput
        label="Premise"
        description="Theme, setting, hook, narrative hook, player role in the narrative and their goal. What is the story about and why is it fun to play as a TTRPG?"
        value={premise}
        onChange={onPremiseChange}
        onBlur={onFieldBlur}
        disabled={!editable}
        maxLength={500}
      />

      <Tags
        label="Have Tags"
        description="Include motifs and content that should appear in the module."
        value={haveTags}
        onChange={onHaveChange}
        onBlur={onFieldBlur}
        options={DEFAULT_HAVE_TAG_OPTIONS}
        disabled={!editable}
      />

      <Tags
        label="Avoid Tags"
        description="Exclude motifs and content that should not appear in the module."
        value={avoidTags}
        onChange={onAvoidChange}
        onBlur={onFieldBlur}
        options={DEFAULT_AVOID_TAG_OPTIONS}
        disabled={!editable}
      />
      <AdventureModuleTitleImagePanel
        moduleId={moduleId}
        creatorToken={creatorToken}
        coverImageUrl={coverImageUrl}
        moduleTitle={moduleTitle}
        moduleSummary={moduleSummary}
        moduleIntent={moduleIntent}
        premise={premise}
        haveTags={haveTags}
        avoidTags={avoidTags}
        playerSummary={playerSummary}
        playerInfo={playerInfo}
        storytellerSummary={storytellerSummary}
        storytellerInfo={storytellerInfo}
        disabled={!editable}
      />

      <Text variant="note" color="iron-light" className="text-sm !opacity-100">
        Maximum 12 tags for Have and Avoid. Each tag is trimmed and limited to
        160 characters.
      </Text>

      {validationMessage ? (
        <Text variant="note" color="blood" className="text-sm !opacity-100">
          {validationMessage}
        </Text>
      ) : null}
    </div>
  );
};
