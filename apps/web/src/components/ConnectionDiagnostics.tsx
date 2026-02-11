import { Message } from "./common/Message";
import { Text } from "./common/Text";

interface ConnectionDiagnosticsProps {
  connected: boolean;
  connectionError: string | null;
  serverUrl: string;
  serverUrlWarning: string | null;
}

export const ConnectionDiagnostics = ({
  connected,
  connectionError,
  serverUrl,
  serverUrlWarning,
}: ConnectionDiagnosticsProps): JSX.Element | null => {
  const hasIssues =
    !connected || Boolean(connectionError) || Boolean(serverUrlWarning);
  if (!hasIssues) {
    return null;
  }
  const isAdventureCapError =
    connectionError?.toLowerCase().includes("active adventure cap reached") ??
    false;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "unknown";
  const secureContextLabel =
    typeof window !== "undefined" && window.isSecureContext ? "yes" : "no";

  return (
    <Message className="stack gap-2">
      <Text as="h3" variant="h3" color="curse">
        Connection diagnostics
      </Text>
      {!connected ? (
        <Text variant="body" color="curse">
          Not connected to adventure server yet.
        </Text>
      ) : null}
      {connectionError ? (
        <Text variant="body" color="curse">
          Error: {connectionError}
        </Text>
      ) : null}
      {isAdventureCapError ? (
        <Text variant="emphasised">
          This server currently allows one active adventure. Reuse the existing
          adventure ID or increase MAX_ACTIVE_ADVENTURES.
        </Text>
      ) : null}
      {serverUrlWarning ? (
        <Text variant="body" color="gold-dark" className="text-sm">
          Warning: {serverUrlWarning}
        </Text>
      ) : null}
      <Text variant="body">Page origin: {origin}</Text>
      <Text variant="body">Socket URL: {serverUrl}</Text>
      <Text variant="body">Secure context: {secureContextLabel}</Text>
    </Message>
  );
};
