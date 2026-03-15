import type { SmartInputDocumentContext } from "../../lib/smartInputContext";
import type {
  AdventureModuleResolvedActor,
  AdventureModuleResolvedAsset,
  AdventureModuleResolvedCounter,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type { CounterAdjustTarget } from "../../lib/gameCardCatalogContext";
import { Text } from "../common/Text";
import { AdventureModuleMarkdownField } from "./AdventureModuleMarkdownField";
import styles from "./AdventureModulePlayerInfoTabPanel.module.css";

interface AdventureModuleStorytellerInfoTabPanelProps {
  summary: string;
  infoText: string;
  smartContextDocument: SmartInputDocumentContext;
  actors?: AdventureModuleResolvedActor[];
  counters?: AdventureModuleResolvedCounter[];
  assets?: AdventureModuleResolvedAsset[];
  editable: boolean;
  validationMessage?: string | null;
  onSummaryChange: (nextValue: string) => void;
  onInfoTextChange: (nextValue: string) => void;
  onFieldBlur: () => void;
  onAdjustCounterValue?: (
    counterSlug: string,
    delta: number,
    target?: CounterAdjustTarget,
  ) => void;
}

const MAX_MARKDOWN_LENGTH = 200_000;

export const AdventureModuleStorytellerInfoTabPanel = ({
  summary,
  infoText,
  smartContextDocument,
  actors = [],
  counters = [],
  assets = [],
  editable,
  validationMessage,
  onSummaryChange,
  onInfoTextChange,
  onFieldBlur,
  onAdjustCounterValue,
}: AdventureModuleStorytellerInfoTabPanelProps): JSX.Element => {
  return (
    <div className="stack gap-4">
      <AdventureModuleMarkdownField
        label="Storyteller Summary"
        description="Spoiler-ready facilitator markdown. Rich Text renders GameCards inline while source mode keeps canonical <GameCard /> syntax."
        selfContextTag="Storyteller Summary"
        smartContextDocument={smartContextDocument}
        actors={actors}
        counters={counters}
        assets={assets}
        value={summary}
        editable={editable}
        maxLength={MAX_MARKDOWN_LENGTH}
        onChange={onSummaryChange}
        onFieldBlur={onFieldBlur}
        onAdjustCounterValue={onAdjustCounterValue}
        contentEditableClassName={styles.summaryEditable}
      />

      <AdventureModuleMarkdownField
        label="Storyteller Info Text"
        description="Detailed facilitator-facing guidance: agendas, scene pressure, secrets, continuity anchors, and inline GameCards when needed."
        selfContextTag="Storyteller Info"
        smartContextDocument={smartContextDocument}
        actors={actors}
        counters={counters}
        assets={assets}
        value={infoText}
        editable={editable}
        maxLength={MAX_MARKDOWN_LENGTH}
        onChange={onInfoTextChange}
        onFieldBlur={onFieldBlur}
        onAdjustCounterValue={onAdjustCounterValue}
        contentEditableClassName={styles.infoEditable}
      />

      <Text variant="note" color="iron-light" className="text-sm !opacity-100">
        Storyteller-facing copy may include spoilers. Rich Text renders
        GameCards inline, and source mode stores canonical{" "}
        <code>{"<GameCard />"}</code> markup.
      </Text>

      <Text variant="note" color="iron-light" className="text-sm !opacity-100">
        Character limit: {MAX_MARKDOWN_LENGTH.toLocaleString()} per field.
      </Text>

      {validationMessage ? (
        <Text variant="note" color="blood" className="text-sm !opacity-100">
          {validationMessage}
        </Text>
      ) : null}
    </div>
  );
};
