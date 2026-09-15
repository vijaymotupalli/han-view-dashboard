(() => {
  "use strict";

  const {
    escapeHtml,
    formatAction,
    formatClass,
    formatPrice,
    formatTargets,
    robinhoodLink,
    CLASS_ORDER,
  } = window.HanDash;

  function findTickerDetail(tickers, symbol) {
    const key = String(symbol || "").toUpperCase();
    if (!key || !Array.isArray(tickers)) return null;
    return tickers.find((t) => String(t.ticker || "").toUpperCase() === key) || null;
  }

  function renderExpandAnalysis(detail, ticker) {
    if (!detail) {
      return '<p class="expand-empty">No deep analysis yet for ' + escapeHtml(ticker) + ".</p>";
    }
    const han = detail.han || {};
    const analysis = detail.analysis || {};
    const risks = Array.isArray(analysis.risks) ? analysis.risks : [];

    return (
      '<div class="card-cols">' +
      '<div class="col-box"><h4>Primary view</h4><dl class="kv">' +
      '<dt>Summary</dt><dd style="font-family:var(--font)">' +
      escapeHtml(han.summary) +
      "</dd>" +
      "<dt>Direction</dt><dd>" +
      escapeHtml(han.direction) +
      "</dd>" +
      "<dt>Entry</dt><dd>" +
      escapeHtml(han.entry) +
      "</dd>" +
      "<dt>Target</dt><dd>" +
      escapeHtml(han.target) +
      "</dd>" +
      "<dt>Stop</dt><dd>" +
      formatPrice(han.stop) +
      "</dd></dl></div>" +
      '<div class="col-box mine"><h4>My analysis</h4><dl class="kv">' +
      "<dt>Preferred</dt><dd>" +
      escapeHtml(analysis.preferred_entry) +
      "</dd>" +
      "<dt>Aggressive</dt><dd>" +
      formatPrice(analysis.aggressive_entry) +
      "</dd>" +
      "<dt>Conservative</dt><dd>" +
      formatPrice(analysis.conservative_entry) +
      "</dd>" +
      "<dt>Stop</dt><dd>" +
      formatPrice(analysis.stop) +
      "</dd>" +
      "<dt>Targets</dt><dd>" +
      formatTargets(analysis.targets) +
      "</dd>" +
      "<dt>Confidence</dt><dd>" +
      escapeHtml(analysis.confidence) +
      "</dd>" +
      "<dt>Horizon</dt><dd>" +
      escapeHtml(analysis.horizon) +
      "</dd></dl>" +
      '<p class="opinion">' +
      escapeHtml(analysis.opinion) +
      "</p>" +
      (risks.length
        ? '<ul class="risks">' +
          risks.map((r) => "<li>" + escapeHtml(r) + "</li>").join("") +
          "</ul>"
        : "") +
      '<p class="rh-card-link">' +
      robinhoodLink(ticker, "Open " + String(ticker || "") + " on Robinhood", "rh-link") +
      "</p>" +
      "</div></div>"
    );
  }

  function renderCompactStrip(best) {
    if (!best) {
      return '<div class="stocks-strip panel"><p class="section-sub">No best opportunity in data.</p></div>';
    }
    const actionClass = "action-" + escapeHtml(best.action || "WATCH_ONLY");
    return (
      '<div class="stocks-strip panel" aria-label="Best opportunity">' +
      '<div class="strip-left">' +
      '<span class="hero-label">Best opportunity</span>' +
      '<span class="strip-ticker">' +
      robinhoodLink(best.ticker, best.ticker, "rh-link hero-rh") +
      "</span>" +
      '<span class="action-badge ' +
      actionClass +
      '">' +
      escapeHtml(formatAction(best.action)) +
      "</span>" +
      "</div>" +
      '<div class="strip-right">' +
      '<span class="meta-chip mono">' +
      robinhoodLink(best.ticker, formatPrice(best.current_price), "rh-link price-rh") +
      "</span>" +
      robinhoodLink(best.ticker, "Open on Robinhood", "meta-chip rh-chip") +
      "</div></div>"
    );
  }

  function sortDashboard(rows) {
    return [...(rows || [])].sort((a, b) => {
      const ca = CLASS_ORDER[a.class] ?? 99;
      const cb = CLASS_ORDER[b.class] ?? 99;
      if (ca !== cb) return ca - cb;
      const tb = Date.parse(b.post_time_et || "") || 0;
      const ta = Date.parse(a.post_time_et || "") || 0;
      if (tb !== ta) return tb - ta;
      return String(a.ticker).localeCompare(String(b.ticker));
    });
  }

  function renderStocksTab(hanData) {
    const root = document.querySelector("#stocks-root");
    if (!root) return;

    if (!hanData) {
      root.innerHTML =
        '<div class="panel market-notice"><strong>Stocks feed unavailable.</strong> Could not load protected feed data.</div>';
      return;
    }

    const tickers = hanData.tickers || [];
    const sorted = sortDashboard(hanData.dashboard);
    const colCount = 11;

    let tableBody;
    if (!sorted.length) {
      tableBody = '<tr><td colspan="' + colCount + '">No dashboard rows.</td></tr>';
    } else {
      tableBody = sorted
        .map((row, idx) => {
          const cls = escapeHtml(row.class || "watchlist");
          const dirRaw = String(row.direction || "");
          const dirClass = escapeHtml(dirRaw.replace(/[^A-Za-z]/g, "").toUpperCase() || "NA");
          const dir = escapeHtml(dirRaw);
          const priceLabel = formatPrice(row.current_price);
          const detail = findTickerDetail(tickers, row.ticker);
          const expandId = "expand-" + idx;

          const mainRow =
            '<tr class="dash-row" data-expand="' +
            expandId +
            '" tabindex="0" role="button" aria-expanded="false" aria-controls="' +
            expandId +
            '">' +
            '<td class="expand-cell"><span class="row-chevron" aria-hidden="true">▸</span></td>' +
            '<td class="ticker-cell">' +
            robinhoodLink(row.ticker, row.ticker, "rh-link ticker-rh") +
            '<span class="company">' +
            escapeHtml(row.company || "") +
            "</span></td>" +
            '<td class="mono current-price-cell">' +
            robinhoodLink(row.ticker, priceLabel, "rh-link price-rh") +
            "</td>" +
            '<td><span class="class-pill class-' +
            cls +
            '">' +
            escapeHtml(formatClass(row.class)) +
            "</span></td>" +
            '<td class="dir-' +
            dirClass +
            '">' +
            (dir || "-") +
            "</td>" +
            '<td class="mono">' +
            escapeHtml(row.entry) +
            "</td>" +
            '<td class="mono">' +
            formatPrice(row.target) +
            "</td>" +
            '<td class="mono">' +
            formatPrice(row.stop) +
            "</td>" +
            "<td>" +
            escapeHtml(row.status) +
            "</td>" +
            '<td class="mono">' +
            escapeHtml(row.my_rating) +
            "</td>" +
            '<td><a class="post-link" href="' +
            escapeHtml(row.post_url) +
            '" target="_blank" rel="noopener noreferrer">View</a>' +
            '<span class="post-time">' +
            escapeHtml(row.post_time_et) +
            "</span></td>" +
            "</tr>";

          const expandRow =
            '<tr class="expand-row" id="' +
            expandId +
            '" hidden>' +
            '<td colspan="' +
            colCount +
            '"><div class="expand-body">' +
            renderExpandAnalysis(detail, row.ticker) +
            "</div></td></tr>";

          return mainRow + expandRow;
        })
        .join("");
    }

    root.innerHTML =
      renderCompactStrip(hanData.best_opportunity) +
      '<section class="section" aria-labelledby="dashboard-title">' +
      '<div class="section-head">' +
      '<h2 id="dashboard-title">Trade Desk</h2>' +
      '<p class="section-sub">High conviction → watchlist → avoid · click a row for deep analysis · ticker &amp; price open on Robinhood</p>' +
      "</div>" +
      '<div class="table-wrap panel">' +
      '<table class="dash-table" id="dash-table">' +
      "<thead><tr>" +
      '<th class="expand-th" aria-label="Expand"></th>' +
      "<th>Ticker</th><th>Current price</th><th>Class</th><th>Dir</th>" +
      "<th>Entry</th><th>Target</th><th>Stop</th><th>Status</th><th>Rating</th><th>Post</th>" +
      "</tr></thead>" +
      '<tbody id="dash-body">' +
      tableBody +
      "</tbody></table></div></section>";

    bindExpandHandlers(root);
  }

  function toggleExpand(row) {
    const id = row.getAttribute("data-expand");
    if (!id) return;
    const expand = document.getElementById(id);
    if (!expand) return;
    const open = expand.hidden === false;
    document.querySelectorAll(".expand-row").forEach((r) => {
      r.hidden = true;
    });
    document.querySelectorAll(".dash-row").forEach((r) => {
      r.classList.remove("is-expanded");
      r.setAttribute("aria-expanded", "false");
    });
    if (!open) {
      expand.hidden = false;
      row.classList.add("is-expanded");
      row.setAttribute("aria-expanded", "true");
    }
  }

  function bindExpandHandlers(root) {
    root.querySelectorAll(".dash-row").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        toggleExpand(row);
      });
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleExpand(row);
        }
      });
    });
  }

  window.HanDashStocks = { renderStocksTab };
})();
