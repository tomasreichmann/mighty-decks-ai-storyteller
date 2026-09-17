# Rules static assets design

## Goal

Restore the wooden rules-board surface and Outcome-card backface in local development.

## Cause and decision

Vite forwards `/backgrounds/*` to the API server before it can serve the
matching `apps/web/public/backgrounds/*` files. The API server has no board or
card-backface files at those paths, so the browser receives 404 responses.

Remove only the colliding `/backgrounds` development proxy. Keep the API-backed
`/actors` and `/mighty-decks` resource proxies. A focused configuration test
guards the static namespace from being reintroduced as a proxy.

## Verification

Run the focused web test, typecheck, and load `/rules` in local development to
confirm both requested images return 200 and render.
