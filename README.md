# Livewire Remix 1b

The second-generation concept redesign of [Livewire Markets](https://www.livewiremarkets.com) — denser, live, and scan-driven. Forked from [lw-remix-1.0](https://github.com/jryansolis/lw-remix-1.0); this version evolves the product, not just the skin.

**Live:** https://jryansolis.github.io/lw-remix-1b/

## What's new in 1b

- **Type system:** Besley (Clarendon display) + Literata (reading body) + Spline Sans Mono (metadata) — tuned for legibility and authoritative reading.
- **Dense home:** ~70 headlines at similar scroll depth via list patterns, hairlines and a strict image budget.
- **Markets Live:** a sister-site liveblog band whose date, timestamps and outbound Market Index URL are computed from the real clock — always "today", zero maintenance.
- **Live content:** a daily GitHub Action (`.github/workflows/refresh-feed.yml`) fetches the real Livewire RSS into `data/feed.json`; `assets/feed.js` folds items into the home Latest lists and per-topic "Fresh from the wire" rows.
- **Scans** (`scans.html`): natural-language curation — type "memory manufacturers" or "top tech ASX stocks" and get a composed digest (lead, supporting, watch, voices, related). Eight pre-mixed scans. Engine is client-side entity/synonym matching over `assets/data/index.js` (`assets/scan-engine.js`); RSS items are scannable too.
- **Multi-source feed:** Livewire + Market Index + around-the-web items with quiet mono source marks.
- **Special Reports:** one paywalled research-grade report (`article-report.html`) — oxblood-framed card, gradient gate, demo unlock; everything else stays free, and the copy says so.
- **Universal search ↔ scans:** ⌘K palette searches the full content index and offers "⌁ Scan the wire for …" on scannable asks.

## Run it

No build step — static HTML + Tailwind CDN. `python3 -m http.server 8080` (the feed/live modules use `fetch`, so prefer a server over `file://`).

Refresh the feed manually: `node scripts/fetch-feed.mjs`.

## Notes

Concept/demo only. Headshots and the Buy Hold Sell thumbnail are real Livewire assets; other imagery is placeholder stock; Market Index liveblog entries are demo copy (the date and link-out are real). General information only, not financial advice.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
