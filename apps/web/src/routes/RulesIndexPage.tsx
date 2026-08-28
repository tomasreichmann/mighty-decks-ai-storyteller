import canonicalRulebook from "../../../../docs/mighty-decks-rulebook.md?raw";
import { RulesRulebookContent } from "../components/rules/RulesRulebookContent";
import { RulesTableOfContents } from "../components/rules/RulesTableOfContents";
import { parseRulebookDocument } from "../lib/rulebookDocument";

const rulebookDocument = parseRulebookDocument(canonicalRulebook);

export const RulesIndexPage = (): JSX.Element => {
  return (
    <div data-rules-page className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
      <RulesTableOfContents />
      <article aria-label="Mighty Decks rulebook" className="min-w-0">
        <RulesRulebookContent document={rulebookDocument} />
      </article>
    </div>
  );
};
