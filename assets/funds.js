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
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function aumNum(s) { s = String(s || '').toLowerCase(); var n = parseFloat(s.replace(/[^0-9.]/g, '')) || 0; if (s.indexOf('b') !== -1) n *= 1000; return n; } // in $m
  function merNum(s) { return parseFloat(String(s || '').replace(/[^0-9.]/g, '')) || 0; }
  function firmToken(firm) { var w = String(firm || '').split(/\s+/)[0]; return w.length >= 4 ? w : firm; }

  // full directory card
  function fundCard(f, i) {
    var tick = f.ticker ? '<span class="ff-m text-[10px] ml-2" style="color:#6B6358">' + esc(f.ticker) + '</span>' : '';
    return '<a href="funds.html#' + f.slug + '" id="' + f.slug + '" class="story group block bg-lw-card border border-lw-line p-5 hover:border-lw-ink transition-colors" data-fund-type="' + esc(f.type) + '" data-fund-class="' + esc(f.assetClass) + '" data-idx="' + (i || 0) + '" data-fund-name="' + esc(f.name) + '" data-fund-manager="' + esc(f.manager) + '" data-fund-firm="' + esc(f.firm) + '" data-fund-aum="' + aumNum(f.aum) + '" data-fund-mer="' + merNum(f.mer) + '">' +
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
    grid.innerHTML = FUNDS.map(function (f, i) { return fundCard(f, i); }).join('');
    var state = { type: 'All', q: '', sort: 'featured' };

    function apply() {
      var cards = [].slice.call(grid.children).filter(function (c) { return c.hasAttribute('data-fund-type'); });
      cards.forEach(function (c) {
        var okType = state.type === 'All' || c.getAttribute('data-fund-type') === state.type;
        var hay = (c.getAttribute('data-fund-name') + ' ' + c.getAttribute('data-fund-manager') + ' ' + c.getAttribute('data-fund-firm')).toLowerCase();
        var okQ = !state.q || hay.indexOf(state.q) !== -1;
        c.style.display = (okType && okQ) ? '' : 'none';
      });
      var ordered = cards.slice().sort(function (a, b) {
        if (state.sort === 'name') return a.getAttribute('data-fund-name').localeCompare(b.getAttribute('data-fund-name'));
        if (state.sort === 'aum') return (+b.getAttribute('data-fund-aum')) - (+a.getAttribute('data-fund-aum'));
        if (state.sort === 'mer') return (+a.getAttribute('data-fund-mer')) - (+b.getAttribute('data-fund-mer'));
        return (+a.getAttribute('data-idx')) - (+b.getAttribute('data-idx'));
      });
      ordered.forEach(function (c) { grid.appendChild(c); });
      var anyVisible = cards.some(function (c) { return c.style.display !== 'none'; });
      var empty = grid.querySelector('[data-funds-empty]');
      if (!anyVisible) {
        if (!empty) { empty = document.createElement('p'); empty.setAttribute('data-funds-empty', ''); empty.className = 'ff-b italic text-lw-muted py-8'; empty.style.gridColumn = '1 / -1'; empty.textContent = 'No funds match — try a different search or filter.'; grid.appendChild(empty); }
      } else if (empty) { empty.remove(); }
    }

    var filt = document.querySelector('[data-funds-filters]');
    if (filt) {
      var types = ['All'].concat(FUNDS.map(function (f) { return f.type; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
      filt.innerHTML = types.map(function (t, i) {
        return '<button class="scan-chip' + (i === 0 ? ' is-on' : '') + '" data-filter="' + esc(t) + '">' + esc(t) + '</button>';
      }).join('');
      filt.addEventListener('click', function (e) {
        var b = e.target.closest('[data-filter]'); if (!b) return;
        state.type = b.getAttribute('data-filter');
        filt.querySelectorAll('[data-filter]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        apply();
      });
    }
    var search = document.querySelector('[data-funds-search]');
    if (search) search.addEventListener('input', function () { state.q = search.value.trim().toLowerCase(); apply(); });
    var sortSel = document.querySelector('[data-funds-sort]');
    if (sortSel) sortSel.addEventListener('change', function () { state.sort = sortSel.value; apply(); });

    apply();
    // deep-link highlight
    if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) { el.scrollIntoView({ block: 'center' }); el.style.outline = '2px solid #B88E1E'; } }
  }

  // article reader: a de-emphasized "Fund in focus" side widget in the right
  // read-rail, shown when the wire's author manages a fund. Falls back to a
  // block after the author cards if the page has no rail mount.
  function fundInFocus(author) {
    var f = byManager(author); if (!f) return;
    if (document.getElementById('lw-fund-focus')) return;
    var rail = document.querySelector('[data-fund-rail]');
    var box = document.createElement('div');
    box.id = 'lw-fund-focus';
    if (rail) {
      // compact rail widget — quiet, not a full-width module
      box.className = 'mt-9';
      box.innerHTML = '<div class="border-t-2 border-lw-ink pt-3 mb-3 flex items-center gap-2"><span class="w-2 h-2" style="background:#B88E1E"></span><h4 class="ff-d font-600 uppercase tracking-wide text-sm" style="letter-spacing:.04em">Fund in focus</h4></div>' +
        '<a href="funds.html#' + f.slug + '" class="story group block border border-lw-line hover:border-lw-ink transition-colors p-4">' +
        '<div class="flex items-center justify-between mb-2"><span class="ff-m text-[9.5px] font-700 tracking-[.12em] uppercase px-2 py-0.5" style="color:#fff;background:' + typeColor(f.type) + '">' + esc(f.type) + '</span><span class="ts" style="font-size:10px">' + esc(f.assetClass) + '</span></div>' +
        '<h3 class="ff-d text-[17px] leading-[1.18] hl">' + esc(f.name) + '</h3>' +
        '<p class="ff-b text-[13.5px] text-lw-sub leading-snug mt-1.5">' + esc(f.strategy) + '</p>' +
        '<div class="ts mt-3" style="color:#B88E1E;font-size:10px">By ' + esc(f.manager) + ' · View fund →</div></a>' +
        '<p class="ts mt-2" style="font-size:9.5px;color:#9C9484">Concept · indicative</p>';
      rail.appendChild(box);
    } else {
      var anchor = document.querySelector('[data-art-authorcards]'); if (!anchor) return;
      box.className = 'mt-6 border border-lw-ink';
      box.innerHTML = '<div class="px-5 pt-4 pb-1 flex items-center gap-2"><span class="ff-m text-[10px] font-700 tracking-[.14em] uppercase" style="color:#B88E1E">▦ Fund in focus</span></div>' +
        '<a href="funds.html#' + f.slug + '" class="story group block px-5 pb-5">' +
        '<div class="flex items-center justify-between mb-1"><span class="ff-m text-[10px] font-700 tracking-[.12em] uppercase px-2 py-1" style="color:#fff;background:' + typeColor(f.type) + '">' + esc(f.type) + '</span><span class="ts">' + esc(f.assetClass) + '</span></div>' +
        '<h3 class="ff-d text-xl leading-[1.15] hl mt-2">' + esc(f.name) + '</h3>' +
        '<p class="ff-b text-[15px] text-lw-sub leading-snug mt-1.5">' + esc(f.strategy) + '</p>' +
        '<div class="ts mt-3" style="color:#B88E1E">Managed by ' + esc(f.manager) + ' · ' + esc(f.firm) + ' · View fund →</div></a>';
      anchor.insertAdjacentElement('afterend', box);
    }
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

  // article reader: "Funds mentioned" — any Find Funds fund referenced in the
  // wire (by name, firm, manager or ticker) gets surfaced as a module after the
  // body, linking through to the directory.
  function fundMiniRow(f) {
    var label = f.type === 'Managed Fund' ? 'Fund' : f.type;
    return '<a href="funds.html#' + f.slug + '" class="story group flex items-center gap-3 border border-lw-line hover:border-lw-ink transition-colors p-3.5">' +
      '<span class="ff-m text-[9px] font-700 tracking-[.1em] uppercase px-1.5 py-1 flex-shrink-0" style="color:#fff;background:' + typeColor(f.type) + '">' + esc(label) + '</span>' +
      '<div class="min-w-0"><div class="ff-d font-600 text-[14.5px] leading-tight hl truncate">' + esc(f.name) + '</div>' +
      '<div class="ts truncate" style="text-transform:none;letter-spacing:0;color:#8C8474">' + esc(f.manager) + ' · ' + esc(f.firm) + '</div></div>' +
      '<span class="flex-1"></span><span class="ff-m text-[12px] flex-shrink-0" style="color:#B88E1E">→</span></a>';
  }
  function fundsMentioned() {
    var body = document.querySelector('[data-art-body]'); if (!body) return;
    if (document.getElementById('lw-funds-mentioned')) return;
    var grab = function (s) { var e = document.querySelector(s); return e ? e.textContent : ''; };
    var hay = (grab('[data-art-title]') + ' ' + grab('[data-art-standfirst]') + ' ' + body.textContent).toLowerCase();
    if (!hay.trim()) return;
    var hits = FUNDS.filter(function (f) {
      if (f.name && hay.indexOf(f.name.toLowerCase()) !== -1) return true;
      if (f.manager && hay.indexOf(f.manager.toLowerCase()) !== -1) return true;
      var ft = firmToken(f.firm).toLowerCase();
      if (ft && new RegExp('\\b' + escRe(ft) + '\\b').test(hay)) return true;
      var tk = (f.ticker || '').split(':').pop().toLowerCase();
      if (tk && tk.length >= 3 && new RegExp('\\b' + escRe(tk) + '\\b').test(hay)) return true;
      return false;
    }).slice(0, 4);
    if (!hits.length) return;
    var box = document.createElement('div');
    box.id = 'lw-funds-mentioned';
    box.className = 'mt-10 pt-6 border-t-2 border-lw-ink';
    box.innerHTML = '<div class="flex items-center gap-2 mb-4"><span class="w-2 h-2" style="background:#B88E1E"></span><h4 class="ff-d font-600 uppercase tracking-wide text-sm" style="letter-spacing:.04em">Funds mentioned</h4></div>' +
      '<div class="grid sm:grid-cols-2 gap-3">' + hits.map(fundMiniRow).join('') + '</div>' +
      '<p class="ts mt-3" style="text-transform:none;letter-spacing:0;color:#9C9484">Funds referenced in this wire · concept · indicative</p>';
    body.insertAdjacentElement('afterend', box);
    if (window.lwRewire) window.lwRewire();
  }

  window.lwFundInFocus = fundInFocus;
  window.lwFundsMentioned = fundsMentioned;

  function boot() {
    renderDirectory();
    renderHomeFunds();
    renderTopicsFunds();
    // the reader dispatches lw:article after it renders a wire/demo article
    document.addEventListener('lw:article', function (e) { if (e.detail && e.detail.author) fundInFocus(e.detail.author); fundsMentioned(); });
    var rn = document.querySelector('[data-art-rail-name]'); if (rn && rn.textContent) fundInFocus(rn.textContent);
    if (document.querySelector('[data-art-body]')) fundsMentioned(); // default (no-id) article body is already in the DOM
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
