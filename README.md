# Han View Dashboard

Dark-mode-first, mobile-friendly static trade dashboard that loads all content from `data/latest.json` at runtime.

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

Edit or replace `data/latest.json` on `main`. The dashboard fetches `./data/latest.json` on every page load (`cache: no-store`).

You can update the JSON via GitHub’s web editor, a local commit/push, or any API that writes to the repo.

## Files

| Path | Role |
|------|------|
| `index.html` | App shell |
| `styles.css` | Dark theme, responsive layout |
| `app.js` | Fetch + render |
| `data/latest.json` | Live data payload |
| `favicon.svg` | Brand mark |

## JSON schema notes

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

`ticker`, `company`, `direction`, `entry`, `current_price`, `target`, `stop`, `status`, `my_rating`, `class`, `post_url`, `post_time_et`

### Ticker detail fields

- `han`: `summary`, `direction`, `entry`, `target`, `stop`
- `analysis`: `preferred_entry`, `aggressive_entry`, `conservative_entry`, `stop`, `targets[]`, `opinion`, `confidence`, `horizon`, `risks[]`

The bundled `data/latest.json` is a **research sample** with placeholder X/Twitter post URLs.

## Local preview

Because `fetch` requires HTTP(S), open via a simple static server from the repo root:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Disclaimer

This dashboard does **not** constitute financial, investment, or trading advice. Ideas, levels, and ratings are illustrative research samples and may be incomplete, delayed, or wrong. Do your own research. Past performance is not indicative of future results.
