(() => {
  "use strict";

  const { $, escapeHtml, formatGenerated, DATA_URL, MARKET_URL } = window.HanDash;
  const { renderMarketTab } = window.HanDashMarket;
  const { renderStocksTab } = window.HanDashStocks;

  const TAB_KEY = "han-dash-tab";

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status + " fetching " + url);
    return res.json();
  }

  function setTab(tab) {
    const marketBtn = $("#tab-btn-market");
    const stocksBtn = $("#tab-btn-stocks");
    const marketPanel = $("#panel-market");
    const stocksPanel = $("#panel-stocks");
    if (!marketBtn || !stocksBtn || !marketPanel || !stocksPanel) return;

    const isMarket = tab === "market";
    marketBtn.setAttribute("aria-selected", isMarket ? "true" : "false");
    stocksBtn.setAttribute("aria-selected", isMarket ? "false" : "true");
    marketPanel.hidden = !isMarket;
    stocksPanel.hidden = isMarket;
    try {
      localStorage.setItem(TAB_KEY, isMarket ? "market" : "stocks");
    } catch {
      /* ignore */
    }
  }

  function bindTabs() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        setTab(btn.getAttribute("data-tab") || "market");
      });
    });
  }

  function pickDefaultTab(marketData, hanData) {
    let saved = null;
    try {
      saved = localStorage.getItem(TAB_KEY);
    } catch {
      saved = null;
    }
    if (saved === "market" && marketData) return "market";
    if (saved === "stocks" && hanData) return "stocks";
    if (marketData) return "market";
    return "stocks";
  }

  function renderFooter(hanData, marketData) {
    const parts = [];
    if (hanData) {
      const ctx = hanData.market_context || {};
      parts.push(
        "<div><strong>Han View:</strong> " +
          escapeHtml(formatGenerated(hanData.generated_at)) +
          " / " +
          escapeHtml(hanData.source || "-") +
          "</div>"
      );
      if (ctx.fomc || ctx.note) {
        parts.push(
          "<div><strong>Market context:</strong> FOMC " +
            escapeHtml(ctx.fomc || "-") +
            " | " +
            escapeHtml(ctx.note || "") +
            "</div>"
        );
      }
    } else {
      parts.push("<div><strong>Han View:</strong> unavailable</div>");
    }
    if (marketData) {
      parts.push(
        "<div><strong>Cary market:</strong> " +
          escapeHtml(formatGenerated(marketData.generated_at)) +
          " / " +
          escapeHtml(marketData.source || "Cary market intelligence") +
          "</div>"
      );
    } else {
      parts.push("<div><strong>Cary market:</strong> unavailable</div>");
    }
    $("#footer-meta").innerHTML = parts.join("");

    const badgeTimes = [];
    if (marketData && marketData.generated_at) badgeTimes.push(formatGenerated(marketData.generated_at));
    if (hanData && hanData.generated_at) badgeTimes.push(formatGenerated(hanData.generated_at));
    $("#generated-badge").textContent = badgeTimes[0] || "-";

    const feedBadge = $("#feed-badge");
    if (feedBadge) {
      if (hanData && marketData) {
        feedBadge.textContent = "Live feeds";
        feedBadge.hidden = false;
      } else if (hanData || marketData) {
        feedBadge.textContent = "Partial feeds";
        feedBadge.hidden = false;
      } else {
        feedBadge.hidden = true;
      }
    }
  }

  async function load() {
    bindTabs();

    const [marketResult, hanResult] = await Promise.allSettled([
      fetchJson(MARKET_URL),
      fetchJson(DATA_URL),
    ]);

    $("#loading").hidden = true;

    const marketData = marketResult.status === "fulfilled" ? marketResult.value : null;
    const hanData = hanResult.status === "fulfilled" ? hanResult.value : null;

    if (marketResult.status === "rejected") console.error(marketResult.reason);
    if (hanResult.status === "rejected") console.error(hanResult.reason);

    if (!marketData && !hanData) {
      $("#error").hidden = false;
      $("#error-message").textContent =
        "Failed to load both data/market.json and data/latest.json. Serve over HTTP so fetch works.";
      $("#app").hidden = true;
      renderFooter(null, null);
      return;
    }

    $("#error").hidden = true;
    $("#app").hidden = false;

    renderMarketTab(marketData);
    renderStocksTab(hanData);
    setTab(pickDefaultTab(marketData, hanData));
    renderFooter(hanData, marketData);
  }

  load();
})();
