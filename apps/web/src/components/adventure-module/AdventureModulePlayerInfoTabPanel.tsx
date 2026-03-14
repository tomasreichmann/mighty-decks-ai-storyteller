import type { SmartInputDocumentContext } from "../../lib/smartInputContext";
import { Text } from "../common/Text";
import { AdventureModuleMarkdownField } from "./AdventureModuleMarkdownField";
import styles from "./AdventureModulePlayerInfoTabPanel.module.css";

interface AdventureModulePlayerInfoTabPanelProps {
  summary: string;
  infoText: string;
  smartContextDocument: SmartInputDocumentContext;
  editable: boolean;
  validationMessage?: string | null;
  onSummaryChange: (nextValue: string) => void;
  onInfoTextChange: (nextValue: string) => void;
  onFieldBlur: () => void;
}

const MAX_MARKDOWN_LENGTH = 200_000;

export const AdventureModulePlayerInfoTabPanel = ({
  summary,
  infoText,
  smartContextDocument,
  editable,
  validationMessage,
  onSummaryChange,
  onInfoTextChange,
  onFieldBlur,
}: AdventureModulePlayerInfoTabPanelProps): JSX.Element => {
  return (
    <div className="stack gap-4">
      <AdventureModuleMarkdownField
        label="Player Summary"
        description="Spoiler-safe player-facing markdown. Rich Text renders GameCards inline while source mode keeps canonical <GameCard /> syntax."
        selfContextTag="Player Summary"
        smartContextDocument={smartContextDocument}
        value={summary}
        editable={editable}
        maxLength={MAX_MARKDOWN_LENGTH}
        onChange={onSummaryChange}
        onFieldBlur={onFieldBlur}
        contentEditableClassName={styles.summaryEditable}
      />

      <AdventureModuleMarkdownField
        label="Player Info Text"
        description="Full player-facing brief in markdown. Keep it rich and atmospheric, and use inline GameCards only for information players should see."
        selfContextTag="Player Info"
        smartContextDocument={smartContextDocument}
        value={infoText}
        editable={editable}
        maxLength={MAX_MARKDOWN_LENGTH}
        onChange={onInfoTextChange}
        onFieldBlur={onFieldBlur}
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
