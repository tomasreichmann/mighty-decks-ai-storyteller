# Recommended UX plan for improving UX when Render server is waking up after inactivity

### 1. Add a real “server waking” app shell

The landing page should not render the normal app immediately if the backend is not ready.

On initial app boot:

1. Render a branded loading shell instantly from static JS/CSS.
2. Call `GET /health` or better `GET /api/readiness`.
3. If it succeeds quickly, continue normally.
4. If it takes more than ~1.5–2 seconds, switch copy to:

> **Waking the Storyteller…**
> The free server may need up to a minute to wake after inactivity.
> Preparing adventures, images, and AI tools.

This makes the delay feel intentional rather than broken.

Use a 3-stage text progression:

|  Time | Message                                                                        |
| ----: | ------------------------------------------------------------------------------ |
|  0–2s | “Loading Mighty Decks AI Storyteller…”                                         |
| 2–20s | “Waking the Storyteller server…”                                               |
|  20s+ | “Still waking. Free hosting sometimes needs about a minute after hibernation.” |
|  60s+ | Show retry / troubleshoot options                                              |

### 2. Create a dedicated readiness endpoint

Keep `/health` for Render health checks, but add something more useful for the frontend:

```ts
// apps/server/src/routes/readiness.ts
app.get("/api/readiness", async () => {
  return {
    ok: true,
    status: "ready",
    service: "mighty-decks-ai-storyteller",
    timestamp: new Date().toISOString(),
  };
});
```

Why not only `/health`? Because `/health` may later become infrastructure-only. `/api/readiness` can safely evolve into “can the app actually serve users?” without messing with Render health checks. Render supports setting a health check path in the service settings or `render.yaml`. ([Render][3])

### 3. Block broken API-dependent UI until ready

Right now the page appears to load “without images and BE functionality,” which communicates failure. Instead, make the app state explicit:

```ts
type BackendStatus = "checking" | "waking" | "ready" | "error";
```

Then gate the routes/features:

```tsx
if (backendStatus !== "ready") {
  return <WakeScreen status={backendStatus} retry={checkBackend} />;
}

return <AppRoutes />;
```

For pages that can be partly static, use disabled controls with clear labels:

> Storyteller tools will unlock when the server is ready.

### 4. Fix images separately from backend readiness

There are probably two image categories:

**Static UI/art images** should not depend on the backend. Put them in `apps/web/public` or bundle/import them through Vite so they load from the static frontend build immediately.

**Generated/session images** do depend on the backend and should show placeholders:

```tsx
<ImageSlot
  src={imageUrl}
  fallbackTitle="Image will appear when the Storyteller wakes"
  isBackendReady={backendStatus === "ready"}
/>
```

This avoids the “broken image” feeling.

### 5. Add a small wake-up helper hook

Something like:

```ts
export function useBackendReadiness() {
  const [status, setStatus] = useState<
    "checking" | "waking" | "ready" | "error"
  >("checking");
  const [elapsedMs, setElapsedMs] = useState(0);

  const check = useCallback(async () => {
    const startedAt = Date.now();
    setStatus("checking");

    const wakeTimer = window.setTimeout(() => {
      setStatus("waking");
    }, 2000);

    try {
      const res = await fetch("/api/readiness", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`Readiness failed: ${res.status}`);

      clearTimeout(wakeTimer);
      setElapsedMs(Date.now() - startedAt);
      setStatus("ready");
    } catch {
      clearTimeout(wakeTimer);
      setElapsedMs(Date.now() - startedAt);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { status, elapsedMs, retry: check };
}
```

For Render wake-up, a single long fetch is usually enough because the first request wakes the service. Do not spam the server every second while it is cold. A better pattern is:

1. Fire one readiness request.
2. Show waking UI while it is pending.
3. If it fails or times out after maybe 75 seconds, show Retry.

### 6. Add a timeout + retry UI

After 60–75 seconds:

```tsx
<WakeScreen>
  <h1>The Storyteller is taking longer than usual</h1>
  <p>The server may still be waking.</p>
  <button onClick={retry}>Try again</button>
</WakeScreen>
```

Avoid technical wording first. Good user-facing wording:

> **The Storyteller is waking up**
> This server sleeps after inactivity.
> First load can take up to a minute.

### 7. Add visible connection state for Socket.IO

Because your backend uses Socket.IO for authoritative realtime state, the runtime should distinguish:

| State                         | UI                       |
| ----------------------------- | ------------------------ |
| HTTP ready, socket connecting | “Connecting to session…” |
| socket connected              | normal                   |
| socket reconnecting           | non-blocking top banner  |
| socket failed                 | “Reconnect” action       |

This matters because `GET /api/readiness` can be ready before a session socket is fully joined.

### 8. Make the first request happen as early as possible

In `main.tsx`, start the readiness fetch before expensive React rendering where possible:

```ts
const readinessPromise = fetch('/api/readiness', { cache: 'no-store' });

createRoot(document.getElementById('root')!).render(
  <BackendReadinessProvider initialPromise={readinessPromise}>
    <App />
  </BackendReadinessProvider>
);
```

This shaves a little perceived time because the wake request starts immediately.

### 9. Optional: use a static landing page as the always-fast entry

Since the app has rules/reference/landing content, you can split UX into:

**Static shell always works:**

- project intro
- rules links
- adventure module info
- “Start Storyteller” button

**Backend-dependent features show wake screen:**

- adventure runtime
- AI storyteller
- image generation
- workflow lab
- Socket.IO session pages

This is probably the best product experience. The site feels alive even when the backend is asleep.

### 10. Optional technical mitigations

There are three practical options:

**Best UX, still free:** implement wake screen + readiness checks.
**Best reliability:** upgrade Render service to paid/starter so it does not spin down. Render states paid tiers remove this cold-start issue for web services. ([Render][4])
**Hacky free workaround:** external ping service, but I would avoid building product UX around bypassing free-tier sleep. It can conflict with platform intent and free quotas.

## Suggested implementation order

1. Add `/api/readiness`.
2. Add `useBackendReadiness`.
3. Add `<WakeScreen />` with Mighty Decks styling.
4. Gate backend-dependent routes behind readiness.
5. Replace broken image states with placeholders.
6. Add Socket.IO connection banners inside runtime pages.
7. Update README/deployment docs: “Free Render first load can take up to a minute.”

## Good copy for the screen

```txt
Waking the Storyteller…

This server sleeps after 15 minutes of inactivity.
The first visitor wakes it up again. This can take up to a minute.

Preparing the adventure table…
```

For your app’s tone, I would make it diegetic:

```txt
The Storyteller is lighting the candles…

The server was resting between adventures.
Free hosting needs a moment to wake it up — usually under a minute.
```

## My recommendation

Do **not** try to hide the delay. Make it part of the demo experience.

For a portfolio/project site, the ideal behavior is:

> Static landing loads instantly → user sees “Storyteller server waking” → backend-dependent buttons unlock when ready.

That turns a broken first impression into a transparent, polished prototype experience.

[1]: https://render.com/docs/free?utm_source=chatgpt.com "Deploy for Free – Render Docs"
[2]: https://github.com/tomasreichmann/mighty-decks-ai-storyteller "GitHub - tomasreichmann/mighty-decks-ai-storyteller · GitHub"
[3]: https://render.com/docs/health-checks?utm_source=chatgpt.com "Health Checks – Render Docs"
[4]: https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026?utm_source=chatgpt.com "Platforms with a real free tier for developers in 2026"
