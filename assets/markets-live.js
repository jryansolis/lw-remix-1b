/* Livewire Remix 1b — Markets Live band (sister-site module).
   The date, entry timestamps and the outbound Market Index liveblog URL are
   all computed from the real clock so the module always reads as "today".
   Entry copy is demo content (Market Index is not scrapeable);
   data/live.json, if present, overrides the demo entries. */
(function () {
  'use strict';

  // roll weekends back to Friday (the liveblog is a trading-day artifact)
  function tradingDay() {
    var d = new Date();
    if (d.getDay() === 6) d.setDate(d.getDate() - 1);
    if (d.getDay() === 0) d.setDate(d.getDate() - 2);
    return d;
  }

  function ordinal(n) {
    if (n % 10 === 1 && n !== 11) return 'st';
    if (n % 10 === 2 && n !== 12) return 'nd';
    if (n % 10 === 3 && n !== 13) return 'rd';
    return 'th';
  }

  var DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  function liveUrl(d) {
    return 'https://www.marketindex.com.au/news/asx-200-live-today-' +
      DAYS[d.getDay()] + '-' + d.getDate() + ordinal(d.getDate()) + '-' + MONTHS[d.getMonth()];
  }

  function displayDate(d) {
    var up = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
    return up(DAYS[d.getDay()]) + ' ' + d.getDate() + ' ' + up(MONTHS[d.getMonth()]);
  }

  function fmtTime(d) {
    var h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? 'am' : 'pm');
  }

  // demo intraday entries; minsAgo keeps timestamps reading as "today, just now"
  var DEMO = [
    { minsAgo: 18,  text: 'Banks drag as CBA trades ex-dividend; financials -0.6%' },
    { minsAgo: 47,  text: 'Gold miners extend gains — NST, EVN at records as bullion holds $4,200' },
    { minsAgo: 86,  text: 'ASX 200 flat at lunch; energy bid, tech profit-taking continues' },
    { minsAgo: 132, text: 'Uranium names rally on Kazatomprom supply downgrade; PDN +4.1%' },
    { minsAgo: 178, text: 'RBA minutes flag "patience" — rate-cut odds for August trim to 64%' }
  ];

  function entriesFrom(list) {
    var now = Date.now();
    return list.slice(0, 5).map(function (e) {
      return { time: fmtTime(new Date(now - e.minsAgo * 60000)), text: e.text };
    });
  }

  function bandHtml(entries, d) {
    var url = liveUrl(d);
    var shown = entries.slice(0, 2);
    var rows = shown.map(function (e) {
      return '<div class="min-w-0"><span class="ff-m text-[10.5px] font-600" style="color:#C0392B">' + e.time + '</span>' +
        '<p class="ff-b text-[14.5px] leading-snug mt-0.5" style="color:#26211A">' + e.text + '</p></div>';
    }).join('');
    return '<div class="grid grid-cols-1 lg:grid-cols-[210px_1fr_1fr_210px] gap-5 lg:gap-8 py-4 items-center">' +
      '<div><div class="ff-m text-[11px] font-700 tracking-[.14em] uppercase flex items-center gap-2" style="color:#16130E">' +
        '<span class="w-2 h-2 rounded-full inline-block animate-pulse" style="background:#C0392B"></span>Markets Live</div>' +
        '<div class="ff-m text-[10.5px] mt-1" style="color:#6B6358">ASX 200 <span style="color:#2F7D52">8,912 ▲ 0.4%</span></div>' +
        '<div class="ff-m text-[10px] tracking-[.08em] uppercase mt-1" style="color:#A89F8E">' + displayDate(d) + ' · with <span style="border-bottom:1px solid #E4DFD4;color:#6B6358">Market Index</span></div></div>' +
      rows +
      '<div class="lg:text-right"><a href="' + url + '" target="_blank" rel="noopener" class="ff-m text-[10.5px] font-600 tracking-[.08em] uppercase inline-flex items-center gap-1.5 border border-lw-ink px-3.5 py-2.5 hover:bg-lw-ink transition-colors lwlive-out" style="color:#16130E">Open the live blog ↗</a></div>' +
      '</div>';
  }

  function compactHtml(entries, d) {
    var e = entries[0];
    return '<div class="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">' +
      '<span class="ff-m text-[10.5px] font-700 tracking-[.14em] uppercase flex items-center gap-2" style="color:#16130E">' +
      '<span class="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style="background:#C0392B"></span>Markets Live</span>' +
      '<span class="ff-m text-[10.5px]" style="color:#C0392B">' + e.time + '</span>' +
      '<span class="ff-b text-[14px] flex-1 min-w-[200px]" style="color:#26211A">' + e.text + '</span>' +
      '<a href="' + liveUrl(d) + '" target="_blank" rel="noopener" class="ff-m text-[10px] font-600 tracking-[.08em] uppercase hover:text-lw-oxblood" style="color:#6B6358">' + displayDate(d) + ' on Market Index ↗</a></div>';
  }

  function boot() {
    var band = document.querySelector('[data-markets-live]');
    var compact = document.querySelector('[data-markets-live-compact]');
    var d = tradingDay();
    document.querySelectorAll('[data-live-date]').forEach(function (el) { el.textContent = displayDate(d).toUpperCase(); });
    var render = function (list) {
      var entries = entriesFrom(list);
      if (!band && !compact) return;
      if (band) band.innerHTML = bandHtml(entries, d);
      if (compact) compact.innerHTML = compactHtml(entries, d);
      // hover affordance for the dark outlink
      document.querySelectorAll('.lwlive-out').forEach(function (a) {
        a.addEventListener('mouseenter', function () { a.style.color = '#FBFAF6'; });
        a.addEventListener('mouseleave', function () { a.style.color = '#16130E'; });
      });
    };
    fetch('data/live.json').then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { render(j && j.entries && j.entries.length ? j.entries : DEMO); })
      .catch(function () { render(DEMO); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
