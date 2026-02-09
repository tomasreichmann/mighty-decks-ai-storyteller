# 00 – Product Brief

**Mighty Decks AI Storyteller (MVP)**

---

## One-sentence promise

A **GM-less, text-first AI Storyteller** that lets **1–5 players join an adventure, agree on a pitch, and play through fun narrative scenes together**, with an AI running the story flow and continuity.

---

## What this product is

A tabletop companion for in-person play where:

- Each player uses their phone (PWA)
- One shared screen (laptop / TV) shows the evolving story
- An AI Storyteller orchestrates scenes, reacts to player actions, and keeps the narrative coherent

The MVP is intentionally **text-only** to validate fun, pacing, and continuity before adding audio, rules, or components.

---

## Target experience (MVP)

- Players sit around a table
- Everyone joins the same adventure on their phone
- Players briefly describe:
  - who they are playing
  - what kind of adventure they want
- Everyone presses **Ready**
- The Storyteller:
  - proposes a few adventure pitches
  - starts narrating the chosen adventure
  - runs at least one complete scene
- Players act by writing what they do
- The Storyteller reacts, advances the fiction, and keeps things moving
- Anyone can end the session and receive a final summary

If this feels **smooth, coherent, and fun**, the MVP is successful.

---

## Audience

- Tabletop RPG players
- Groups that want a GM-less or low-prep experience
- In-person play (phones + shared screen)
- Age rating target: **10+** (tone controlled by prompts, not enforcement yet)

---

## Core design principles

1. **Narration first, UI second**  
   The Storyteller should feel like a voice, not a dashboard.

2. **Low friction onboarding**  
   No accounts, no saves, no complex setup.

3. **Continuity over cleverness**  
   Remember names, places, and facts. Avoid contradictions.

4. **Fast feedback loops**  
   Latency perception matters more than perfect prose.

5. **Phase-driven experience**  
   The server controls game phases; clients render state.

---

## MVP scope (what is included)

- Landing page with hero explanation and `Create Adventure` CTA
- Adventure creation and joining via `adventureId`
- Role selection: Player or Screen
- Text-based character and adventure description
- Ready gate (all connected `player` role clients must be ready)
- Adventure pitch generation and voting
- Scene-based play:
  - narrated intro prose
  - optional generated image per scene (async)
  - player text actions
  - storyteller responses with “fail-forward” logic
- Scene closing and summarization
- Scene-transition vote (`Next Scene` vs `End Session`)
- End session and final summary
- Local development mode (laptop as server, phones on LAN)
- AI models accessed via **OpenRouter**
  - Text models for storytelling agents
  - **FLUX.2 Klein 4B image generation via OpenRouter**

---

## Explicitly out of scope (MVP)

- Audio input/output, push-to-talk, transcription, TTS
- Music or ambience
- Mighty Decks rules, cards, stats, inventories, or components
- Multi-session campaigns or persistence
- User accounts or profiles
- Spectators
- Consent tooling, retcon voting UI, safety dashboards
- Moderation beyond basic prompt constraints

---

## Success criteria (MVP)

The MVP is considered successful if:

- 1–5 players can complete at least one scene
- The story remains coherent and understandable
- Players feel prompted to act without confusion
- Latency does not break immersion
- The group describes the experience as “fun” or “engaging”

---

## What comes after MVP (not implemented yet)

- Audio streaming and voice interaction
- Text-to-speech narration
- Mighty Decks rules and components
- Persistent campaigns and memory tools
- Consent and tone controls
- Advanced voting and retcon mechanics
- Cloud hosting and matchmaking

---

## Summary

This MVP is a **playability test**, not a full game system.

If players enjoy sitting at a table, typing what they do, and reacting to an AI-driven story that feels alive and coherent, the foundation is proven.
