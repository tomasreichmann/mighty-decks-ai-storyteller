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

interface AdventureModulePlayerInfoTabPanelProps {
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

export const AdventureModulePlayerInfoTabPanel = ({
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
}: AdventureModulePlayerInfoTabPanelProps): JSX.Element => {
  return (
    <div className="stack gap-4">
      <AdventureModuleMarkdownField
        label="Player Summary"
        description="Spoiler-safe player-facing markdown. Rich Text renders GameCards inline while source mode keeps canonical <GameCard /> syntax."
        selfContextTag="Player Summary"
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
        label="Player Info Text"
        description="Full player-facing brief in markdown. Keep it rich and atmospheric, and use inline GameCards only for information players should see."
        selfContextTag="Player Info"
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
        Keep player-facing copy spoiler-safe. Rich Text renders GameCards inline,
        and source mode stores canonical <code>{"<GameCard />"}</code> markup.
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
