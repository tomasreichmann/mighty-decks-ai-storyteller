import { Heading } from "../components/common/Heading";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";

export const TermsOfServicePage = (): JSX.Element => {
  return (
    <div className="app-shell stack py-10 gap-4">
      <Heading level="h1" color="iron">
        Terms of Service
      </Heading>

      <Panel>
        <div className="stack gap-4">
          <Text variant="body" color="iron-light">
            This page contains the public terms of service for Mighty Decks AI
            Storyteller.
          </Text>
          <Text variant="body" color="iron-light">
            Use the app for lawful tabletop storytelling, authoring, and play
            sessions. Do not abuse the service, attempt to disrupt other users,
            or submit content you do not have the right to share.
          </Text>
          <Text variant="body" color="iron-light">
            The service is provided as-is and features may change as the project
            evolves.
          </Text>
        </div>
      </Panel>
    </div>
  );
};
