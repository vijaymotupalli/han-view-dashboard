# Han View Dashboard

Dark-mode-first, mobile-friendly static dashboard that loads:

- **Han View trades** from `data/latest.json`
- **Cary market sentiment + news** from `data/market.json`

**Not financial advice.** This site is for research and educational purposes only. Trading involves risk of loss.

## Live site

After GitHub Pages is enabled:

**https://vijaymotupalli.github.io/han-view-dashboard/**

## Enable GitHub Pages

1. Open the repo: https://github.com/vijaymotupalli/han-view-dashboard
2. Go to **Settings → Pages**
3. Under **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`
4. Click **Save**
5. Wait 1–2 minutes, then visit
   https://vijaymotupalli.github.io/han-view-dashboard/

No build step is required — the site is vanilla HTML/CSS/JS.

## Update data

### Han View (`data/latest.json`)

Edit or replace `data/latest.json` on `main`. The dashboard fetches `./data/latest.json` on every page load (`cache: no-store`).

### Cary market intelligence (`data/market.json`)

**Cary publishes** `data/market.json` on `main` (`schema_version: 1`). The Market pulse section fetches `./data/market.json` in parallel with Han View data. If the market file is missing or fails, a small inline notice is shown and Han View still renders.

Do not replace Cary's live payload with ad-hoc sample shapes — keep the locked dashboard schema (see below).

## Files

| Path | Role |
|------|------|
| `index.html` | App shell (Market pulse above Han View hero) |
| `styles.css` | Dark theme base styles (includes `[hidden]` panel fix) |
| `theme.css` | Layout / table / card styles |
| `market.css` | Market pulse styles |
| `lib.js` | Shared helpers |
| `market.js` | Cary market pulse renderer |
| `app.js` | Parallel fetch + Han View + footer |
| `data/latest.json` | Han View trade payload |
| `data/market.json` | Cary market intelligence payload |
| `favicon.svg` | Brand mark |

## `data/market.json` schema (Cary → dashboard)

Locked fields Cary publishes (`schema_version: 1`):

| Field | Notes |
|-------|--------|
| `schema_version` | `1` |
| `generated_at` | ISO-8601 timestamp |
| `source` | Provenance (e.g. `Cary`) |
| `disclaimer` | Optional short disclaimer under Market pulse |
| `market_regime` | Regime title (UI also accepts legacy `regime`) |
| `signal_score` | Numeric score; label bands: +60..+100 Strong Bullish, +25..+59 Bullish, -24..+24 Neutral / Mixed, -25..-59 Bearish, -60..-100 Strong Bearish |
| `signal_label` | Display label matching the score band |
| `outlook` | `{ spy, qqq, small_caps, semiconductors, volatility_risk }` |
| `top_stories[]` | `{ headline, impact, strength, affected[], status? }` — `summary` accepted as fallback for status text |
| `fed` | `{ bias, current_target, next_decision, hike_probability_pct, expected_move_bp, expected_target, key_event }` |
| `catalysts` | `{ top_bullish, top_bearish, most_important_today, next_extreme_event: { when, what } }` |
| `scenarios` | `bull` / `base` / `bear` with `probability_pct` + `summary` |
| `snapshot` | `{ ten_year_yield_pct, vix, vix_class, wti_usd, brent_usd, dxy, geo_risk }` |
| `levels` | `{ spy_support[], spy_resistance[], note }` |

The UI also tolerates a transitional / legacy shape (`regime`, `summary`, scenario `probability` + level strings).

## `data/latest.json` schema notes (Han View)

Top-level fields:

- `generated_at` — ISO-8601 timestamp (shown in header/footer)
- `source` — data provenance string
- `market_context` — e.g. `{ "fomc": "YYYY-MM-DD", "note": "..." }`
- `best_opportunity` — hero card (ticker, action, levels, views)
- `dashboard` — table rows
- `tickers` — expandable Han view vs my analysis cards

### `best_opportunity.action` values

`BUY_NOW` | `WAIT_FOR_PULLBACK` | `WAIT_FOR_BREAKOUT` | `WATCH_ONLY` | `AVOID`

### `dashboard[].class` values

`high_conviction` | `watchlist` | `avoid`
(Table sorts high conviction → watchlist → avoid.)

### Dashboard row fields

ticker, company, direction, entry, current_price, target, stop, status, my_rating, class, post_url, post_time_et

### Ticker detail fields

- `han`: `summary`, `direction`, `entry`, `target`, `stop`
- `analysis`: `preferred_entry`, `aggressive_entry`, `conservative_entry`, `stop`, `targets[]`, `opinion`, `confidence`, `horizon`, `risks[]`

## Local preview

Because `fetch` requires HTTP(S), open via a simple static server from the repo root:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Disclaimer

This dashboard does **not** constitute financial, investment, or trading advice. Ideas, levels, and ratings are illustrative research samples and may be incomplete, delayed, or wrong. Do your own research. Past performance is not indicative of future results.
