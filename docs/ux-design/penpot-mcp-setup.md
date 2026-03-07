# Penpot MCP Setup

This guide is the project default setup for using Penpot MCP with the Mighty Decks style system payload.

Defaults for this repo:

- Penpot MCP branch: `mcp-prod`
- Penpot environment: `penpot.app` cloud
- Host OS note: on Windows, run setup commands from Git Bash

## Prerequisites

- Node.js `22.x`
- `corepack` enabled
- `pnpm` available
- Git

## 1) Clone Penpot MCP Source

```bash
git clone https://github.com/penpot/penpot.git --branch mcp-prod --depth 1
cd penpot/mcp
```

Optional non-default branch:

```bash
git clone https://github.com/penpot/penpot.git --branch develop --depth 1
cd penpot/mcp
```

## 2) Setup and Bootstrap

```bash
./scripts/setup
pnpm run bootstrap
```

Expected local services used by the plugin and MCP server:

- Plugin manifest: `http://localhost:4400/manifest.json`
- MCP streamable HTTP: `http://localhost:4401/mcp`
- MCP SSE (legacy): `http://localhost:4401/sse`

## 3) Connect in Penpot

1. Open a Penpot file.
2. Load plugin URL: `http://localhost:4400/manifest.json`.
3. Open the plugin UI.
4. Click the plugin button to connect to MCP server.
5. Keep the plugin panel open while MCP client operations run.

## 4) Connect MCP Client

Use streamable HTTP when supported:

- URL: `http://localhost:4401/mcp`

SSE fallback:

- URL: `http://localhost:4401/sse`

Example for Claude Code:

```bash
claude mcp add penpot -t http http://localhost:4401/mcp
```

For clients that only support stdio, use `mcp-remote` as a bridge:

```bash
npm install -g mcp-remote
npx -y mcp-remote http://localhost:4401/sse --allow-http
```

## 5) Project Style Payload

Once connected, use these project files as the style contract input:

- `docs/17-ui-style-system-penpot-mcp.md`
- `docs/ux-design/penpot-mcp-tokens.schema.json`
- `docs/ux-design/penpot-mcp-tokens.current.json`

## Troubleshooting

- If the plugin does not connect, verify the bootstrap process is still running and ports `4400` and `4401` are reachable.
- If MCP commands fail from the client, verify whether the client expects streamable HTTP or SSE.
- If using Windows PowerShell, switch to Git Bash for setup scripts.

## Source

Setup steps are based on the Penpot repository MCP README at:

- `https://github.com/penpot/penpot/tree/develop/mcp`
- Raw reference checked: `https://raw.githubusercontent.com/penpot/penpot/develop/mcp/README.md`
