(() => {
  "use strict";

  const INTERVAL_MS = 45000;
  const MAX_SYMBOLS = 40;

  let timerId = null;
  let inFlight = false;
  let opts = null;

  function collectSymbols() {
    const set = new Set();
    document.querySelectorAll(".js-live-price[data-ticker]").forEach((el) => {
      const sym = String(el.getAttribute("data-ticker") || "")
        .trim()
        .toUpperCase();
      if (sym) set.add(sym);
    });
    return [...set].slice(0, MAX_SYMBOLS);
  }

  function applyQuotes(quotes) {
    if (!quotes || typeof quotes !== "object") return;
    const formatPrice = window.TradeDesk && window.TradeDesk.formatPrice;
    Object.keys(quotes).forEach((sym) => {
      const q = quotes[sym];
      if (!q || typeof q.price !== "number" || !(q.price > 0)) return;
      const label = formatPrice ? formatPrice(q.price) : String(q.price);
      const pct = typeof q.change_percent === "number" ? q.change_percent : null;
      document.querySelectorAll('.js-live-price[data-ticker="' + sym + '"]').forEach((el) => {
        el.textContent = label;
        el.classList.remove("price-up", "price-down");
        if (pct != null) {
          if (pct > 0) el.classList.add("price-up");
          else if (pct < 0) el.classList.add("price-down");
        }
        el.setAttribute("title", "Live quote" + (q.as_of ? " · " + q.as_of : ""));
      });
    });
    const stamp = document.querySelector("#live-price-stamp");
    if (stamp) {
      stamp.hidden = false;
      stamp.textContent = "Live prices";
    }
  }

  async function refreshOnce() {
    if (!opts || inFlight) return;
    const symbols = collectSymbols();
    if (!symbols.length) return;

    inFlight = true;
    try {
      const { data: sessionData } = await opts.supabase.auth.getSession();
      const accessToken =
        sessionData && sessionData.session && sessionData.session.access_token;
      if (!accessToken) return;

      const endpoint =
        String(opts.supabaseUrl || "").replace(/\/$/, "") +
        "/functions/v1/stock-quotes";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          apikey: opts.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbols }),
      });

      if (!res.ok) {
        console.warn("stock-quotes failed", res.status);
        return;
      }
      const body = await res.json();
      applyQuotes(body.quotes || {});
    } catch (err) {
      console.warn("stock-quotes error", err);
    } finally {
      inFlight = false;
    }
  }

  function start(nextOpts) {
    stop();
    opts = nextOpts;
    if (!opts || !opts.supabase || !opts.supabaseUrl || !opts.anonKey) return;
    refreshOnce();
    timerId = window.setInterval(refreshOnce, INTERVAL_MS);
  }

  function stop() {
    if (timerId != null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    inFlight = false;
    opts = null;
    const stamp = document.querySelector("#live-price-stamp");
    if (stamp) stamp.hidden = true;
  }

  window.TradeDeskPrices = { start, stop, refreshOnce };
})();
