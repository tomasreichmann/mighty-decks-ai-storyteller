import type { SmartInputDocumentContext } from "../../lib/smartInputContext";
import { Text } from "../common/Text";
import { AdventureModuleMarkdownField } from "./AdventureModuleMarkdownField";
import styles from "./AdventureModulePlayerInfoTabPanel.module.css";

interface AdventureModuleStorytellerInfoTabPanelProps {
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

export const AdventureModuleStorytellerInfoTabPanel = ({
  summary,
  infoText,
  smartContextDocument,
  editable,
  validationMessage,
  onSummaryChange,
  onInfoTextChange,
  onFieldBlur,
}: AdventureModuleStorytellerInfoTabPanelProps): JSX.Element => {
  return (
    <div className="stack gap-4">
      <AdventureModuleMarkdownField
        label="Storyteller Summary"
        description="Spoiler-ready overview of premise, hidden truths, and pressure arcs for a facilitator handoff."
        selfContextTag="Storyteller Summary"
        smartContextDocument={smartContextDocument}
        value={summary}
        editable={editable}
        maxLength={MAX_MARKDOWN_LENGTH}
        onChange={onSummaryChange}
        onFieldBlur={onFieldBlur}
        contentEditableClassName={styles.summaryEditable}
      />

      <AdventureModuleMarkdownField
        label="Storyteller Info Text"
        description="Detailed facilitator-facing guidance: agendas, scene pressure, secrets, and continuity anchors."
        selfContextTag="Storyteller Info"
        smartContextDocument={smartContextDocument}
        value={infoText}
        editable={editable}
        maxLength={MAX_MARKDOWN_LENGTH}
        onChange={onInfoTextChange}
        onFieldBlur={onFieldBlur}
        contentEditableClassName={styles.infoEditable}
      />

      <Text variant="note" color="iron-light" className="text-sm !opacity-100">
        Storyteller-facing copy may include spoilers. Markdown supports rich
        formatting and source mode.
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
