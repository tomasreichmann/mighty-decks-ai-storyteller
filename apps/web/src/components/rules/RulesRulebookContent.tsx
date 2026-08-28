import { Fragment, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Heading } from "../common/Heading";
import { Message } from "../common/Message";
import { Table } from "../common/Table";
import { Text } from "../common/Text";
import {
  rulebookIllustrationsBySectionId,
  rulebookIllustrationsBySubsectionId,
} from "./RulesIllustrations";
import {
  toRulebookFragmentId,
  type RulebookDocument,
} from "../../lib/rulebookDocument";
import styles from "./RulesRulebookContent.module.css";

interface RulesRulebookContentProps {
  document: RulebookDocument;
}

const childrenToText = (children: ReactNode): string => {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(childrenToText).join("");
  }
  return "";
};

const RulebookMarkdown = ({
  markdown,
  subsectionId,
}: {
  markdown: string;
  subsectionId?: string;
}): JSX.Element => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => (
        <Text className={styles.bodyText} variant="body" color="iron-light">
          {children}
        </Text>
      ),
      h3: ({ children }) => (
        <div
          id={subsectionId ?? toRulebookFragmentId(childrenToText(children))}
          className={styles.subheading}
        >
          <Heading level="h3" color="iron">
            {children}
          </Heading>
        </div>
      ),
      ul: ({ children }) => (
        <ul className={`${styles.bodyText} list-disc space-y-1 pl-6 font-ui text-base text-kac-iron-light`}>
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className={`${styles.bodyText} list-decimal space-y-1 pl-6 font-ui text-base text-kac-iron-light`}>
          {children}
        </ol>
      ),
      table: ({ children }) => (
        <Table>{children}</Table>
      ),
      blockquote: ({ children }) => (
        <Message
          color="cloth"
          label="Rules"
          rotateLabel={false}
          preserveWhitespace={false}
        >
          {children}
        </Message>
      ),
      code: ({ children }) => (
        <code className={styles.inlineCode}>{children}</code>
      ),
      strong: ({ children }) => <strong className="font-bold text-kac-iron">{children}</strong>,
    }}
  >
    {markdown}
  </ReactMarkdown>
);

const subsectionBlocks = (body: string): readonly string[] =>
  body.split(/(?=^###\s+)/m).filter((block) => block.trim().length > 0);

export const RulesRulebookContent = ({
  document,
}: RulesRulebookContentProps): JSX.Element => {
  return (
    <div className={`stack gap-10 ${styles.content}`}>
      {document.sections.map((section) => (
        <section id={section.id} key={section.id} className={`${styles.section} stack gap-4`}>
          <Heading level={section.headingLevel} color="iron">
            {section.title}
          </Heading>
          {(() => {
            const Illustration = rulebookIllustrationsBySectionId[section.id];
            return Illustration ? <Illustration /> : null;
          })()}
          <div className={`${styles.prose} stack gap-4`}>
            {subsectionBlocks(section.body).map((block, index) => {
              const match = block.match(/^###\s+(.+)$/m);
              const subsection = match
                ? section.subsections.find((candidate) => candidate.title === match[1])
                : undefined;
              const id = subsection?.id;
              const Enhancement = id
                ? rulebookIllustrationsBySubsectionId[id]
                : undefined;
              return (
                <Fragment key={id ?? `${section.id}-${index}`}>
                  <RulebookMarkdown markdown={block} subsectionId={id} />
                  {Enhancement ? <Enhancement /> : null}
                </Fragment>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
