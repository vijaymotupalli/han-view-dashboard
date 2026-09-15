(() => {
  "use strict";
  const { $, escapeHtml, formatAction, formatClass, formatPrice, formatTargets, formatGenerated, CLASS_ORDER, DATA_URL } = window.HanDash;

  function renderHero(best) {
    if (!best) { $("#hero").innerHTML = "<p>No best opportunity in data.</p>"; return; }
    const actionClass = `action-${escapeHtml(best.action || "WATCH_ONLY")}`;
    $("#hero").innerHTML = `
      <div class="hero-top">
        <div>
          <p class="hero-label">Best opportunity</p>
          <h2 id="hero-title" class="hero-ticker">${escapeHtml(best.ticker)}</h2>
        </div>
        <span class="action-badge ${actionClass}">${escapeHtml(formatAction(best.action))}</span>
      </div>
      <div class="levels" role="list">
        <div class="level-card" role="listitem"><span class="label">Current</span><span class="value">${formatPrice(best.current_price)}</span></div>
        <div class="level-card" role="listitem"><span class="label">Preferred entry</span><span class="value">${escapeHtml(best.preferred_entry)}</span></div>
        <div class="level-card" role="listitem"><span class="label">Stop</span><span class="value">${formatPrice(best.stop)}</span></div>
        <div class="level-card" role="listitem"><span class="label">Targets</span><span class="value">${formatTargets(best.targets)}</span></div>
      </div>
      <div class="hero-views">
        <div class="view-box"><h3>Han's view</h3><p>${escapeHtml(best.han_view)}</p></div>
        <div class="view-box"><h3>My view</h3><p>${escapeHtml(best.my_view)}</p></div>
      </div>
      <div class="hero-meta">
        <span class="meta-chip">Confidence: ${escapeHtml(best.confidence)}</span>
        <span class="meta-chip">Horizon: ${escapeHtml(best.horizon)}</span>
      </div>`;
  }

  function renderDashboard(rows) {
    const sorted = [...(rows || [])].sort((a, b) => {
      const ca = CLASS_ORDER[a.class] ?? 99;
      const cb = CLASS_ORDER[b.class] ?? 99;
      if (ca !== cb) return ca - cb;
      return String(a.ticker).localeCompare(String(b.ticker));
    });
    const body = $("#dash-body");
    if (!sorted.length) { body.innerHTML = `<tr><td colspan="10">No dashboard rows.</td></tr>`; return; }
    body.innerHTML = sorted.map((row) => {
      const cls = escapeHtml(row.class || "watchlist");
      const dir = escapeHtml(row.direction || "");
      return `<tr>
        <td class="ticker-cell">${escapeHtml(row.ticker)}<span class="company">${escapeHtml(row.company || "")}</span></td>
        <td><span class="class-pill class-${cls}">${escapeHtml(formatClass(row.class))}</span></td>
        <td class="dir-${dir}">${dir || "-"}</td>
        <td class="mono">${escapeHtml(row.entry)}</td>
        <td class="mono">${formatPrice(row.current_price)}</td>
        <td class="mono">${formatPrice(row.target)}</td>
        <td class="mono">${formatPrice(row.stop)}</td>
        <td>${escapeHtml(row.status)}</td>
        <td class="mono">${escapeHtml(row.my_rating)}</td>
        <td><a class="post-link" href="${escapeHtml(row.post_url)}" target="_blank" rel="noopener noreferrer">View</a>
          <span class="post-time">${escapeHtml(row.post_time_et)}</span></td>
      </tr>`;
    }).join("");
  }

  function renderTickerCards(tickers) {
    const root = $("#ticker-cards");
    if (!tickers || !tickers.length) { root.innerHTML = "<p class='section-sub'>No ticker details.</p>"; return; }
    root.innerHTML = tickers.map((t, idx) => {
      const han = t.han || {};
      const analysis = t.analysis || {};
      const risks = Array.isArray(analysis.risks) ? analysis.risks : [];
      const openAttr = idx === 0 ? " open" : "";
      return `<details class="ticker-card"${openAttr}>
        <summary>
          <div class="card-summary-left">
            <span class="card-ticker">${escapeHtml(t.ticker)}</span>
            <span class="meta-chip">${escapeHtml(han.direction || "-")}</span>
            <span class="meta-chip">${escapeHtml(analysis.confidence || "-")}</span>
            <span class="meta-chip">${escapeHtml(analysis.horizon || "-")}</span>
          </div>
          <span class="card-chevron" aria-hidden="true">v</span>
        </summary>
        <div class="card-body"><div class="card-cols">
          <div class="col-box">
            <h4>Han's view</h4>
            <dl class="kv">
              <dt>Summary</dt><dd style="font-family:var(--font)">${escapeHtml(han.summary)}</dd>
              <dt>Direction</dt><dd>${escapeHtml(han.direction)}</dd>
              <dt>Entry</dt><dd>${escapeHtml(han.entry)}</dd>
              <dt>Target</dt><dd>${escapeHtml(han.target)}</dd>
              <dt>Stop</dt><dd>${formatPrice(han.stop)}</dd>
            </dl>
          </div>
          <div class="col-box mine">
            <h4>My analysis</h4>
            <dl class="kv">
              <dt>Preferred</dt><dd>${escapeHtml(analysis.preferred_entry)}</dd>
              <dt>Aggressive</dt><dd>${formatPrice(analysis.aggressive_entry)}</dd>
              <dt>Conservative</dt><dd>${formatPrice(analysis.conservative_entry)}</dd>
              <dt>Stop</dt><dd>${formatPrice(analysis.stop)}</dd>
              <dt>Targets</dt><dd>${formatTargets(analysis.targets)}</dd>
              <dt>Confidence</dt><dd>${escapeHtml(analysis.confidence)}</dd>
              <dt>Horizon</dt><dd>${escapeHtml(analysis.horizon)}</dd>
            </dl>
            <p class="opinion">${escapeHtml(analysis.opinion)}</p>
            ${risks.length ? `<ul class="risks">${risks.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>` : ""}
          </div>
        </div></div>
      </details>`;
    }).join("");
  }

  function renderFooter(data) {
    const ctx = data.market_context || {};
    $("#footer-meta").innerHTML = `
      <div><strong>Generated:</strong> ${escapeHtml(formatGenerated(data.generated_at))}</div>
      <div><strong>Source:</strong> ${escapeHtml(data.source || "-")}</div>
      <div><strong>Market context:</strong> FOMC ${escapeHtml(ctx.fomc || "-")} | ${escapeHtml(ctx.note || "")}</div>`;
    $("#generated-badge").textContent = formatGenerated(data.generated_at);
  }

  function showError(message) {
    $("#loading").hidden = true; $("#app").hidden = true; $("#error").hidden = false;
    $("#error-message").textContent = message;
  }

  async function load() {
    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${DATA_URL}`);
      const data = await res.json();
      renderHero(data.best_opportunity);
      renderDashboard(data.dashboard);
      renderTickerCards(data.tickers);
      renderFooter(data);
      $("#loading").hidden = true; $("#error").hidden = true; $("#app").hidden = false;
    } catch (err) {
      console.error(err);
      showError(err && err.message ? err.message : "Failed to load data/latest.json. Serve over HTTP so fetch works.");
    }
  }

  load();
})();
