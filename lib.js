(() => {
  "use strict";

  const DATA_URL = "./data/latest.json";
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

  window.HanDash = {
    $, escapeHtml, formatAction, formatClass, formatPrice, formatTargets, formatGenerated, CLASS_ORDER, DATA_URL
  };
})();
