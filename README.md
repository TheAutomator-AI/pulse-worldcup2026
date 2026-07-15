# PULSE — Stadium Intelligence for the FIFA World Cup 2026

**Every fan finds their gate. Every surge gets seen first.**

PULSE is a GenAI-powered concept platform for stadium operations and fan experience. It pairs a live crowd-density model with a real, working Claude integration — a multilingual fan concierge and an operations decision console — across two linked views: **Fan Experience** and **Control Room**.

Built by Raja.

> Independent concept project. Not affiliated with or endorsed by FIFA.

---

## What it does

| Pillar | Where |
|---|---|
| **Navigation** | Live 3D crowd map (Three.js) + per-gate "AI route" suggestions |
| **Crowd management** | Simulated live gate-density engine driving the map, hero visual, and alerts |
| **Accessibility** | Dedicated accessibility panel + concierge routing that accounts for it |
| **Transportation** | Live shuttle ETAs + an AI transit advisor |
| **Sustainability** | Live eco-impact counter + personalized AI eco tips |
| **Multilingual assistance** | Concierge chat replies in whatever language the fan writes in |
| **Operational intelligence** | Control Room KPI dashboard, gate bars, volunteer roster |
| **Real-time decision support** | AI decision console: describe a situation, get a structured action plan, then auto-draft a 3-language PA announcement |

Every AI-labeled button in the app makes a **real call to Claude** through the backend in this repo — nothing is canned or pre-scripted. If the backend isn't running, those buttons fail gracefully with a friendly "unavailable" message; the rest of the UI (3D hero, cursor, live simulation, flip-scoreboard numbers) still works.

---

## Project structure

```
pulse-worldcup2026/
├── index.html          Frontend markup
├── css/styles.css       All styles (design tokens, layout, animation)
├── js/app.js            All frontend logic (3D scene, cursor, simulation, chat, API calls)
├── api/claude.js        Vercel serverless function — proxies Claude API calls
├── server.js            Express server — same proxy, for local/traditional hosting
├── package.json
├── .env.example          Copy to .env and add your key
├── .gitignore
└── LICENSE               MIT
```

The frontend never calls `api.anthropic.com` directly — it calls `POST /api/claude` on **this repo's own backend**, which holds your API key server-side. That route is implemented twice (`api/claude.js` for Vercel, `server.js` for Express) but both expose the identical contract, so the frontend code doesn't change depending on where you host it.

---

## Getting started

### Option A — Deploy to Vercel (fastest, recommended)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. In the project's **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com)
   - *(optional)* `ANTHROPIC_MODEL` = a specific model ID (see [docs.claude.com](https://docs.claude.com) for current options; defaults to `claude-sonnet-5`)
4. Deploy. Vercel auto-detects the `/api` folder as a serverless function and serves everything else as static files — no extra config needed.

### Option B — Run locally with Node

```bash
npm install
cp .env.example .env      # then edit .env and add your ANTHROPIC_API_KEY
npm start
# open http://localhost:3000
```

### Option C — Just preview the UI, no backend

Open `index.html` directly in a browser. The 3D hero, custom cursor, live gate simulation, and flip-scoreboard numbers all work with zero setup. The AI-powered buttons (Concierge, AI route, eco tip, transit advisor, decision console, PA drafter) will show an "unavailable" message until a backend from Option A or B is running.

---

## Security note

`ANTHROPIC_API_KEY` must **only** ever live in your `.env` file (local) or your host's environment variable settings (Vercel, etc.) — never in frontend code, never committed to git. `.gitignore` already excludes `.env`.

---

## Customizing

- **Colors / type / motion tokens** — all CSS custom properties at the top of `css/styles.css` (`:root`).
- **Gates / zones** — the `GATES` array near the top of `js/app.js` drives the map, the 3D hero point colors, and the alert simulation.
- **AI behavior** — each feature's system prompt lives right next to its button handler in `js/app.js` (search for `callClaude(`), so tone and scope are easy to tune per feature.
- **Model** — set `ANTHROPIC_MODEL` in your environment to swap models without touching code.

---

## License

MIT © 2026 Raja — see [LICENSE](LICENSE).
