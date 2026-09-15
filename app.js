import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const { $, escapeHtml, formatGenerated } = window.HanDash;
const { renderMarketTab } = window.HanDashMarket;
const { renderStocksTab } = window.HanDashStocks;

const TAB_KEY = "han-dash-tab";
const cfg = window.HAN_SUPABASE || {};

if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
  $("#loading").hidden = true;
  $("#error").hidden = false;
  $("#error-message").textContent = "Missing Supabase config (config.js).";
} else {
  const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      flowType: "pkce",
    },
  });

  let dashboardLoadedForUser = null;

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
    const badge = $("#generated-badge");
    if (badge) {
      badge.textContent = badgeTimes[0] || "-";
      badge.hidden = false;
    }

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

  function showLoginOnly() {
    dashboardLoadedForUser = null;
    $("#loading").hidden = true;
    $("#login").hidden = false;
    $("#app").hidden = true;
    $("#error").hidden = true;
    $("#auth-user").hidden = true;
    const badge = $("#generated-badge");
    if (badge) badge.hidden = true;
    const feedBadge = $("#feed-badge");
    if (feedBadge) feedBadge.hidden = true;
    $("#footer-meta").innerHTML = "<div>Sign in to load protected feeds.</div>";
  }

  function showAuthedChrome(email) {
    $("#login").hidden = true;
    $("#auth-user").hidden = false;
    $("#user-email").textContent = email || "Signed in";
  }

  async function fetchFeeds() {
    const { data, error } = await supabase
      .from("dashboard_feeds")
      .select("id,payload,updated_at");
    if (error) throw error;
    let hanData = null;
    let marketData = null;
    (data || []).forEach((row) => {
      if (row.id === "han_view") hanData = row.payload;
      if (row.id === "cary_market") marketData = row.payload;
    });
    return { hanData, marketData };
  }

  async function loadDashboard() {
    $("#loading").hidden = false;
    $("#loading").querySelector("p").textContent = "Loading protected feeds...";
    $("#error").hidden = true;

    try {
      const { hanData, marketData } = await fetchFeeds();
      $("#loading").hidden = true;

      if (!marketData && !hanData) {
        $("#error").hidden = false;
        $("#error-message").textContent =
          "No feed rows returned. Check RLS and that you are signed in.";
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
    } catch (err) {
      console.error(err);
      $("#loading").hidden = true;
      $("#app").hidden = true;
      $("#error").hidden = false;
      $("#error-message").textContent =
        (err && (err.message || String(err))) || "Failed to load feeds from Supabase.";
      renderFooter(null, null);
    }
  }

  async function onSignedIn(session) {
    const uid = session.user && session.user.id;
    showAuthedChrome(session.user && session.user.email);
    if (uid && dashboardLoadedForUser === uid) return;
    dashboardLoadedForUser = uid || "session";
    await loadDashboard();
  }

  function bindAuthUi() {
    const form = $("#login-form");
    const status = $("#login-status");
    const submit = $("#login-submit");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = ($("#login-email").value || "").trim();
      if (!email) return;
      status.textContent = "Sending magic link...";
      submit.disabled = true;
      try {
        const redirectTo = window.location.origin + window.location.pathname;
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        status.textContent =
          "Check your email for the magic link. After you click it, you will return here signed in.";
      } catch (err) {
        console.error(err);
        status.textContent =
          (err && err.message) || "Could not send magic link. Check Auth redirect URLs.";
      } finally {
        submit.disabled = false;
      }
    });

    $("#sign-out-btn").addEventListener("click", async () => {
      await supabase.auth.signOut();
      $("#app").hidden = true;
      showLoginOnly();
      status.textContent = "Signed out.";
    });
  }

  async function boot() {
    bindTabs();
    bindAuthUi();

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        showLoginOnly();
        return;
      }
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        await onSignedIn(session);
      }
    });

    const { data, error } = await supabase.auth.getSession();
    if (error) console.error(error);

    const session = data && data.session;
    if (!session) {
      showLoginOnly();
      return;
    }
    await onSignedIn(session);
  }

  boot();
}
