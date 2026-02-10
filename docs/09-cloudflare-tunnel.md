# 09 - Cloudflare Tunnel Guide

This runbook exposes the locally running MVP outside your LAN using Cloudflare Tunnel.

## Why this option

- No router port forwarding
- Public HTTPS URLs for both web and API
- Better mobile compatibility than plain HTTP LAN links

## Prerequisites

- Cloudflare account
- A domain managed in Cloudflare DNS
- `cloudflared` installed on your machine

## 1. Start local app processes

Run these in separate terminals from repo root:

```powershell
pnpm -C apps/server dev
pnpm -C apps/web dev --host
```

## 2. Authenticate and create tunnel

```powershell
cloudflared tunnel login
cloudflared tunnel create mighty-decks
```

Keep the tunnel UUID shown by `create`.

## 3. Create tunnel config file

Create `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: C:\Users\<YOUR_USER>\.cloudflared\<TUNNEL_UUID>.json

ingress:
  - hostname: md-web.yourdomain.com
    service: http://localhost:5173
  - hostname: md-api.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

## 4. Create DNS routes

```powershell
cloudflared tunnel route dns mighty-decks md-web.yourdomain.com
cloudflared tunnel route dns mighty-decks md-api.yourdomain.com
```

## 5. Run the tunnel

```powershell
cloudflared tunnel run mighty-decks
```

## 6. Configure web app API target

Create/update `apps/web/.env.local`:

```env
VITE_SERVER_URL=https://md-api.yourdomain.com
```

## 7. Configure server CORS origins

Create/update root `.env.local` (or `apps/server/.env.local`):

```env
CORS_ORIGINS=https://md-web.yourdomain.com,http://localhost:5173,http://192.168.0.35:5173
```

Adjust the LAN IP value to your current machine IP.

## 8. Restart dev servers after env changes

Stop and restart both local processes:

```powershell
pnpm -C apps/server dev
pnpm -C apps/web dev --host
```

## 9. Verify from outside LAN

- Open `https://md-web.yourdomain.com` on phone (cellular or external network).
- Join an adventure.
- Confirm live updates and actions work.

If there is a problem, check the in-app **Connection diagnostics** panel for:

- page origin
- socket URL
- warning/error text
- secure context status

## Optional: quick temporary tunnel

If you need a short-lived test without DNS setup, use Cloudflare quick tunnels (`trycloudflare.com`), but URLs change each run and are less suitable for repeat playtests.

