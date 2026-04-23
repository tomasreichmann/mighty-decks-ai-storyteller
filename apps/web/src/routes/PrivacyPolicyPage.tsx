import { Heading } from "../components/common/Heading";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";

export const PrivacyPolicyPage = (): JSX.Element => {
  return (
    <div className="app-shell stack py-10 gap-4">
      <Heading level="h1" color="iron">
        Privacy Policy
      </Heading>

      <Panel>
        <div className="stack gap-4">
          <Text variant="body" color="iron-light">
            This is the public privacy policy for Mighty Decks AI Storyteller.
            It exists so platform reviewers and users can find the current
            policy in one public place.
          </Text>
          <Text variant="body" color="iron-light">
            The app may store the minimum data needed to run adventures,
            campaigns, and authoring flows, including browser-side identifiers,
            session state, and authored content.
          </Text>
          <Text variant="body" color="iron-light">
            Contact: Tomas Reichmann at tomasreichmann@gmail.com.
          </Text>
        </div>
      </Panel>
    </div>
  );
};
