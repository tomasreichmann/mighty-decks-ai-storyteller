# Rulebook Location Image Handoff

Generate one text-free, landscape raster image for each exact path below. The three images should form a consistent set.

Shared constraints: muted medieval fantasy instructional card illustration; warm parchment and ink palette; slightly top-down, readable environment; no people in close-up; no text, labels, logos, watermarks, or sci-fi elements; clear silhouette; designed to crop well in a Mighty Decks `LocationCard`.

| Save path | Prompt |
| --- | --- |
| `apps/web/public/rules/locations/castle-gate.png` | Empty medieval castle gate with a heavy raised portcullis, stone walls and a narrow approach. Calm overcast daylight; faded umber, moss green, and dark ink outlines. |
| `apps/web/public/rules/locations/courtyard.png` | Empty medieval castle courtyard connecting a distant gate and tower, with flagstones, a small well, and open sightlines. Calm overcast daylight; faded umber, moss green, and dark ink outlines. |
| `apps/web/public/rules/locations/tower.png` | Medieval stone watchtower seen from a slightly elevated angle, with a clear staircase and battlements. Calm overcast daylight; faded umber, moss green, and dark ink outlines. |

The `/rules` figure expects these exact filenames as static web assets. Do not register them in `apps/server/output/adventure-artifacts/index.json`.
