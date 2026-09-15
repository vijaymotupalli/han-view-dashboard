# Trade Desk

Dark-mode-first, mobile-friendly static dashboard with a **two-tab** layout:

- **Market** — Cary market sentiment, signal score, outlook chips, and a news list of `top_stories` (with citations / links when present)
- **Stocks** — Trade Desk table (expandable rows for deep analysis) + compact best-opportunity strip

**Not financial advice.** This site is for research and educational purposes only. Trading involves risk of loss.

Feeds are stored in **Supabase** (`public.dashboard_feeds`) with RLS: **authenticated SELECT only**. The static GitHub Pages site uses magic-link auth (email OTP) via the public anon key.

> Migration note: repo folder / Pages path may still use the historical `han-view-dashboard` name; UI branding is **Trade Desk**. Feed row ids `han_view` and `cary_market` are unchanged DB keys.

## Live site

**https://vijaymotupalli.github.io/han-view-dashboard/**

## Auth setup (required once)

In **Supabase Dashboard → Authentication → URL Configuration**, set:

**Site URL**

- `https://vijaymotupalli.github.io/han-view-dashboard/`

**Redirect URLs** (add all that apply)

- `https://vijaymotupalli.github.io/han-view-dashboard/`
- `https://vijaymotupalli.github.io/han-view-dashboard/index.html`
- `https://vijaymotupalli.com/han-view-dashboard/` (if using a custom domain)
- `http://localhost:5500/` (optional, local preview)

Also enable **Email** provider / magic link (OTP) under Authentication → Providers.

Then open the live site, enter your email, and click **Email me a magic link**. After you open the email link, you return signed in and feeds load from Supabase.

`config.js` holds `SUPABASE_URL` + `SUPABASE_ANON_KEY` (anon is public by design with RLS). **Never commit the `service_role` key.**

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

No build step is required — the site is vanilla HTML/CSS/JS (+ Supabase JS from jsDelivr ESM CDN).

## UI notes

- Sticky tab bar: **Market | Stocks** (`aria-selected` on semantic buttons)
- Default tab: Market if Cary feed loads, else Stocks; last tab remembered in `localStorage` key `han-dash-tab`
- Unauthenticated visitors see a centered **Trade Desk** magic-link login card (no Market/Stocks data)
- Authenticated users: header shows email + **Sign out**; app fetches `dashboard_feeds` and maps `han_view` → Stocks, `cary_market` → Market
- Market news items show `source_name` (citation) and a **Read full story** link when `url` is present; otherwise muted “No link” (no invented URLs)
- Fed / snapshot / levels / scenarios / catalysts live in a collapsible **Details** section (closed by default)
- Stocks table sorts `high_conviction` → `watchlist` → `avoid`; click a row to expand inline analysis from `tickers[]`
- Robinhood helpers: ticker & current price link to `https://robinhood.com/stocks/{TICKER}`
- `[hidden]` CSS fix preserved so tab panels / login / auth chrome stay correctly hidden

## Update data

Live payloads live in Supabase table `public.dashboard_feeds` (ids `han_view`, `cary_market`), not in the public JSON files.

Repo stubs `data/latest.json` and `data/market.json` are placeholders (`login_required`) so raw GitHub URLs no longer leak full feeds. Upsert new payloads into Supabase (service role / SQL / MCP) instead of committing full JSON.

## Files

| Path | Role |
|------|------|
| `index.html` | App shell (login gate + two-tab layout) |
| `login.css` | Centered premium magic-link auth screen |
| `config.js` | Public Supabase URL + anon key |
| `styles.css` | Dark theme base + tab bar + auth helpers (`[hidden]` panel fix) |
| `theme.css` | Stocks table / strip / expand styles |
| `market.css` | Market tab + news list styles |
| `lib.js` | Shared helpers (`robinhoodUrl` / `robinhoodLink`) |
| `market.js` | Market tab renderer |
| `stocks.js` | Stocks tab renderer |
| `app.js` | Supabase auth + feed fetch + tab switching + footer |
| `data/latest.json` | Placeholder (data behind auth) |
| `data/market.json` | Placeholder (data behind auth) |
| `favicon.svg` | Brand mark |

## Feed payload schemas

### Cary market (`cary_market` / former `data/market.json`)

Locked fields (`schema_version: 1`):

| Field | Notes |
|-------|--------|
| `schema_version` | `1` |
| `generated_at` | ISO-8601 timestamp |
| `source` | Provenance (e.g. `Cary`) |
| `disclaimer` | Optional short disclaimer under Market tab |
| `market_regime` | Regime title (UI also accepts legacy `regime`) |
| `signal_score` | Numeric score; label bands: +60..+100 Strong Bullish, +25..+59 Bullish, -24..+24 Neutral / Mixed, -25..-59 Bearish, -60..-100 Strong Bearish |
| `signal_label` | Display label matching the score band |
| `outlook` | `{ spy, qqq, small_caps, semiconductors, volatility_risk }` |
| `top_stories[]` | `{ headline, impact, strength, affected[], status?, summary?, source_name?, url? }` |
| `fed` | `{ bias, current_target, next_decision, hike_probability_pct, expected_move_bp, expected_target, key_event }` |
| `catalysts` | `{ top_bullish, top_bearish, most_important_today, next_extreme_event: { when, what } }` |
| `scenarios` | `bull` / `base` / `bear` with `probability_pct` + `summary` |
| `snapshot` | `{ ten_year_yield_pct, vix, vix_class, wti_usd, brent_usd, dxy, geo_risk }` |
| `levels` | `{ spy_support[], spy_resistance[], note }` |

### Stocks feed (`han_view` / former `data/latest.json`)

Top-level fields:

- `generated_at` — ISO-8601 timestamp (shown in header/footer)
- `source` — data provenance string
- `market_context` — e.g. `{ "fomc": "YYYY-MM-DD", "note": "..." }`
- `best_opportunity` — compact Stocks strip (ticker, action, price)
- `dashboard` — table rows (expandable)
- `tickers` — deep analysis matched by ticker into row expand panels (payload may include a `han` object for the primary-view column)

### `best_opportunity.action` values

`BUY_NOW` | `WAIT_FOR_PULLBACK` | `WAIT_FOR_BREAKOUT` | `WATCH_ONLY` | `AVOID`

### `dashboard[].class` values

`high_conviction` | `watchlist` | `avoid`

## Local preview

Because `fetch` / Supabase auth require HTTP(S):

```bash
python3 -m http.server 5500
# then visit http://localhost:5500/
```

Add `http://localhost:5500/` to Supabase Redirect URLs for magic-link return.

## Disclaimer

This dashboard does **not** constitute financial, investment, or trading advice. Ideas, levels, and ratings are illustrative research samples and may be incomplete, delayed, or wrong. Do your own research. Past performance is not indicative of future results.
