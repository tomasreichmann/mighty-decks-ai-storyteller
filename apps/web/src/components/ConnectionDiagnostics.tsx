import { Section } from "./common/Section";

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
  const hasIssues = !connected || Boolean(connectionError) || Boolean(serverUrlWarning);
  if (!hasIssues) {
    return null;
  }
  const isAdventureCapError = connectionError?.toLowerCase().includes("active adventure cap reached") ?? false;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "unknown";
  const secureContextLabel =
    typeof window !== "undefined" && window.isSecureContext ? "yes" : "no";

  return (
    <Section className="grid gap-2 rounded-md border border-rose-200 bg-rose-50 p-3">
      <p className="text-sm font-semibold text-rose-800">Connection diagnostics</p>
      {!connected ? (
        <p className="text-sm text-rose-700">
          Not connected to adventure server yet.
        </p>
      ) : null}
      {connectionError ? (
        <p className="text-sm text-rose-700">Error: {connectionError}</p>
      ) : null}
      {isAdventureCapError ? (
        <p className="text-xs text-rose-700">
          This server currently allows one active adventure. Reuse the existing adventure ID or increase{" "}
          MAX_ACTIVE_ADVENTURES.
        </p>
      ) : null}
      {serverUrlWarning ? (
        <p className="text-sm text-amber-700">Warning: {serverUrlWarning}</p>
      ) : null}
      <p className="text-xs text-slate-700">Page origin: {origin}</p>
      <p className="text-xs text-slate-700">Socket URL: {serverUrl}</p>
      <p className="text-xs text-slate-700">Secure context: {secureContextLabel}</p>
    </Section>
  );
};
