/* Livewire Remix 1b — signed-in personalised home.
   Keeps the EXACT Today grid skeleton (hero 80/20, Editors' Picks, The Briefing)
   but adapts its content to the reader's follows + preferences when signed in.
   Reads state from window.lwState (assets/app.js) and content from window.LW_DATA
   (assets/data/index.js, augmented with live RSS by assets/feed.js).

   Three visual tiers, mapped onto the existing grid so each is distinct at a glance:
     • Lead     — one: the hero (big bespoke image + large serif headline)
     • Featured — a few: image cards anchoring each followed-topic cluster
     • Standard — the tail: dense text rows [tag · headline · contributor · time]
                  whose thumbnail is shown (image-rich) or hidden (text-dense)
                  per the reader-density preference.

   Additive + reversible: on sign-out every adapted section is restored to its
   original markup and the injected surfaces are cleared, so the signed-out home
   is byte-for-byte unchanged. */
(function () {
  'use strict';

  function injectStyle() {
    if (document.getElementById('lw-pf-css')) return;
    var css =
      '.pf-chip{font-family:"Spline Sans Mono",monospace;font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;border:1px solid #16130E;padding:6px 11px;display:inline-block;transition:all .15s;color:#16130E;background:transparent}' +
      '.pf-chip:hover{background:#16130E;color:#FBFAF6}' +
      '.pf-tierlbl{color:#6B6358}' +
      /* reader density: hide Standard-row thumbs in text-dense mode */
      '[data-density=dense] [data-pf-thumb]{display:none !important}';
    var st = document.createElement('style'); st.id = 'lw-pf-css'; st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }
  injectStyle();

  var S = window.lwState;
  function signedIn() { return !!(S && S.signedIn()); }
  function following() { return (S && S.following()) || []; }
  function density() { return (S && S.density()) || 'rich'; }
  function recents() { return (S && S.recents()) || []; }
  function pins() { return (S && S.pins()) || []; }
  function user() { return (S && S.user) || { first: 'there', name: 'there' }; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function topicSlug(n) { return String(n || '').toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''); }
  function topicOf(it) { return (it.topics && it.topics[0]) || 'Markets'; }
  function uid(it) { return it.id || it.url || it.title; }
  function rel(iso) {
    var m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 60) return m + 'm ago';
    var h = Math.round(m / 60); if (h < 24) return h + 'h ago';
    return Math.round(h / 24) + 'd ago';
  }
  function relShort(iso) {
    var m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 60) return m + 'm'; var h = Math.round(m / 60); if (h < 24) return h + 'h';
    return Math.round(h / 24) + 'd';
  }
  function greetWord() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
  function tagOf(it) { var k = topicOf(it); if (it.type === 'video') return '▶ ' + k; if (it.type === 'podcast') return '🎙 ' + k; return k; }
  function avatar(name, px) { return window.lwAvatar ? window.lwAvatar(name, px) : ''; }

  // ---- follow-set helpers ----
  function followedAuthors() { return following().filter(function (k) { return k.indexOf('author:') === 0; }).map(function (k) { return k.slice(7); }); }
  function followedTopics() { return following().filter(function (k) { return k.indexOf('topic:') === 0; }).map(function (k) { return k.slice(6); }); }

  // ---- content pool ----
  function pool() {
    var data = (window.LW_DATA || []).filter(function (it) {
      return it && it.title && !it.locked && it.url && it.url !== '#';
    });
    // de-dupe by title (RSS + curated can overlap)
    var seen = {}, out = [];
    data.forEach(function (it) {
      var k = String(it.title).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
      if (k && !seen[k]) { seen[k] = 1; out.push(it); }
    });
    return out;
  }
  function isFollowed(it) {
    var fa = followedAuthors(), ft = followedTopics();
    if (fa.indexOf(it.author) !== -1) return true;
    return (it.topics || []).some(function (t) { return ft.indexOf(t) !== -1; });
  }
  function score(it) {
    var s = 0, fa = followedAuthors(), ft = followedTopics();
    if (fa.indexOf(it.author) !== -1) s += 50;
    if ((it.topics || []).some(function (t) { return ft.indexOf(t) !== -1; })) s += 35;
    var days = (Date.now() - new Date(it.pubDate).getTime()) / 864e5;
    if (!isNaN(days)) s += Math.max(0, 20 - days * 2);
    s += (it.pop || 0) / 12;
    if (it.image) s += 4;
    return s;
  }
  function byDateDesc(a, b) { return new Date(b.pubDate) - new Date(a.pubDate); }
  function byScoreDesc(a, b) { return score(b) - score(a); }

  // ===================================================================
  //  Tier renderers (reuse existing component classes)
  // ===================================================================
  function leadHtml(it) {
    var play = (it.type === 'video' || it.type === 'podcast')
      ? '<span class="play absolute inset-0 grid place-items-center"><span><svg class="w-5 h-5" fill="#fff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></span>' : '';
    var img = it.image
      ? '<div class="imgz block aspect-[16/9] mt-6 relative"><img src="' + esc(it.image) + '" alt="" loading="eager" onerror="var z=this.closest(\'.imgz\'); if(z) z.style.display=\'none\'">' + play + '</div>'
      : '';
    var dek = it.dek
      ? '<p class="ff-b text-lw-sub leading-snug mt-4" style="font-size:clamp(1.1rem,1.5vw,1.4rem);font-style:italic">' + esc(it.dek) + '</p>'
      : '';
    var why = isFollowed(it)
      ? (followedAuthors().indexOf(it.author) !== -1 ? 'Because you follow ' + esc(it.author) : 'From ' + esc(topicOf(it)) + ', a topic you follow')
      : 'Top story for you today';
    return '<a href="' + esc(it.url) + '" class="story group block no-underline">' +
      '<div class="mb-3 flex items-center gap-2 flex-wrap">' +
        '<span class="ff-m text-[11px] font-700 tracking-[.18em] uppercase" style="color:#B88E1E">' + esc(topicOf(it)) + '</span>' +
        '<span class="pf-tierlbl ff-m text-[9.5px] font-600 tracking-[.14em] uppercase">· Lead · ' + why + '</span>' +
      '</div>' +
      '<h1 class="hl ff-d font-600" style="font-size:clamp(2.2rem,4.4vw,3.8rem);line-height:1.0;letter-spacing:-.024em">' + esc(it.title) + '</h1>' +
      dek + img +
      '<div class="flex items-center gap-3 mt-5 pt-4 border-t border-lw-ink">' +
        '<span class="flex-shrink-0">' + avatar(it.author || 'Livewire', 30) + '</span>' +
        '<span class="byl">' + esc(it.author || 'Livewire') + '</span>' +
        '<span class="ts" style="text-transform:none;letter-spacing:.01em">· ' + rel(it.pubDate) + '</span>' +
        '<span class="flex-1"></span>' +
        '<span class="ff-m text-[11px] font-600 tracking-[.1em] uppercase inline-flex items-center gap-1" style="color:#B88E1E">Read the wire <span class="transition-transform group-hover:translate-x-1">→</span></span>' +
      '</div></a>';
  }

  // Featured: image card that anchors a followed-topic cluster
  function featuredCardHtml(it, label) {
    var play = it.type === 'video' || it.type === 'podcast'
      ? '<span class="play absolute inset-0 grid place-items-center"><span><svg class="w-5 h-5" fill="#fff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></span>' : '';
    var img = it.image
      ? '<a href="' + esc(it.url) + '" class="imgz block aspect-[16/10] mb-2.5 relative"><img src="' + esc(it.image) + '" alt="" loading="lazy" onerror="var z=this.closest(\'.imgz\'); if(z) z.style.background=\'#EEE9DF\'; this.remove()">' + play + '</a>'
      : '';
    return '<article class="story group py-4 lg:pr-5">' + img +
      '<a href="topic.html?t=' + esc(topicSlug(topicOf(it))) + '" class="kicker">' + esc(tagOf(it)) + '</a>' +
      (label ? ' <span class="pf-tierlbl ff-m text-[9px] font-600 tracking-[.12em] uppercase">· ' + esc(label) + '</span>' : '') +
      '<a href="' + esc(it.url) + '" class="block mt-1"><h3 class="hl ff-d text-lg leading-[1.13]">' + esc(it.title) + '</h3></a>' +
      (it.dek ? '<p class="ff-b text-[14px] text-lw-muted leading-snug mt-1.5">' + esc(it.dek) + '</p>' : '') +
      '<div class="byl mt-2">' + esc(it.author || 'Livewire') + '</div></article>';
  }

  // Standard: dense, text-first row. [tag] · headline · contributor · time
  // Thumbnail shown only in image-rich mode (CSS hides it in text-dense).
  function standardRowHtml(it, opts) {
    opts = opts || {};
    var thumb = (opts.thumb && it.image)
      ? '<a href="' + esc(it.url) + '" data-pf-thumb class="imgz w-16 h-12 flex-shrink-0 order-2"><img src="' + esc(it.image) + '" alt="" loading="lazy" onerror="this.closest(\'a\').remove()"></a>'
      : '';
    return '<article class="story group py-3 flex gap-3 items-start">' +
      '<div class="flex-1 min-w-0 order-1">' +
        '<div class="flex items-baseline gap-2">' +
          '<a href="topic.html?t=' + esc(topicSlug(topicOf(it))) + '" class="kicker">' + esc(tagOf(it)) + '</a>' +
          '<span class="ts flex-shrink-0" style="margin-left:auto">' + relShort(it.pubDate) + '</span>' +
        '</div>' +
        '<a href="' + esc(it.url) + '" class="block mt-0.5"><h3 class="hl ff-d text-[15px] leading-[1.22]">' + esc(it.title) + '</h3></a>' +
        '<div class="byl mt-1">' + esc(it.author || 'Livewire') + '</div>' +
      '</div>' + thumb +
    '</article>';
  }

  // ===================================================================
  //  Section adapters
  // ===================================================================
  function buildModel() {
    var all = pool();
    var followed = all.filter(isFollowed).sort(byDateDesc);
    var forYou = all.slice().sort(byScoreDesc);
    var leadPool = (followed.length ? followed : all).slice().sort(byScoreDesc);
    var lead = leadPool.filter(function (it) { return it.image; })[0] || leadPool[0] || forYou[0] || null;
    var used = {}; if (lead) used[uid(lead)] = 1;

    // Featured clusters: one per followed topic (fallback: top topics overall)
    var topics = followedTopics();
    if (!topics.length) {
      var counts = {}; all.forEach(function (it) { (it.topics || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
      topics = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 4);
    }
    topics = topics.slice(0, 4);
    var clusters = topics.map(function (t) {
      var items = (followed.length ? followed : all).filter(function (it) {
        return (it.topics || []).indexOf(t) !== -1 && !used[uid(it)];
      }).sort(byDateDesc);
      var featured = items[0];
      if (featured) used[uid(featured)] = 1;
      var rows = items.slice(1, 3); rows.forEach(function (it) { used[uid(it)] = 1; });
      return { topic: t, featured: featured, rows: rows };
    }).filter(function (c) { return c.featured; });

    // Standard tail: newest from feed not yet shown
    var tail = (followed.length ? followed : forYou).filter(function (it) { return !used[uid(it)]; });

    // For You list (hero left rail): interest-ranked, headline-only
    var forYouList = forYou.filter(function (it) { return !lead || uid(it) !== uid(lead); }).slice(0, 9);

    return { all: all, followed: followed, lead: lead, clusters: clusters, tail: tail, forYouList: forYouList };
  }

  function renderHero(model) {
    var hero = document.querySelector('[data-home-hero]');
    var today = document.querySelector('[data-home-today]');
    var label = document.querySelector('[data-pf-leftlabel]');
    if (label) label.textContent = 'For You';
    if (hero && model.lead) hero.innerHTML = leadHtml(model.lead);
    if (today) {
      today.innerHTML = model.forYouList.map(function (it) {
        return '<a href="' + esc(it.url) + '" class="story group block py-3 border-b border-lw-line last:border-b-0">' +
          '<div class="flex items-baseline justify-between gap-3 mb-1">' +
            '<span class="ff-m text-[9px] font-700 tracking-[.14em] uppercase" style="color:#B88E1E">' + esc(topicOf(it)) + '</span>' +
            '<span class="ff-m text-[9px] tracking-[.04em] flex-shrink-0" style="color:#9C9484">' + relShort(it.pubDate) + '</span>' +
          '</div>' +
          '<h3 class="hl ff-d text-[15px] leading-[1.18]">' + esc(it.title) + '</h3></a>';
      }).join('') || '<p class="ff-b italic text-lw-muted py-6 text-[14px]">Follow a few topics to fill this column.</p>';
    }
  }

  function renderPicks(model) {
    var sec = document.querySelector('[data-pf-picks]'); if (!sec) return;
    if (sec.__pfOrig == null) sec.__pfOrig = sec.innerHTML;
    var th = density() === 'rich';
    var head = '<div class="pt-3 pb-1 flex items-center gap-2"><span class="w-2 h-2 bg-lw-gold"></span>' +
      '<h2 class="secttl text-sm">Featured in your topics</h2></div>';
    if (!model.clusters.length) {
      sec.innerHTML = head + '<p class="ff-b italic text-lw-muted py-6 text-[15px]">Follow topics to surface featured stories here.</p>';
      return;
    }
    var cols = model.clusters.map(function (c) {
      var rows = c.rows.map(function (it) { return standardRowHtml(it, { thumb: th }); }).join('');
      return '<div class="lg:px-5 first:lg:pl-0 last:lg:pr-0">' +
        featuredCardHtml(c.featured, 'Featured') +
        (rows ? '<div class="divide-y rule border-t rule">' + rows + '</div>' : '') +
      '</div>';
    }).join('');
    sec.innerHTML = head +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-' + Math.min(4, model.clusters.length) + ' lg:divide-x rule">' + cols + '</div>';
  }

  function renderBriefing(model) {
    var sec = document.querySelector('[data-pf-briefing]'); if (!sec) return;
    if (sec.__pfOrig == null) sec.__pfOrig = sec.innerHTML;
    var th = density() === 'rich';
    var head = '<div class="pt-3 pb-1 flex items-center justify-between"><div class="flex items-center gap-2"><span class="w-2 h-2 bg-lw-gold"></span>' +
      '<h2 class="secttl text-sm">Latest from your feed</h2></div>' +
      '<span class="ts hidden sm:inline">Newest from the topics &amp; writers you follow</span></div>';
    var items = model.tail.slice(0, 16);
    if (!items.length) {
      sec.innerHTML = head + '<p class="ff-b italic text-lw-muted py-6 text-[15px]">You\u2019re all caught up \u2014 new wires from your follows will appear here.</p>';
      return;
    }
    // 4 balanced columns of Standard rows
    var ncol = 4, colArr = [[], [], [], []];
    items.forEach(function (it, i) { colArr[i % ncol].push(it); });
    var cols = colArr.filter(function (a) { return a.length; }).map(function (arr, i) {
      return '<div class="divide-y rule lg:px-5 first:lg:pl-0 last:lg:pr-0">' +
        arr.map(function (it) { return standardRowHtml(it, { thumb: th }); }).join('') + '</div>';
    }).join('');
    sec.innerHTML = head + '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x rule">' + cols + '</div>';
  }

  // Greeting masthead
  function renderGreet(model) {
    var mount = document.querySelector('[data-pf-greet]'); if (!mount) return;
    var u = user();
    var newCount = model.followed.filter(function (it) {
      var days = (Date.now() - new Date(it.pubDate).getTime()) / 864e5; return days <= 1.05;
    }).length;
    var fa = followedAuthors().length, ft = followedTopics().length;
    var meta = (fa + ft) === 0
      ? 'You\u2019re not following anyone yet \u2014 follow a few to personalise this page.'
      : ft + ' topic' + (ft === 1 ? '' : 's') + ' \u00b7 ' + fa + ' contributor' + (fa === 1 ? '' : 's') + ' followed' +
        (newCount ? ' \u00b7 <span style="color:#B88E1E">' + newCount + ' new in your feed today</span>' : '');
    var dn = density();
    mount.innerHTML =
      '<div class="pf-greet flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pt-7 pb-4 border-b-2 border-lw-ink">' +
        '<div>' +
          '<div class="kicker mb-1.5">' + esc(greetWord()) + '</div>' +
          '<h2 class="ff-d font-600 leading-none" style="font-size:clamp(1.8rem,3.5vw,2.6rem);letter-spacing:-.02em">' + esc(u.first) + '\u2019s Livewire</h2>' +
          '<p class="ts mt-2" style="text-transform:none;letter-spacing:.01em">' + meta + '</p>' +
        '</div>' +
        '<div class="flex items-center gap-2.5">' +
          '<span class="ff-m text-[10px] font-600 tracking-[.14em] uppercase" style="color:#8C8474">Density</span>' +
          '<div class="lw-seg" role="group" aria-label="Reader density" style="max-width:230px">' +
            '<button type="button" class="lw-seg-b' + (dn === 'rich' ? ' on' : '') + '" data-density-set="rich" aria-pressed="' + (dn === 'rich') + '">Image-rich</button>' +
            '<button type="button" class="lw-seg-b' + (dn === 'dense' ? ' on' : '') + '" data-density-set="dense" aria-pressed="' + (dn === 'dense') + '">Text-dense</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // "Your Livewire" band: followed chips + saved scans + continue reading
  function chip(href, label) { return '<a class="pf-chip" href="' + esc(href) + '">' + esc(label) + '</a>'; }
  function renderBand(model) {
    var mount = document.querySelector('[data-pf-band]'); if (!mount) return;
    var ft = followedTopics(), fa = followedAuthors(), p = pins();
    var hasFollows = (ft.length + fa.length) > 0;

    var chips = '';
    if (hasFollows) {
      chips = ft.map(function (t) { return chip('topic.html?t=' + topicSlug(t), t); }).join('') +
        fa.map(function (a) { return chip('author.html', '@ ' + a); }).join('');
    } else {
      var suggest = ['ETFs', 'Retirement', 'Income', 'Growth', 'Property', 'Small Caps'];
      chips = '<p class="ff-b text-[14px] text-lw-sub leading-snug mb-3">Follow a few to get started \u2014 their best ideas land here every morning.</p>' +
        '<div class="flex flex-wrap gap-2">' + suggest.map(function (t) {
          return '<button class="follow-btn follow-pill px-3.5 py-1.5" data-follow="topic:' + esc(t) + '"><span data-follow-label>Follow</span> ' + esc(t) + '</button>';
        }).join('') + '</div>';
    }

    var scans = p.length
      ? '<div class="mt-5"><div class="ff-m text-[10px] font-600 tracking-[.14em] uppercase mb-2" style="color:#8C8474">Saved scans</div>' +
        '<div class="flex flex-wrap gap-2">' + p.map(function (x) { return '<a class="pf-chip" href="scans.html?q=' + encodeURIComponent(x.query) + '">\u2041 ' + esc(x.label) + '</a>'; }).join('') +
        '</div></div>'
      : '<div class="mt-5"><div class="ff-m text-[10px] font-600 tracking-[.14em] uppercase mb-2" style="color:#8C8474">Saved scans</div>' +
        '<p class="ff-b text-[13.5px] text-lw-muted leading-snug">Pin a scan from <a href="scans.html" class="underline" style="color:#B88E1E">Scans</a> and it re-runs here.</p></div>';

    var r = recents();
    var cont = r.length
      ? '<div class="divide-y rule">' + r.slice(0, 4).map(function (it) {
          return '<a href="' + esc(it.url) + '" class="story group block py-2.5">' +
            (it.topic ? '<span class="kicker">' + esc(it.topic) + '</span>' : '') +
            '<h3 class="hl ff-d text-[15px] leading-[1.2] mt-0.5">' + esc(it.title) + '</h3>' +
            (it.author ? '<div class="byl mt-1">' + esc(it.author) + '</div>' : '') + '</a>';
        }).join('') + '</div>'
      : '<p class="ff-b italic text-lw-muted text-[14px] leading-snug py-2">Pick up where you left off \u2014 wires you open will appear here.</p>';

    mount.innerHTML =
      '<div class="pf-band -mx-5 px-5 my-7" style="background:#F2EEE5;border-top:1px solid #E4DFD4;border-bottom:1px solid #E4DFD4">' +
        '<div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 py-7">' +
          '<div>' +
            '<div class="flex items-center gap-2 mb-3"><svg class="w-4 h-4" fill="#B88E1E" viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>' +
              '<h2 class="secttl text-sm">Following</h2><a href="contributors.html" class="kicker ml-auto hover:text-lw-oxblood">Manage \u2192</a></div>' +
            (hasFollows ? '<div class="flex flex-wrap gap-2">' + chips + '</div>' : chips) +
            scans +
          '</div>' +
          '<div class="lg:border-l rule lg:pl-12">' +
            '<div class="flex items-center gap-2 mb-3"><h2 class="secttl text-sm">Continue reading</h2></div>' +
            cont +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderDemote() {
    var mount = document.querySelector('[data-pf-demote]'); if (!mount) return;
    mount.innerHTML = '<div class="flex items-center gap-3 pt-9 pb-1"><span class="secttl text-sm" style="color:#8C8474">More across Livewire</span><span class="flex-1 border-t-2 border-lw-ink"></span></div>';
  }

  // ===================================================================
  //  Orchestration
  // ===================================================================
  function renderPersonal() {
    var model = buildModel();
    renderGreet(model);
    renderHero(model);
    renderBand(model);
    renderPicks(model);
    renderBriefing(model);
    renderDemote();
    // re-bind follow buttons inside the freshly-injected band
    if (window.lwRewire) window.lwRewire();
  }

  function restore() {
    ['[data-pf-greet]', '[data-pf-band]', '[data-pf-demote]'].forEach(function (sel) {
      var el = document.querySelector(sel); if (el) el.innerHTML = '';
    });
    var picks = document.querySelector('[data-pf-picks]'); if (picks && picks.__pfOrig != null) picks.innerHTML = picks.__pfOrig;
    var brief = document.querySelector('[data-pf-briefing]'); if (brief && brief.__pfOrig != null) brief.innerHTML = brief.__pfOrig;
    var label = document.querySelector('[data-pf-leftlabel]'); if (label) label.textContent = 'Today';
    // let the signed-out inline hero script repaint the hero/today columns
    try { document.dispatchEvent(new CustomEvent('lw:home-restore')); } catch (e) {}
  }

  var raf = null;
  function apply() {
    if (!document.querySelector('[data-pf-greet]')) return; // not the homepage
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () { signedIn() ? renderPersonal() : restore(); });
  }

  function start() {
    apply();
    if (window.LW_FEED_READY && window.LW_FEED_READY.then) {
      window.LW_FEED_READY.then(apply, apply); setTimeout(apply, 2600);
    }
  }

  document.addEventListener('lw:feed', apply);
  document.addEventListener('lw:auth', apply);
  document.addEventListener('lw:follow', apply);
  document.addEventListener('lw:density', apply);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
