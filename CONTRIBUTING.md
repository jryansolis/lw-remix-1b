# Make your own version

This repo (`jryansolis/lw-remix-1.0`) is the original concept. To riff on it, **make your own copy** — you get a fully independent version with its own URL, and the original is never touched.

## Get your own copy (pick one)

**Template** — a clean start, no shared history (recommended for a fresh direction):

1. On the repo page, click **Use this template → Create a new repository** (e.g. `your-username/lw-remix`).
   - _(Requires the owner to tick **Settings → Template repository** once.)_

**Fork** — keeps a link to the original, so you can pull future updates or propose ideas back:

1. Click **Fork** → creates `your-username/lw-remix-1.0`.
2. Optional, to pull the original's updates later:
   ```bash
   git remote add upstream https://github.com/jryansolis/lw-remix-1.0.git
   git fetch upstream && git merge upstream/main
   ```

## Run it

No build step — static HTML + Tailwind (CDN). After cloning your copy:

```bash
git clone https://github.com/your-username/<your-repo>.git
cd <your-repo>
python3 -m http.server 8080   # then visit http://localhost:8080
```

Or just open `index.html` in a browser.

## Put your version online

In **your** repo: **Settings → Pages → Deploy from branch → `main` / root**.
Your version goes live at `https://your-username.github.io/<your-repo>/` — separate from the original.

## What's inside

Static HTML pages (`index.html`, `topics.html`, `article*.html`, `video.html`, …) + shared interactions in `assets/app.js` (follow buttons, feed toggle, search, auth demo, comments). No frameworks — keep it openable with a double-click. Milestones on the original are tagged (`v1.0`, …).

## Notes

Concept/demo only. Headshots and the Buy Hold Sell thumbnail are real Livewire assets; other imagery is placeholder stock — confirm licensing before any production use. Keep your copy **private** if it still embeds these.
