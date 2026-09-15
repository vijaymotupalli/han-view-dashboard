(() => {
  "use strict";

  const DATA_URL = "./data/latest.json";
  const MARKET_URL = "./data/market.json";
  const CLASS_ORDER = { high_conviction: 0, watchlist: 1, avoid: 2 };

  const $ = (sel) => document.querySelector(sel);

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const formatAction = (action) =>
    String(action || "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatClass = (cls) =>
    String(cls || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatPrice = (n) => {
    if (n === null || n === undefined || n === "") return "-";
    if (typeof n === "number") {
      return n.toLocaleString("en-US", {
        minimumFractionDigits: n % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      });
    }
    return escapeHtml(n);
  };

  const formatTargets = (targets) => {
    if (!Array.isArray(targets) || !targets.length) return "-";
    return targets.map(formatPrice).join(" | ");
  };

  const formatGenerated = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return escapeHtml(iso);
      return d.toLocaleString("en-US", {
        timeZone: "America/New_York",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch {
      return escapeHtml(iso);
    }
  };

  const robinhoodUrl = (ticker) => {
    const sym = String(ticker || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!sym) return "";
    return "https://robinhood.com/stocks/" + encodeURIComponent(sym);
  };

  const robinhoodLink = (ticker, label, extraClass) => {
    const url = robinhoodUrl(ticker);
    const text = label == null ? String(ticker || "") : String(label);
    if (!url) return escapeHtml(text);
    const cls = extraClass ? ' class="' + extraClass + '"' : ' class="rh-link"';
    return '<a' + cls + ' href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" title="Open on Robinhood">' +
      escapeHtml(text) + '</a>';
  };

  const impactClass = (impact) => {
    const key = String(impact || "").toLowerCase();
    if (key.includes("bull")) return "impact-bullish";
    if (key.includes("bear")) return "impact-bearish";
    if (key.includes("high")) return "impact-bearish";
    if (key.includes("medium") || key.includes("med")) return "impact-neutral";
    if (key.includes("low")) return "impact-bullish";
    return "impact-neutral";
  };

  const signalTone = (label) => {
    const key = String(label || "").toLowerCase();
    if (key.includes("strong bull")) return "signal-strong-bull";
    if (key.includes("bull")) return "signal-bull";
    if (key.includes("strong bear")) return "signal-strong-bear";
    if (key.includes("bear")) return "signal-bear";
    return "signal-neutral";
  };

  window.HanDash = {
    $,
    escapeHtml,
    formatAction,
    formatClass,
    formatPrice,
    formatTargets,
    formatGenerated,
    robinhoodUrl,
    robinhoodLink,
    impactClass,
    signalTone,
    CLASS_ORDER,
    DATA_URL,
    MARKET_URL,
  };
})();
