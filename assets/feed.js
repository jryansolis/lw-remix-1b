/* Livewire Remix 1b — live RSS layer.
   Loads data/feed.json (refreshed daily by .github/workflows/refresh-feed.yml),
   folds items into window.LW_DATA so scans/search see them, and renders:
   - the home "Latest" bottom list  [data-latest-list]
   - fresh rows in the Latest tab    [data-feed-panel="latest"]
   - per-topic fresh rows on topics  [data-topic-fresh="<Topic>"]
   Fails silent (file:// or 404) — the curated demo content is the fallback. */
(function () {
  'use strict';

  var TOPIC_MAP = {
    'Equities': 'Shares', 'Shares': 'Shares', 'Buy Hold Sell': 'Shares',
    'Macro': 'Markets', 'Investment Theme': 'Growth', 'Markets': 'Markets',
    'Income Series': 'Income', 'Fixed Income': 'Income', 'Income': 'Income',
    'Exchange Traded Funds': 'ETFs', 'ETFs': 'ETFs',
    'Superannuation': 'Retirement', 'Retirement': 'Retirement',
    'Education': 'Wealth', 'Wealth': 'Wealth',
    'Property': 'Property', 'Small Caps': 'Small Caps', 'Growth': 'Growth'
  };

  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function reader(i) { return 'article.html?id=wire-' + i; }

  // Today curated slots — keep the layout, swap in real wires (open the reader)
  function fillWires(items) {
    document.querySelectorAll('[data-wire]').forEach(function (slot) {
      var n = parseInt(slot.getAttribute('data-wire'), 10);
      var it = items[n]; if (!it) return;
      slot.querySelectorAll('a').forEach(function (a) {
        var h = a.getAttribute('href');
        if (h === 'article.html' || (h && h.indexOf('article') === 0)) a.setAttribute('href', reader(n));
      });
      var head = slot.querySelector('h1, h3'); if (head) head.textContent = it.title;
      var k = slot.querySelector('.kicker'); if (k) k.textContent = it.topics[0] || 'Markets';
      var dek = slot.querySelector('[data-wire-dek]'); if (dek) dek.textContent = it.dek || '';
      var byl = slot.querySelector('.byl'); if (byl) byl.textContent = it.author || 'Livewire';
      var cred = slot.querySelector('.cred'); if (cred) cred.textContent = 'Livewire' + (it.topics[0] ? ' · ' + it.topics[0] : '');
      var face = slot.querySelector('img.avatar'); if (face) face.remove();
      var img = slot.querySelector('.imgz img');
      if (img) { if (it.image) { img.src = it.image; img.alt = it.title; img.setAttribute('loading', 'lazy'); } img.onerror = function () { var z = img.closest('.imgz'); if (z) z.style.background = '#EEE9DF'; img.remove(); }; }
    });
  }

  function relTime(iso) {
    var mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return mins + 'M AGO';
    var h = Math.round(mins / 60);
    if (h < 24) return h + 'H AGO';
    return Math.round(h / 24) + 'D AGO';
  }

  function normalize(raw) {
    return raw.map(function (it, i) {
      var topic = TOPIC_MAP[it.topic] || 'Shares';
      return {
        id: 'rss-' + i, title: it.title, dek: it.dek || '', url: it.url,
        type: it.topic === 'Buy Hold Sell' ? 'video' : 'article',
        source: 'livewire', live: true,
        author: it.author || 'Livewire', topics: [topic],
        themes: (it.categories || []).map(function (c) { return c.toLowerCase(); }),
        tickers: it.tickers || [], sectors: [],
        image: it.image || '', pubDate: it.pubDate, locked: false, pop: 60
      };
    });
  }

  // home bottom "Latest" list — top 7 by date, remote thumbs degrade to text rows
  function renderLatestList(items) {
    var mount = document.querySelector('[data-latest-list]');
    if (!mount) return;
    mount.innerHTML = items.slice(0, 7).map(function (it, i) {
      var thumb = (it.image && i < 3)
        ? '<a href="' + it.url + '" class="imgz w-20 h-16 flex-shrink-0"><img src="' + it.image + '" alt="" loading="lazy" onerror="this.closest(\'a\').remove()"></a>'
        : '';
      return '<article class="story group flex gap-4 py-4 items-start">' + thumb +
        '<div class="flex-1 min-w-0"><a href="' + it.url + '" class="block"><h3 class="hl ff-d text-[17px] leading-[1.18]">' + esc(it.title) + '</h3></a>' +
        '<div class="byl mt-1.5">' + esc(it.author) + ' <span class="text-lw-muted">· <span class="text-lw-gold">●</span> ' + relTime(it.pubDate) + '</span></div></div></article>';
    }).join('');
  }

  // Latest tab — prepend fresh rows above the curated demo rows
  function renderLatestTab(items) {
    var panel = document.querySelector('[data-feed-panel="latest"]');
    if (!panel) return;
    var list = panel.querySelector('.divide-y');
    if (!list) return;
    var html = items.slice(0, 8).map(function (it) {
      var thumb = it.image
        ? '<a href="' + it.url + '" class="imgz w-20 h-16 flex-shrink-0"><img src="' + it.image + '" alt="" loading="lazy" onerror="this.closest(\'a\').remove()"></a>'
        : '';
      return '<article class="story group grid grid-cols-[52px_1fr] sm:grid-cols-[64px_1fr] gap-4 py-4">' +
        '<div class="ts leading-tight pt-0.5" style="color:#B88E1E">● ' + relTime(it.pubDate).replace(' AGO', '<br>AGO') + '</div>' +
        '<div class="flex gap-4 items-start"><div class="flex-1 min-w-0">' +
        '<span class="kicker">' + esc(it.topics[0]) + '</span>' +
        '<a href="' + it.url + '" class="block"><h3 class="hl ff-d text-xl leading-[1.15]">' + esc(it.title) + '</h3></a>' +
        '<div class="byl mt-1.5">' + esc(it.author) + '</div></div>' + thumb + '</div></article>';
    }).join('');
    html += '<div class="flex items-center gap-3 py-3"><span class="ts" style="color:#A89F8E">EARLIER</span><span class="flex-1 border-t rule"></span></div>';
    list.insertAdjacentHTML('afterbegin', html);
  }

  // topics page — up to 3 fresh rows per topic section
  function renderTopicFresh(items) {
    var mounts = document.querySelectorAll('[data-topic-fresh]');
    if (!mounts.length) return;
    mounts.forEach(function (m) {
      var topic = m.getAttribute('data-topic-fresh');
      var rows = items.filter(function (it) { return it.topics[0] === topic; }).slice(0, 3);
      if (!rows.length) { m.remove(); return; }
      m.innerHTML = '<div class="flex items-center gap-2 pt-4 mt-2 border-t rule"><span class="w-1.5 h-1.5 rounded-full inline-block" style="background:#B88E1E"></span><span class="ff-m text-[10px] font-600 tracking-[.18em] uppercase" style="color:#8C8474">Latest wires</span></div>' +
        '<div class="divide-y rule">' + rows.map(function (it) {
          return '<div class="story group py-2.5 flex items-baseline gap-3"><span class="ts flex-shrink-0" style="color:#B88E1E">' + relTime(it.pubDate) + '</span>' +
            '<div class="min-w-0"><a href="' + it.url + '" class="block"><h3 class="hl ff-d text-[15px] leading-[1.22]">' + esc(it.title) + '</h3></a>' +
            '<span class="ts">' + esc(it.author) + '</span></div></div>';
        }).join('') + '</div>';
    });
  }

  function boot() {
    window.LW_FEED_READY = fetch('data/feed.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.items || !j.items.length) return [];
        var items = normalize(j.items).sort(function (a, b) { return new Date(b.pubDate) - new Date(a.pubDate); });
        // route every wire through the in-site reader (article.html?id=wire-N),
        // which serves the full article when signed in / a paywall when not
        items.forEach(function (it, i) { it.url = reader(i); });
        if (window.LW_DATA) Array.prototype.push.apply(window.LW_DATA, items);
        fillWires(items);
        renderLatestList(items);
        renderLatestTab(items);
        renderTopicFresh(items);
        document.dispatchEvent(new CustomEvent('lw:feed', { detail: items }));
        return items;
      })
      .catch(function () { return []; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
