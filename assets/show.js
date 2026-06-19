/* Livewire Remix 1b — reusable show-landing template.
   Renders show.html?show=<slug> entirely from window.LW_SHOWS (assets/data/shows.js),
   folding in live RSS episodes (assets/feed.js → window.LW_DATA, matched by `show`).

   Anatomy: masthead → format primer (collapsible, per-show seen) → episodes in the
   three-tier hierarchy (Latest = Lead, 1–2 = Featured, back catalogue = Standard,
   honouring the reader-density preference) → hosts → cross-links.

   A show is a first-class follow type: the masthead Follow button uses the shared
   data-follow model with a `show:<Name>` key, so following surfaces new episodes in
   the signed-in homepage feed. Subscribe links are external (podcast platforms). */
(function () {
  'use strict';

  var PRIMER_KEY = 'lw_primer_seen';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function topicSlug(n) { return String(n || '').toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''); }
  function tickerCode(t) { return String(t || '').replace(/^[A-Z]+:/, ''); }
  function density() { return (window.lwState && window.lwState.density && window.lwState.density()) || 'rich'; }
  function avatar(name, px) { return window.lwAvatar ? window.lwAvatar(name, px) : ''; }
  function fmtDate(iso) { var d = new Date(iso); if (isNaN(d.getTime())) return ''; return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function getSeen() { try { return JSON.parse(localStorage.getItem(PRIMER_KEY) || '{}'); } catch (e) { return {}; } }
  function setSeen(slug) { try { var s = getSeen(); s[slug] = true; localStorage.setItem(PRIMER_KEY, JSON.stringify(s)); } catch (e) {} }

  function getSlug() {
    var s = new URLSearchParams(location.search).get('show');
    return s || 'buy-hold-sell';
  }

  var PLAY_SVG = '<span class="play absolute inset-0 grid place-items-center"><span><svg class="w-5 h-5" fill="#fff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></span>';
  var PLAY_SVG_SM = '<span class="play absolute inset-0 grid place-items-center"><span style="width:34px;height:34px"><svg class="w-3.5 h-3.5" fill="#fff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></span>';

  // ---- episode model: data episodes + live RSS, newest first, tiered ----
  function guestsOf(ep) {
    if (ep.guests && ep.guests.length) return ep.guests.join(', ');
    if (ep.author) return ep.author;
    return '';
  }
  // drop a redundant leading show-name prefix from a wire title ("Buy Hold Sell: …")
  function stripShow(t) {
    return String(t || '').replace(/^\s*(the rules of investing|rules of investing|buy hold sell|expert insights|success (?:&|and) more interesting stuff)\s*[:\u2013\u2014-]\s*/i, '').trim();
  }
  function epKey(ep) { return stripShow(ep.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 44); }

  function buildEpisodes(show) {
    var eps = (show.episodes || []).map(function (e) { return e; });
    // fold in live RSS / curated wires tagged to this show
    var live = (window.LW_DATA || []).filter(function (it) { return it && it.show === show.name && it.url && it.url !== '#'; });
    var seen = {}; eps.forEach(function (e) { seen[epKey(e)] = 1; });
    live.forEach(function (it) {
      var k = epKey(it); if (seen[k]) return; seen[k] = 1;
      eps.push({
        title: stripShow(it.title), date: it.pubDate, guests: it.author ? [it.author] : [],
        thumb: it.image || '', duration: it.readMins ? (it.readMins + ' min') : '',
        tickers: it.tickers || [], topics: it.topics || [], url: it.url, live: true
      });
    });
    eps.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    var lead = eps[0] || null;
    var featured = eps.filter(function (e) { return e !== lead && e.tier === 'featured'; }).slice(0, 2);
    if (!featured.length) featured = eps.slice(1, 3);
    var used = {}; if (lead) used[epKey(lead)] = 1; featured.forEach(function (e) { used[epKey(e)] = 1; });
    var standard = eps.filter(function (e) { return !used[epKey(e)]; });
    return { lead: lead, featured: featured, standard: standard, count: eps.length };
  }

  // ---- masthead ----
  function hostHtml(h) {
    return '<a href="author.html" class="host-link group">' +
      avatar(h.name, 34) +
      '<span class="ff-d font-600 text-[15px] group-hover:text-lw-goldbright" style="color:#fff">' + esc(h.name) + '</span>' +
      (h.role ? '<span class="ts" style="color:rgba(251,250,246,.5)">· ' + esc(h.role) + '</span>' : '') +
      '</a>';
  }
  function subLinks(show) {
    var s = show.subscribeLinks || {}; var out = [];
    if (s.apple) out.push('<a class="sub-link" href="' + esc(s.apple) + '" target="_blank" rel="noopener">Apple Podcasts</a>');
    if (s.spotify) out.push('<a class="sub-link" href="' + esc(s.spotify) + '" target="_blank" rel="noopener">Spotify</a>');
    if (s.youtube) out.push('<a class="sub-link" href="' + esc(s.youtube) + '" target="_blank" rel="noopener">YouTube</a>');
    if (!out.length) return '';
    return '<div class="mt-6"><div class="ts mb-2" style="color:rgba(251,250,246,.45)">Subscribe</div>' +
      '<div class="flex flex-wrap gap-2.5">' + out.join('') + '</div></div>';
  }
  function mastheadHtml(show) {
    var kindLabel = show.kind === 'podcast' ? 'PODCAST' : 'VIDEO';
    var next = show.nextEpisode ? '<span class="mx-2" style="color:rgba(251,250,246,.3)">·</span>Next: <span style="color:#fff">' + esc(show.nextEpisode) + '</span>' : '';
    return '<section class="series-hero" style="--acc:' + esc(show.brand || '#E0A82E') + '">' +
      (show.coverArt ? '<img src="' + esc(show.coverArt) + '" alt="" class="bgimg" onerror="this.style.display=\'none\'">' : '') +
      '<div class="relative z-10 max-w-[1240px] mx-auto px-5 py-14 md:py-20">' +
        '<div class="ts mb-5" style="color:rgba(251,250,246,.5)"><a href="video.html" class="hover:text-white">' + kindLabel + '</a> <span class="mx-1">›</span> SHOW</div>' +
        '<div class="max-w-2xl">' +
          '<h1 class="leading-none mb-4"><span class="ff-d font-600" style="font-size:clamp(2.4rem,6vw,4rem); color:' + esc(show.brand || '#E0A82E') + '">' + esc(show.name) + '</span></h1>' +
          '<p class="ff-b leading-relaxed mb-6" style="font-size:clamp(1.05rem,1.6vw,1.3rem); color:rgba(251,250,246,.82)">' + esc(show.tagline) + '</p>' +
          '<div class="flex flex-wrap items-center gap-x-5 gap-y-3 mb-6">' +
            (show.hosts || []).map(hostHtml).join('') +
          '</div>' +
          '<div class="flex flex-wrap gap-3 items-center">' +
            '<button class="follow-btn navlink px-6 h-11 inline-flex items-center" style="background:' + esc(show.brand || '#E0A82E') + ';color:#16130E;font-weight:700" data-follow="show:' + esc(show.name) + '" data-compact><span data-follow-label>Follow</span></button>' +
            '<a href="#episodes" class="follow-btn follow-pill navlink px-6 h-11 inline-flex items-center" style="border-color:rgba(251,250,246,.4);color:#fff">Watch the latest →</a>' +
          '</div>' +
          '<div class="ts mt-5" style="color:rgba(251,250,246,.6)">▶ ' + esc(show.cadence || '') + next + '</div>' +
          subLinks(show) +
        '</div>' +
      '</div>' +
    '</section>';
  }

  // ---- format primer ----
  function primerHtml(show) {
    var p = show.formatPrimer || {}; var slug = show.slug;
    var open = !getSeen()[slug];
    var rules = (p.rules || []).map(function (r) {
      if (r.verdict) {
        var cls = r.verdict === 'BUY' ? 'v-buy' : r.verdict === 'SELL' ? 'v-sell' : 'v-hold';
        return '<div class="flex items-baseline gap-3 mb-2.5"><span class="verdict ' + cls + '">● ' + esc(r.verdict) + '</span>' +
          '<span class="ff-b text-[15px] text-lw-sub">' + esc(r.text) + '</span></div>';
      }
      return '<div class="flex items-baseline gap-3 mb-2.5"><span class="ff-m text-[11px] font-700 tracking-[.08em] uppercase" style="color:#B88E1E;min-width:84px">' + esc(r.label || '') + '</span>' +
        '<span class="ff-b text-[15px] text-lw-sub">' + esc(r.text) + '</span></div>';
    }).join('');
    return '<section class="max-w-[1240px] mx-auto px-5 mt-10">' +
      '<div class="primer" data-primer data-open="' + open + '" style="border-color:' + esc(show.brand || '#16130E') + '">' +
        '<button type="button" class="primer-hd" data-primer-toggle aria-expanded="' + open + '" aria-controls="primer-body-' + esc(slug) + '">' +
          '<span class="flex items-center gap-3"><span class="kicker" style="color:' + esc(show.brand || '#B88E1E') + '">How it works</span>' +
          '<span class="ff-d font-600 text-lg">New here? Start with the format.</span></span>' +
          '<svg class="primer-chev w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6"/></svg>' +
        '</button>' +
        '<div class="primer-body" id="primer-body-' + esc(slug) + '">' +
          (p.lead ? '<p class="ff-b text-[1.05rem] text-lw-sub leading-relaxed mb-4">' + esc(p.lead) + '</p>' : '') +
          rules +
          (p.note ? '<p class="ff-b text-[15px] text-lw-muted leading-relaxed mt-4 pt-4 border-t rule">' + esc(p.note) + '</p>' : '') +
        '</div>' +
      '</div>' +
    '</section>';
  }
  function wirePrimer() {
    var card = document.querySelector('[data-primer]'); if (!card) return;
    var btn = card.querySelector('[data-primer-toggle]'); var slug = getSlug();
    btn.addEventListener('click', function () {
      var open = card.getAttribute('data-open') !== 'true';
      card.setAttribute('data-open', open);
      btn.setAttribute('aria-expanded', open);
      if (!open) setSeen(slug); // remember "seen" once a visitor collapses it
    });
  }

  // ---- episodes (three tiers) ----
  function leadCard(ep) {
    if (!ep) return '';
    var img = ep.thumb
      ? '<a href="' + esc(ep.url) + '" class="imgz block aspect-[16/9] relative">' +
        '<img src="' + esc(ep.thumb) + '" alt="" loading="eager" onerror="var z=this.closest(\'.imgz\'); if(z) z.style.display=\'none\'">' + PLAY_SVG + '</a>'
      : '';
    var g = guestsOf(ep);
    return '<article class="story group">' +
      '<div class="mb-3 flex items-center gap-2"><span class="kicker" style="color:#B88E1E">Latest episode</span><span class="tierlbl">· Lead</span></div>' +
      img +
      '<a href="' + esc(ep.url) + '" class="block mt-4"><h2 class="hl ff-d font-600" style="font-size:clamp(1.6rem,3vw,2.4rem);line-height:1.08;letter-spacing:-.018em">' + esc(ep.title) + '</h2></a>' +
      '<div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 ts" style="text-transform:none;letter-spacing:.01em">' +
        (g ? '<span class="byl" style="text-transform:none">' + esc(g) + '</span>' : '') +
        (ep.duration ? '<span>· ' + esc(ep.duration) + '</span>' : '') +
        (ep.date ? '<span>· ' + esc(fmtDate(ep.date)) + '</span>' : '') +
      '</div></article>';
  }
  function featuredCard(ep) {
    var img = ep.thumb
      ? '<a href="' + esc(ep.url) + '" class="imgz block aspect-[16/10] mb-2.5 relative">' +
        '<img src="' + esc(ep.thumb) + '" alt="" loading="lazy" onerror="var z=this.closest(\'.imgz\'); if(z) z.style.background=\'#EEE9DF\'; this.remove()">' + PLAY_SVG + '</a>'
      : '';
    var g = guestsOf(ep);
    return '<article class="story group">' + img +
      '<div class="flex items-center gap-2 mb-1"><span class="kicker">Episode</span><span class="tierlbl">· Featured</span></div>' +
      '<a href="' + esc(ep.url) + '" class="block"><h3 class="hl ff-d text-lg leading-[1.16]">' + esc(ep.title) + '</h3></a>' +
      '<div class="ts mt-1.5" style="text-transform:none;letter-spacing:.01em">' + esc(g) + (ep.duration ? ' · ' + esc(ep.duration) : '') + '</div></article>';
  }
  // Standard — image-rich grid card
  function standardCard(ep) {
    var img = ep.thumb
      ? '<a href="' + esc(ep.url) + '" class="imgz block aspect-[16/10] mb-2 relative">' +
        '<img src="' + esc(ep.thumb) + '" alt="" loading="lazy" onerror="var z=this.closest(\'.imgz\'); if(z) z.style.background=\'#EEE9DF\'; this.remove()">' + PLAY_SVG_SM + '</a>'
      : '';
    var g = guestsOf(ep);
    return '<article class="story group">' + img +
      '<a href="' + esc(ep.url) + '" class="block"><h3 class="hl ff-d text-[15px] leading-[1.18]">' + esc(ep.title) + '</h3></a>' +
      '<div class="ts mt-1" style="text-transform:none;letter-spacing:.01em">' + esc(g) + (ep.duration ? ' · ' + esc(ep.duration) : '') + '</div></article>';
  }
  // Standard — text-dense row (keeps a small thumb): title · guests · duration · date
  function standardRow(ep) {
    var thumb = ep.thumb
      ? '<a href="' + esc(ep.url) + '" data-ep-thumb class="imgz w-24 aspect-[16/10] flex-shrink-0 relative">' +
        '<img src="' + esc(ep.thumb) + '" alt="" loading="lazy" onerror="this.closest(\'a\').style.display=\'none\'">' + PLAY_SVG_SM + '</a>'
      : '';
    var g = guestsOf(ep);
    return '<article class="story group flex gap-3.5 items-start py-3.5">' + thumb +
      '<div class="flex-1 min-w-0">' +
        '<a href="' + esc(ep.url) + '" class="block"><h3 class="hl ff-d text-[15px] leading-[1.22]">' + esc(ep.title) + '</h3></a>' +
        '<div class="ts mt-1 flex flex-wrap gap-x-2" style="text-transform:none;letter-spacing:.01em">' +
          (g ? '<span class="byl" style="text-transform:none">' + esc(g) + '</span>' : '') +
          (ep.duration ? '<span>· ' + esc(ep.duration) + '</span>' : '') +
          (ep.date ? '<span>· ' + esc(fmtDate(ep.date)) + '</span>' : '') +
        '</div>' +
      '</div></article>';
  }

  function episodesHtml(model, show) {
    var dense = density() === 'dense';
    var feat = model.featured.length
      ? '<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10 pt-8 border-t-2 border-lw-ink">' + model.featured.map(featuredCard).join('') + '</div>'
      : '';
    var std = '';
    if (model.standard.length) {
      var head = '<div class="flex items-center justify-between gap-3 mt-12 mb-5"><div class="flex items-center gap-3"><span class="secttl text-sm">Back catalogue</span><span class="tierlbl">' + model.standard.length + ' more · Standard</span></div>' +
        '<span class="ts hidden sm:inline">' + (dense ? 'Text-dense' : 'Image-rich') + ' · set in your account menu</span></div>';
      std = head + (dense
        ? '<div class="divide-y rule border-t rule">' + model.standard.map(standardRow).join('') + '</div>'
        : '<div class="grid grid-cols-2 lg:grid-cols-4 gap-x-7 gap-y-8">' + model.standard.map(standardCard).join('') + '</div>');
    }
    return '<section id="episodes" class="max-w-[1240px] mx-auto px-5 mt-10">' +
      '<div class="flex items-center gap-3 mb-6"><span class="w-2 h-2 rounded-full inline-block" style="background:#C0392B"></span>' +
      '<span class="secttl">Episodes</span><span class="ts">' + model.count + ' total</span><span class="flex-1 border-t rule"></span></div>' +
      leadCard(model.lead) + feat + std +
    '</section>';
  }
  function renderEpisodes() {
    var mount = document.getElementById('show-eps'); if (!mount || !mount.__show) return;
    mount.innerHTML = episodesHtml(buildEpisodes(mount.__show), mount.__show);
  }

  // ---- hosts + cross-links ----
  function hostsHtml(show) {
    var hosts = show.hosts || []; if (!hosts.length) return '';
    return '<section class="max-w-[1240px] mx-auto px-5 mt-14">' +
      '<div class="flex items-center gap-3 mb-6"><span class="secttl">Hosts</span><span class="flex-1 border-t rule"></span></div>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-8">' +
      hosts.map(function (h) {
        var bio = h.bio || ('Host of ' + show.name + '.');
        return '<div class="flex items-start gap-4">' + avatar(h.name, 56) +
          '<div class="flex-1 min-w-0"><div class="flex items-center justify-between gap-3 mb-1">' +
            '<a href="author.html" class="ff-d font-600 text-lg hover:text-lw-oxblood">' + esc(h.name) + '</a>' +
            '<button class="follow-btn follow-pill px-4 py-1.5" data-compact data-follow="author:' + esc(h.name) + '">Follow</button></div>' +
            (h.role ? '<div class="kicker mb-1.5" style="color:#8C8474">' + esc(h.role) + '</div>' : '') +
            '<p class="ff-b text-[15px] text-lw-muted leading-snug">' + esc(bio) + '</p></div></div>';
      }).join('') +
      '</div></section>';
  }
  function crossHtml(show) {
    var chips = [];
    (show.topics || []).forEach(function (t) { chips.push('<a class="xlink" href="topic.html?t=' + topicSlug(t) + '">' + esc(t) + '</a>'); });
    (show.tickers || []).forEach(function (t) { chips.push('<a class="xlink" href="scans.html?q=' + encodeURIComponent(tickerCode(t)) + '">' + esc(t) + '</a>'); });
    (show.funds || []).forEach(function (f) { chips.push('<a class="xlink" href="funds.html">' + esc(f) + '</a>'); });
    if (!chips.length) return '';
    return '<section class="max-w-[1240px] mx-auto px-5 mt-14 mb-4">' +
      '<div class="flex items-center gap-3 mb-5"><span class="secttl">Frequently covered</span><span class="flex-1 border-t rule"></span></div>' +
      '<div class="flex flex-wrap gap-2.5">' + chips.join('') + '</div>' +
      '<p class="ts mt-5" style="text-transform:none;letter-spacing:.01em;color:#8C8474">Concept demo. General information only, not financial advice.</p>' +
    '</section>';
  }

  // ---- orchestration ----
  function notFound(slug) {
    return '<div class="max-w-[820px] mx-auto px-5 py-24 text-center">' +
      '<div class="kicker">Show not found</div>' +
      '<h1 class="ff-d text-3xl font-600 mt-2 mb-3">We couldn’t find “' + esc(slug) + '”.</h1>' +
      '<p class="ff-b text-lw-muted mb-6">It may have moved. Browse all Livewire programmes instead.</p>' +
      '<a href="video.html" class="follow-btn follow-pill px-6 py-3 inline-block">All shows →</a></div>';
  }
  function render() {
    var root = document.querySelector('[data-show-root]'); if (!root) return;
    var slug = getSlug();
    var show = (window.LW_SHOW_BY_SLUG || {})[slug];
    if (!show) { root.innerHTML = notFound(slug); return; }
    document.title = show.name + ' | Livewire Markets';
    root.innerHTML =
      mastheadHtml(show) +
      primerHtml(show) +
      '<div id="show-eps"></div>' +
      hostsHtml(show) +
      crossHtml(show);
    var eps = document.getElementById('show-eps'); if (eps) eps.__show = show;
    renderEpisodes();
    wirePrimer();
    if (window.lwRewire) window.lwRewire();
  }

  // live RSS lands later → refresh episode tiers; density toggle → re-render rows
  document.addEventListener('lw:feed', renderEpisodes);
  document.addEventListener('lw:density', renderEpisodes);
  // re-wire follow button after auth changes (state repaint handled by app.js)
  document.addEventListener('lw:auth', function () { if (window.lwRewire) window.lwRewire(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
