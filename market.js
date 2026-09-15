(() => {
  "use strict";
  const { $, escapeHtml, formatGenerated, impactClass, signalTone, MARKET_URL } = window.HanDash;
  function fmtNum(n, digits = 2) {
    if (n === null || n === undefined || n === "") return "-";
    if (typeof n === "number") {
      return n.toLocaleString("en-US", {
        minimumFractionDigits: Number.isInteger(n) ? 0 : digits,
        maximumFractionDigits: digits,
      });
    }
    return escapeHtml(n);
  }
  function storyStatus(s) {
    return s.status || s.summary || "";
  }
  function scenarioProb(sc) {
    if (!sc) return "-";
    const p = sc.probability_pct ?? sc.probability;
    return p === null || p === undefined || p === "" ? "-" : String(p);
  }
  function scenarioText(sc, kind) {
    if (!sc) return "";
    if (sc.summary) return sc.summary;
    if (kind === "base") return [sc.expected, sc.range].filter(Boolean).join(" | ");
    if (kind === "bull") return [sc.conditions, sc.spy_level, sc.qqq_level].filter(Boolean).join(" | ");
    if (kind === "bear") return [sc.conditions, sc.breakdown].filter(Boolean).join(" | ");
    return sc.conditions || "";
  }
  function catalystStrip(market) {
    const c = market.catalysts || {};
    const s = market.summary || {};
    const extreme = c.next_extreme_event || {};
    const extremeText = [extreme.when, extreme.what].filter(Boolean).join(" - ");
    return [
      ["Catalyst", c.top_bullish || s.top_bullish_catalyst],
      ["Risk", c.top_bearish || s.top_bearish_risk],
      ["Today", c.most_important_today || s.most_important_event],
      ["Levels", (market.levels && market.levels.note) || s.important_levels],
      ["Next extreme", extremeText || s.what_turns_bearish],
    ].filter(([, v]) => v);
  }
  function renderMarketPulse(market) {
    const root = $("#market-pulse");
    if (!market) {
      root.innerHTML = '<div class="market-notice"><strong>Market pulse unavailable.</strong> Could not load <code>data/market.json</code>. Han View data below is unaffected.</div>';
      root.hidden = false;
      return;
    }
    const outlook = market.outlook || {};
    const stories = Array.isArray(market.top_stories) ? market.top_stories : [];
    const scenarios = market.scenarios || {};
    const fed = market.fed || null;
    const snapshot = market.snapshot || null;
    const levels = market.levels || null;
    const regime = market.market_regime || market.regime || "-";
    const score = Number(market.signal_score);
    const scoreText = Number.isFinite(score) ? (score > 0 ? "+" + score : String(score)) : escapeHtml(market.signal_score);
    const tone = signalTone(market.signal_label);
    const outlookItems = [
      ["SPY", outlook.spy],
      ["QQQ", outlook.qqq],
      ["Small caps", outlook.small_caps],
      ["Semis", outlook.semiconductors],
      ["Vol risk", outlook.volatility_risk],
    ];
    const storyHtml = stories.length
      ? '<ul class="story-list">' + stories.map((s) => {
          const affected = Array.isArray(s.affected) ? s.affected.map((a) => escapeHtml(a)).join(", ") : "";
          const detail = storyStatus(s);
          return '<li class="story-item"><div class="story-head">' +
            '<span class="story-headline">' + escapeHtml(s.headline) + '</span>' +
            '<span class="impact-badge ' + impactClass(s.impact) + '">' + escapeHtml(s.impact) + '</span>' +
            '<span class="meta-chip story-strength">Str ' + escapeHtml(s.strength) + '</span></div>' +
            (affected ? '<div class="story-affected">' + affected + '</div>' : '') +
            (detail ? '<p class="story-summary">' + escapeHtml(detail) + '</p>' : '') +
            '</li>';
        }).join('') + '</ul>'
      : '<p class="section-sub">No top stories.</p>';
    const strip = catalystStrip(market);
    const stripHtml = strip.length
      ? '<div class="summary-strip" role="list">' + strip.map(([label, value]) =>
          '<div class="summary-item" role="listitem"><span class="label">' + escapeHtml(label) +
          '</span><span class="value">' + escapeHtml(value) + '</span></div>'
        ).join('') + '</div>'
      : '';
    const bull = scenarios.bull || {};
    const base = scenarios.base || {};
    const bear = scenarios.bear || {};
    const fedHtml = fed
      ? '<div class="fed-strip" role="list">' +
        '<div class="summary-item" role="listitem"><span class="label">Fed bias</span><span class="value">' + escapeHtml(fed.bias) + '</span></div>' +
        '<div class="summary-item" role="listitem"><span class="label">Target</span><span class="value">' + escapeHtml(fed.current_target) + '</span></div>' +
        '<div class="summary-item" role="listitem"><span class="label">Next decision</span><span class="value">' + escapeHtml(fed.next_decision) + '</span></div>' +
        '<div class="summary-item" role="listitem"><span class="label">Hike prob</span><span class="value">' + escapeHtml(fed.hike_probability_pct) + '%</span></div>' +
        '<div class="summary-item" role="listitem"><span class="label">Expected move</span><span class="value">' + escapeHtml(fed.expected_move_bp) + ' bp -> ' + escapeHtml(fed.expected_target) + '</span></div>' +
        '<div class="summary-item" role="listitem"><span class="label">Key event</span><span class="value">' + escapeHtml(fed.key_event) + '</span></div></div>'
      : '';
    const snapHtml = snapshot
      ? '<div class="snapshot-chips" role="list">' +
        '<div class="outlook-chip" role="listitem"><span class="outlook-label">10Y</span><span class="outlook-value">' + fmtNum(snapshot.ten_year_yield_pct) + '%</span></div>' +
        '<div class="outlook-chip" role="listitem"><span class="outlook-label">VIX</span><span class="outlook-value">' + fmtNum(snapshot.vix) + ' / ' + escapeHtml(snapshot.vix_class) + '</span></div>' +
        '<div class="outlook-chip" role="listitem"><span class="outlook-label">WTI</span><span class="outlook-value">$' + fmtNum(snapshot.wti_usd) + '</span></div>' +
        '<div class="outlook-chip" role="listitem"><span class="outlook-label">Brent</span><span class="outlook-value">$' + fmtNum(snapshot.brent_usd) + '</span></div>' +
        '<div class="outlook-chip" role="listitem"><span class="outlook-label">DXY</span><span class="outlook-value">' + fmtNum(snapshot.dxy) + '</span></div>' +
        '<div class="outlook-chip ' + impactClass(snapshot.geo_risk) + '" role="listitem"><span class="outlook-label">Geo risk</span><span class="outlook-value">' + escapeHtml(snapshot.geo_risk) + '</span></div></div>'
      : '';
    const levelsHtml = levels
      ? '<div class="levels-row">' +
        '<div class="summary-item"><span class="label">SPY support</span><span class="value mono">' + ((levels.spy_support || []).map((n) => fmtNum(n)).join(' / ') || '-') + '</span></div>' +
        '<div class="summary-item"><span class="label">SPY resistance</span><span class="value mono">' + ((levels.spy_resistance || []).map((n) => fmtNum(n)).join(' / ') || '-') + '</span></div>' +
        (levels.note ? '<div class="summary-item levels-note"><span class="label">Note</span><span class="value">' + escapeHtml(levels.note) + '</span></div>' : '') +
        '</div>'
      : '';
    const disclaimer = market.disclaimer
      ? '<p class="market-disclaimer">' + escapeHtml(market.disclaimer) + '</p>'
      : '';
    const schemaNote = market.schema_version != null ? (' / schema v' + escapeHtml(market.schema_version)) : '';
    root.innerHTML =
      '<div class="market-top"><div class="market-identity">' +
      '<p class="hero-label">Market pulse</p>' +
      '<h2 id="market-title" class="market-regime">' + escapeHtml(regime) + '</h2>' +
      '<p class="market-source">' + escapeHtml(market.source || 'Cary market intelligence') + schemaNote + '</p></div>' +
      '<div class="signal-block ' + tone + '"><span class="signal-score">' + scoreText + '</span>' +
      '<span class="signal-label-badge ' + tone + '">' + escapeHtml(market.signal_label || '-') + '</span></div></div>' +
      '<div class="outlook-chips" role="list">' +
      outlookItems.map(([label, value]) =>
        '<div class="outlook-chip ' + impactClass(value) + '" role="listitem">' +
        '<span class="outlook-label">' + escapeHtml(label) + '</span>' +
        '<span class="outlook-value">' + escapeHtml(value || '-') + '</span></div>'
      ).join('') + '</div>' +
      snapHtml + fedHtml +
      '<div class="market-stories"><h3 class="market-subhead">Top stories</h3>' + storyHtml + '</div>' +
      stripHtml + levelsHtml +
      '<div class="scenario-row" role="list">' +
      '<div class="scenario-card scenario-bull" role="listitem"><span class="scenario-name">Bull ' + escapeHtml(scenarioProb(bull)) + '%</span><span class="scenario-detail">' + escapeHtml(scenarioText(bull, 'bull')) + '</span></div>' +
      '<div class="scenario-card scenario-base" role="listitem"><span class="scenario-name">Base ' + escapeHtml(scenarioProb(base)) + '%</span><span class="scenario-detail">' + escapeHtml(scenarioText(base, 'base')) + '</span></div>' +
      '<div class="scenario-card scenario-bear" role="listitem"><span class="scenario-name">Bear ' + escapeHtml(scenarioProb(bear)) + '%</span><span class="scenario-detail">' + escapeHtml(scenarioText(bear, 'bear')) + '</span></div>' +
      '</div>' + disclaimer;
    root.hidden = false;
  }
  window.HanDashMarket = { renderMarketPulse, MARKET_URL };
})();
