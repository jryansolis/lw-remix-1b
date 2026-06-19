/* Livewire Remix — dark mode.
   Non-destructive: injects a [data-theme="dark"] override stylesheet that maps
   the warm-paper palette to a warm-charcoal one. It targets both the Tailwind
   `lw` utility classes AND the design's many inline-hex styles (via attribute
   selectors with !important, which beat non-important inline styles).
   Default theme follows the viewer's local clock (night → dark); a masthead
   toggle overrides it and persists to localStorage. Loaded in <head> so the
   theme is set before first paint (no flash). */
(function () {
  'use strict';
  var KEY = 'lw_theme';

  var DARK = [
    /* base */
    '[data-theme=dark] body{background:#14120E !important;color:#EDE7DB}',
    '[data-theme=dark] .bg-lw-paper{background:#14120E !important}',
    '[data-theme=dark] .bg-lw-card,[data-theme=dark] .bg-white{background:#1E1B15 !important}',
    '[data-theme=dark] .bg-lw-mist{background:#211E17 !important}',
    '[data-theme=dark] .bg-lw-ink{background:#0C0A07 !important}',           /* dark bars stay dark */
    /* text */
    '[data-theme=dark] .text-lw-ink{color:#EDE7DB !important}',
    '[data-theme=dark] .text-lw-sub{color:#C7BFB0 !important}',
    '[data-theme=dark] .text-lw-muted{color:#9A9080 !important}',
    '[data-theme=dark] .text-lw-gold{color:#D8A93A !important}',
    '[data-theme=dark] .text-lw-oxblood{color:#CC8077 !important}',
    /* borders */
    '[data-theme=dark] .border-lw-ink{border-color:#4A4338 !important}',
    '[data-theme=dark] .border-lw-line,[data-theme=dark] .rule{border-color:#322E26 !important}',
    /* shared component classes */
    '[data-theme=dark] .imgz{background:#26221A !important}',
    '[data-theme=dark] .ts{color:#9A9080 !important}',
    '[data-theme=dark] .byl{color:#D8CFC0 !important}',
    '[data-theme=dark] .cred{color:#8A8273 !important}',
    '[data-theme=dark] .prose-body p{color:#D6D0C4 !important}',
    '[data-theme=dark] .prose-body > p:first-child::first-letter{color:#EDE7DB !important}',
    '[data-theme=dark] .lw-popover{background:#1E1B15 !important;border-color:#322E26 !important}',
    '[data-theme=dark] .ad{background:#211E17 !important;border-color:#322E26 !important}',
    '[data-theme=dark] .report-card{background:#241A18 !important}',
    '[data-theme=dark] .feed-tab.is-active{color:#EDE7DB !important}',
    '[data-theme=dark] .follow-pill{border-color:#6B6358 !important;color:#EDE7DB !important}',
    '[data-theme=dark] .follow-pill:hover,[data-theme=dark] .follow-pill.is-following{background:#EDE7DB !important;color:#14120E !important}',
    '[data-theme=dark] .scan-chip{border-color:#4A4338 !important;color:#EDE7DB !important}',
    '[data-theme=dark] .scan-chip:hover,[data-theme=dark] .scan-chip.is-on{background:#EDE7DB !important;color:#14120E !important}',
    '[data-theme=dark] .scan-input{border-bottom-color:#4A4338 !important;color:#EDE7DB !important}',
    '[data-theme=dark] .story:hover .hl{color:#E7B96A !important}',
    '[data-theme=dark] .lwx-modal,[data-theme=dark] .lwx-search,[data-theme=dark] .lwx-row{background:#1E1B15 !important;color:#EDE7DB !important}',
    /* account dropdown + density segmented control */
    '[data-theme=dark] .lw-acct{background:#1E1B15 !important;border-color:#322E26 !important}',
    '[data-theme=dark] .lw-acct-hd,[data-theme=dark] .lw-acct-sec{border-color:#322E26 !important}',
    '[data-theme=dark] .lw-acct-name,[data-theme=dark] .lw-acct-item{color:#EDE7DB !important}',
    '[data-theme=dark] .lw-seg{border-color:#4A4338 !important}',
    '[data-theme=dark] .lw-seg-b+.lw-seg-b{border-left-color:#4A4338 !important}',
    '[data-theme=dark] .lw-seg-b{color:#EDE7DB !important}',
    '[data-theme=dark] .lw-seg-b.on{background:#EDE7DB !important;color:#14120E !important}',
    /* personalised home (assets/home-personal.js) */
    '[data-theme=dark] .pf-greet{border-color:#322E26 !important}',
    '[data-theme=dark] .pf-band{background:#1A1712 !important;border-color:#322E26 !important}',
    '[data-theme=dark] .pf-chip{border-color:#4A4338 !important;color:#EDE7DB !important}',
    '[data-theme=dark] .pf-chip:hover{background:#EDE7DB !important;color:#14120E !important}',
    '[data-theme=dark] .pf-tierlbl{color:#9A9080 !important}',
    /* inline-hex: flip dark text → light */
    '[data-theme=dark] [style*="color:#16130E"]{color:#EDE7DB !important}',
    '[data-theme=dark] [style*="color:#26211A"],[data-theme=dark] [style*="color:#231f18"]{color:#D6D0C4 !important}',
    '[data-theme=dark] [style*="color:#3A352C"]{color:#C7BFB0 !important}',
    '[data-theme=dark] [style*="color:#6B6358"],[data-theme=dark] [style*="color:#8C8474"],[data-theme=dark] [style*="color:#B0A794"],[data-theme=dark] [style*="color:#9A917F"]{color:#9A9080 !important}',
    '[data-theme=dark] [style*="color:#A89F8E"]{color:#8A8273 !important}',
    '[data-theme=dark] [style*="color:#7A2E2E"]{color:#CC8077 !important}',
    /* inline-hex: flip light surfaces → dark */
    '[data-theme=dark] [style*="background:#FBFAF6"]{background:#14120E !important}',
    '[data-theme=dark] [style*="background:#F2EEE5"]{background:#211E17 !important}',
    '[data-theme=dark] [style*="background:#F3EEE4"]{background:#1A1712 !important}',
    '[data-theme=dark] [style*="background:#E9E2D5"]{background:#26221A !important}',
    '[data-theme=dark] [style*="background:#EEE9DF"]{background:#26221A !important}',
    '[data-theme=dark] [style*="background:#E4DFD4"]{background:#322E26 !important}',
    /* inline-hex: borders */
    '[data-theme=dark] [style*="border:1px solid #E4DFD4"]{border-color:#322E26 !important}',
    '[data-theme=dark] [style*="border-bottom:1px solid #E4DFD4"]{border-color:#322E26 !important}',
    /* gate fade (signed-out paywall) — fade into the dark page, not cream */
    '[data-theme=dark] .gate-fade{background:linear-gradient(to bottom, rgba(20,18,14,0), #14120E 88%) !important}'
  ].join('\n');

  function inject() {
    if (document.getElementById('lw-dark-css')) return;
    var st = document.createElement('style');
    st.id = 'lw-dark-css';
    st.textContent = DARK;
    (document.head || document.documentElement).appendChild(st);
  }
  function preferred() {
    try { var s = localStorage.getItem(KEY); if (s === 'dark' || s === 'light') return s; } catch (e) {}
    var h = new Date().getHours();
    return (h < 7 || h >= 19) ? 'dark' : 'light';   // local clock: night → dark
  }
  function apply(t) { document.documentElement.setAttribute('data-theme', t); swapLogo(t); }
  // masthead logo is dark-on-transparent; use the white wordmark in dark mode
  function swapLogo(t) {
    document.querySelectorAll('header img[src*="wordmark"]').forEach(function (img) {
      if (img.hasAttribute('data-fixed-logo')) return; // dark utility bar — always the white wordmark
      img.src = img.src.replace(/wordmark(-neg)?\.svg/, t === 'dark' ? 'wordmark-neg.svg' : 'wordmark.svg');
    });
  }

  // run immediately (head context) to avoid a flash
  inject();
  apply(preferred());

  var SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4"/><path stroke-linecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>';
  function setIcon(btn) { btn.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? SUN : MOON; }

  function injectToggle() {
    if (document.querySelector('[data-theme-toggle]')) return;
    var hdr = document.querySelector('header'); if (!hdr) return;
    var bar = hdr.querySelector(':scope > div'); if (!bar) return;
    var btn = document.createElement('button');
    btn.setAttribute('data-theme-toggle', '');
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.className = 'hover:text-lw-gold';
    btn.style.cssText = 'display:inline-grid;place-items:center;width:34px;height:34px;flex-shrink:0;color:currentColor';
    setIcon(btn);
    var last = bar.lastElementChild;
    if (last && last.tagName === 'DIV') last.insertBefore(btn, last.firstChild); // right-hand cluster
    else if (last) bar.insertBefore(btn, last);                                  // before a lone CTA link
    else bar.appendChild(btn);
  }
  // app.js rebuilds the masthead cluster (auth UI) and can wipe the toggle —
  // re-inject after load and on every auth change. injectToggle is idempotent.
  function ensure() { injectToggle(); swapLogo(document.documentElement.getAttribute('data-theme') || 'light'); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme-toggle]'); if (!b) return;
    e.preventDefault();
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (er) {}
    document.querySelectorAll('[data-theme-toggle]').forEach(setIcon);
  });
  document.addEventListener('lw:auth', function () { setTimeout(ensure, 0); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensure);
  else ensure();
  window.addEventListener('load', ensure);
})();
