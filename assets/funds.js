/* Livewire Remix 1b — Funds, woven through the content ("content → capital").
   Renders: the funds.html directory + filters; a "Fund in focus" module on the
   article reader (when the wire's author manages a fund); the home "Funds in
   Focus" block; and a "Funds behind these ideas" rail on topics. All guarded —
   each renderer is a no-op if its mount is absent. */
(function () {
  'use strict';
  var FUNDS = window.LW_FUNDS || [];
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function byManager(name) { name = (name || '').toLowerCase().trim(); return FUNDS.filter(function (f) { return f.manager.toLowerCase() === name; })[0]; }

  function typeColor(t) { return t === 'ETF' ? '#185FA5' : (t === 'LIT' || t === 'LIC') ? '#7A2E2E' : t === 'Annuity' ? '#0F6E56' : '#B88E1E'; }

  // full directory card
  function fundCard(f) {
    var tick = f.ticker ? '<span class="ff-m text-[10px] ml-2" style="color:#6B6358">' + esc(f.ticker) + '</span>' : '';
    return '<a href="funds.html#' + f.slug + '" id="' + f.slug + '" class="story group block bg-lw-card border border-lw-line p-5 hover:border-lw-ink transition-colors" data-fund-type="' + esc(f.type) + '" data-fund-class="' + esc(f.assetClass) + '">' +
      '<div class="flex items-center justify-between mb-3"><span class="ff-m text-[10px] font-700 tracking-[.12em] uppercase px-2 py-1" style="color:#fff;background:' + typeColor(f.type) + '">' + esc(f.type) + '</span><span class="ts">' + esc(f.assetClass) + '</span></div>' +
      '<h3 class="ff-d text-xl leading-[1.15] hl">' + esc(f.name) + tick + '</h3>' +
      '<p class="ff-b text-[15px] text-lw-sub leading-snug mt-2">' + esc(f.strategy) + '</p>' +
      '<div class="flex items-center gap-2.5 mt-4 pt-3 border-t rule">' + avatarFor(f.manager, 30) +
        '<div class="min-w-0"><div class="byl">' + esc(f.manager) + '</div><div class="ts" style="text-transform:none;letter-spacing:0;color:#8C8474">' + esc(f.firm) + '</div></div>' +
        '<span class="flex-1"></span><div class="text-right"><div class="ff-m text-[10px]" style="color:#8C8474">MER ' + esc(f.mer) + '</div><div class="ff-m text-[10px]" style="color:#8C8474">' + esc(f.aum) + ' AUM</div></div></div>' +
      '<div class="mt-3 ts" style="color:#B88E1E">▦ Featured in Livewire wires →</div></a>';
  }
  function avatarFor(name, px) {
    if (window.lwAvatar) return window.lwAvatar(name, px);
    var s = String(name || '').toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
    return '<img src="assets/img/contributors/' + s + '.jpg" alt="' + esc(name) + '" class="avatar rounded-full flex-shrink-0" style="width:' + px + 'px;height:' + px + 'px;object-fit:cover" onerror="this.style.visibility=\'hidden\'">';
  }

  // funds.html: directory grid + filter chips
  function renderDirectory() {
    var grid = document.querySelector('[data-funds-grid]');
    if (!grid) return;
    grid.innerHTML = FUNDS.map(fundCard).join('');
    var filt = document.querySelector('[data-funds-filters]');
    if (filt) {
      var types = ['All'].concat(FUNDS.map(function (f) { return f.type; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
      filt.innerHTML = types.map(function (t, i) {
        return '<button class="scan-chip' + (i === 0 ? ' is-on' : '') + '" data-filter="' + esc(t) + '">' + esc(t) + '</button>';
      }).join('');
      filt.addEventListener('click', function (e) {
        var b = e.target.closest('[data-filter]'); if (!b) return;
        var t = b.getAttribute('data-filter');
        filt.querySelectorAll('[data-filter]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        grid.querySelectorAll('[data-fund-type]').forEach(function (c) { c.style.display = (t === 'All' || c.getAttribute('data-fund-type') === t) ? '' : 'none'; });
      });
    }
    // deep-link highlight
    if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) { el.scrollIntoView({ block: 'center' }); el.style.outline = '2px solid #B88E1E'; } }
  }

  // article reader: "Fund in focus" when the author manages a fund
  function fundInFocus(author) {
    var f = byManager(author); if (!f) return;
    var anchor = document.querySelector('[data-art-authorcards]'); if (!anchor) return;
    if (document.getElementById('lw-fund-focus')) return;
    var box = document.createElement('div');
    box.id = 'lw-fund-focus';
    box.className = 'mt-6 border border-lw-ink';
    box.innerHTML = '<div class="px-5 pt-4 pb-1 flex items-center gap-2"><span class="ff-m text-[10px] font-700 tracking-[.14em] uppercase" style="color:#B88E1E">▦ Fund in focus</span></div>' +
      '<a href="funds.html#' + f.slug + '" class="story group block px-5 pb-5">' +
      '<div class="flex items-center justify-between mb-1"><span class="ff-m text-[10px] font-700 tracking-[.12em] uppercase px-2 py-1" style="color:#fff;background:' + typeColor(f.type) + '">' + esc(f.type) + '</span><span class="ts">' + esc(f.assetClass) + '</span></div>' +
      '<h3 class="ff-d text-xl leading-[1.15] hl mt-2">' + esc(f.name) + '</h3>' +
      '<p class="ff-b text-[15px] text-lw-sub leading-snug mt-1.5">' + esc(f.strategy) + '</p>' +
      '<div class="ts mt-3" style="color:#B88E1E">Managed by ' + esc(f.manager) + ' · ' + esc(f.firm) + ' · View fund →</div></a>';
    anchor.insertAdjacentElement('afterend', box);
  }

  // home: "Funds in Focus" — 3 real fund cards
  function renderHomeFunds() {
    var mount = document.querySelector('[data-home-funds]'); if (!mount) return;
    mount.innerHTML = FUNDS.slice(0, 3).map(function (f) {
      return '<a href="funds.html#' + f.slug + '" class="story group flex gap-3 py-3.5 items-start">' + avatarFor(f.manager, 40) +
        '<div class="min-w-0"><div class="ff-m text-[9.5px] font-600 tracking-[.1em] uppercase" style="color:' + typeColor(f.type) + '">' + esc(f.type) + ' · ' + esc(f.assetClass) + '</div>' +
        '<h3 class="hl ff-d text-[15.5px] leading-[1.18] mt-0.5">' + esc(f.name) + '</h3>' +
        '<div class="ts mt-1" style="text-transform:none;letter-spacing:0">' + esc(f.manager) + '</div></div></a>';
    }).join('');
  }

  // topics: "Funds behind these ideas" strip
  function renderTopicsFunds() {
    var mount = document.querySelector('[data-funds-strip]'); if (!mount) return;
    mount.innerHTML = FUNDS.slice(0, 6).map(function (f) {
      return '<a href="funds.html#' + f.slug + '" class="scan-chip" style="text-transform:none;letter-spacing:.02em">▦ ' + esc(f.name) + '</a>';
    }).join('');
  }

  window.lwFundInFocus = fundInFocus;

  function boot() {
    renderDirectory();
    renderHomeFunds();
    renderTopicsFunds();
    // the reader dispatches lw:article after it renders a wire/demo article
    document.addEventListener('lw:article', function (e) { if (e.detail && e.detail.author) fundInFocus(e.detail.author); });
    var rn = document.querySelector('[data-art-rail-name]'); if (rn && rn.textContent) fundInFocus(rn.textContent);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
