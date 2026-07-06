# Signal &amp; Noise Lab

A collection of **20 standalone forecasting exercises** for teaching non-statistics
undergraduates the core ideas behind good judgement under uncertainty: signal vs.
noise, calibration, Brier scoring, base rates, Bayesian updating, aggregation, and
decision-making under information.

Each exercise is its own self-contained web page, hosted together on GitHub Pages
with a hub that links them all. Built by _Maxted Neal_.

**Live site:** `https://<your-username>.github.io/noise-judgement-prediction/`

---

## What's here

| Group | Exercises |
|---|---|
| **Core stations** | Spot the Signal · Calibration Quiz · Brier Arena · Base Rate Trap · Bayesian Theater · Wisdom of Crowds |
| **Quick drills** | Forecaster's Tournament · Drift Detector · Anchoring Lab · Versus the Crowd |
| **Domain sims** | Election Night · Outbreak Tracker · A/B Test Director · Hiring Roulette |
| **Decision sims** | Detective · Trial Lawyer · Stock Picker · VC Portfolio · Inspector · Whistleblower |

Each page renders a single React component with a light chrome (title + a link back
to the hub). There is **no cross-page state, login, or backend** — a page is a page.

## How it's built

The exercises are authored as JSX in `src/` and compiled to plain browser JavaScript
by a small [esbuild](https://esbuild.github.io/)-based script. There is **no bundler
and no CDN dependency at runtime** — React is vendored into the repo, so every page
works offline and is immune to third-party CDN outages.

```
repo/
  src/                     ← editable source (the source of truth)
    ui.jsx                 ← shared UI atoms (Button, Panel, sliders, …)
    charts.jsx             ← chart/visualisation helpers + seeded RNG
    stations.jsx           ← the 6 core stations
    sims-drills.jsx        ← tournament · drift · anchor · versus-the-crowd
    sims-domain.jsx        ← election · outbreak · a/b-test · hiring
    sims-decision.jsx      ← trial · vc · inspector · whistleblower
    games.jsx              ← election · detective · stock picker
    shared/
      theme.css            ← design tokens + base styles (warm / cool / dark)
      vendor/              ← React + ReactDOM UMD (vendored, committed)
  build.mjs                ← transpiles src → docs (one self-contained page each)
  docs/                    ← BUILD OUTPUT — the GitHub Pages site (committed)
    index.html             ← hub
    <exercise>/index.html  ← one page per exercise
    shared/                ← vendored React, copied at build time
  design-source/           ← original Claude Design prototype + chat transcripts (provenance)
```

### Build

```bash
npm install      # dev-only: esbuild (React is already vendored in src/shared/vendor)
npm run build    # transpiles src/ → docs/
```

`docs/` is committed so the site deploys without a CI build step. Re-run `npm run build`
after editing anything in `src/` and commit the regenerated `docs/`.

### Deploy (GitHub Pages)

Settings → **Pages** → Source: **Deploy from a branch** → Branch: **`main`**, folder:
**`/docs`**. The hub is served at the repo root URL; each exercise lives at
`/<exercise>/`. A `.nojekyll` file is emitted so paths starting with `_` or `shared/`
are served verbatim.

## Editing content

Question banks, likelihood ratios, and scenario curves live inline at the top of each
component file (e.g. `TournamentQuestions`, `BrierEvents`, `HiringPool`). Swapping in
your own course-specific items is usually a one-array edit followed by `npm run build`.

---

## Changes from the original prototype

This build is a from-scratch re-implementation of the Claude Design prototype (kept in
`design-source/` for reference), stripped down to the simulations and re-issued as
standalone pages, with an adversarial review's worth of correctness and pedagogy fixes:

**Correctness**
- Calibration: fixed a double-counted final question; replaced a contested item
  (Nile/Amazon) with a clean one (Australia vs. Greenland).
- Wisdom of Crowds: corrected an inverted percentage and reframed the reveal to teach
  when a crowd's _shared bias_ makes aggregation fail.
- Moved `recordScore` out of render in Hiring, VC, Inspector, and Whistleblower
  (these were calling a parent state setter during a child's render).
- Forecaster's Tournament: corrected the Russia-vs-Pluto item and rebalanced the
  question set to 6 true / 6 false so "always say true" scores at chance.

**Pedagogy / modelling**
- Calibration uses a 50–100% half-range slider (it's a 2-alternative forced choice) and
  flags the small-sample caveat on the curve.
- Brier Arena notes that "optimal" minimises _expected_ Brier, not any single outcome.
- Bayesian Theater adds a prediction-then-reveal assessment phase and states the
  conditional-independence assumption behind multiplying likelihood ratios.
- Election Night and Outbreak Tracker are graded against a **reference Bayesian
  forecaster trajectory** (what you should have believed given the data so far), not the
  single realised outcome — so a lucky early "100%" scores badly.
- A/B Test Director grades the _process_ (the disciplined call at each decision point),
  shows a 95% CI on the lift, and reveals the eventual outcome to make the
  process-vs-resulting distinction explicit.
- Anchoring Lab now uses a balanced high/low design and measures the anchoring _effect_
  (mean log-deviation gap between conditions) instead of a knowledge-confounded raw
  correlation.
- VC Portfolio resolves each startup from a real outcome _distribution_ and grades on the
  expected value of your allocation (skill) while showing the realised draw (luck).
- Whistleblower adds an "investigate source" step so provenance is visible _before_ you
  commit, and correctly treats the hearsay rumor as part of the correlated cluster.
- Inspector adds a savings-vs-threshold curve; Trial Lawyer adds independence and
  prior-framing caveats; Stock Picker is reframed as an explicit even-money directional
  contract (payoff is ±stake on direction, not the size of the move).

## Known limitations

- **Fixed random seeds.** Most exercises use fixed seeds, so answers are memorisable and
  shareable between cohorts. This is acceptable for projected, whole-class use; a future
  version could parameterise the seed via a URL query.
- **"Hard" difficulty (Spot the Signal only)** multiplies noise without changing the
  answer key.
- **No persistence or integrated report.** These standalone pages intentionally drop the
  original app's localStorage progress and the cross-station lab report. Restoring an
  integrated "lab" view as its own page is possible future work.
