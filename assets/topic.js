/* Livewire Remix 1b — per-topic hub (topic.html?t=<slug>).
   Fills the Figma beat-hero, the subtopic chips, and a ZDNet-style content
   layout (lead → secondary grid → latest list, with a sidebar) from the live
   index (LW_DATA, which feed.js augments with the day's RSS wires). */
(function () {
  'use strict';
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function relTime(iso) { var m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); if (m < 60) return m + 'M'; var h = Math.round(m / 60); if (h < 24) return h + 'H'; return Math.round(h / 24) + 'D'; }
  function slugName(n) { return String(n || '').toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''); }
  var HEAD = { 'vishal-teckchandani':1,'carl-capolingua':1,'steve-johnson':1,'roger-montgomery':1,'shane-oliver':1,'sara-allen':1,'aaron-minney':1,'ben-richards':1,'anna-dadic':1,'james-marlay':1,'chris-conway':1,'hans-lee':1,'kerry-sun':1,'tom-stelzer':1,'david-thornton':1,'paul-miron':1 };
  function avatar(name, px) { var s = slugName(name); if (HEAD[s]) return '<img src="assets/img/contributors/' + s + '.jpg" alt="' + esc(name) + '" class="avatar rounded-full flex-shrink-0" style="width:' + px + 'px;height:' + px + 'px">'; var i = String(name || 'LW').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); return '<span class="ff-m flex-shrink-0" style="width:' + px + 'px;height:' + px + 'px;border-radius:9999px;background:linear-gradient(135deg,#374662,#19202D);color:#E0A82E;display:inline-grid;place-items:center;font-weight:700;font-size:' + Math.round(px * 0.32) + 'px">' + i + '</span>'; }
  function kickerFor(it) { var k = (it.topics && it.topics[0]) || 'Markets'; if (it.type === 'video') k = '▶ ' + k; if (it.type === 'report') k = 'Special Report'; return k; }
  function url(it) { return it.url || 'article.html'; }

  function leadCard(it) {
    var img = it.image ? '<a href="' + url(it) + '" class="imgz block aspect-[16/9] mb-3"><img src="' + esc(it.image) + '" alt=""></a>' : '';
    return '<article class="story group border-b border-lw-ink pb-7 mb-7">' + img +
      '<span class="kicker">' + esc(kickerFor(it)) + '</span>' +
      '<a href="' + url(it) + '" class="block"><h2 class="hl text-[1.9rem] md:text-[2.4rem] leading-[1.06] mt-1.5" style="letter-spacing:-.01em">' + esc(it.title) + '</h2></a>' +
      (it.dek ? '<p class="ff-b text-[17px] text-lw-sub leading-snug mt-3 max-w-2xl">' + esc(it.dek) + '</p>' : '') +
      '<div class="mt-3.5 flex items-center gap-2.5">' + avatar(it.author, 26) + '<span class="byl">' + esc(it.author) + '</span></div></article>';
  }
  function gridCard(it) {
    var img = it.image ? '<a href="' + url(it) + '" class="imgz block aspect-[16/10] mb-2.5"><img src="' + esc(it.image) + '" alt="" loading="lazy"></a>' : '';
    return '<article class="story group">' + img + '<span class="kicker">' + esc(kickerFor(it)) + '</span>' +
      '<a href="' + url(it) + '" class="block mt-1"><h3 class="hl ff-d text-[17px] leading-[1.18]">' + esc(it.title) + '</h3></a>' +
      '<div class="byl mt-1.5">' + esc(it.author) + '</div></article>';
  }
  function listRow(it) {
    return '<article class="story group flex gap-4 py-3.5 items-baseline"><span class="ts flex-shrink-0" style="color:#B88E1E">' + (it.live ? '● ' + relTime(it.pubDate) : '') + '</span>' +
      '<div class="min-w-0"><a href="' + url(it) + '" class="block"><h3 class="hl ff-d text-[16px] leading-[1.2]">' + esc(it.title) + '</h3></a>' +
      '<div class="byl mt-1">' + esc(it.author) + '</div></div></article>';
  }

  function render() {
    var slug = new URLSearchParams(location.search).get('t') || 'shares';
    var topic = (window.LW_TOPIC_BY_SLUG || {})[slug] || (window.LW_TOPICS || [])[0];
    if (!topic) return;
    document.title = topic.name + ' | Livewire Markets';
    // hero
    var img = document.querySelector('[data-beat-img]'); if (img) { img.src = topic.banner; img.alt = topic.name; }
    var set = function (sel, txt) { var e = document.querySelector(sel); if (e) e.textContent = txt; };
    set('[data-beat-crumb]', topic.name.toUpperCase());
    set('[data-beat-name]', topic.name);
    set('[data-beat-blurb]', topic.blurb);
    var fb = document.querySelector('[data-beat-follow]'); if (fb) fb.setAttribute('data-follow', 'topic:' + topic.name);
    // subtopic chips → scans
    var subs = document.querySelector('[data-beat-subs]');
    if (subs) subs.innerHTML = '<span class="ts mr-1" style="color:#8C8474">In ' + esc(topic.name) + ':</span>' +
      topic.subs.map(function (s) { return '<span class="scan-chip" style="cursor:default;pointer-events:none">' + esc(s) + '</span>'; }).join('');

    // genuinely-live RSS wires for this topic (newest-first) + curated content
    var curated = ((window.LW_TOPIC_CONTENT || {})[slug] || []).map(function (c) {
      return { title: c.t, author: c.a, dek: c.d || '', image: c.img || '', url: 'article.html', topics: [topic.name], live: false };
    });
    var fromData = (window.LW_DATA || []).filter(function (it) { return (it.topics || []).indexOf(topic.name) !== -1 && !it.locked; });
    fromData.sort(function (a, b) { return (b.live ? 1 : 0) - (a.live ? 1 : 0) || (new Date(b.pubDate) - new Date(a.pubDate)); });
    var all = [], seen = {};
    fromData.concat(curated).forEach(function (it) { var k = (it.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 36); if (k && !seen[k]) { seen[k] = 1; all.push(it); } });
    var main = document.querySelector('[data-beat-main]');
    if (!all.length) { main.innerHTML = '<p class="ff-b italic text-lw-muted py-10">More ' + esc(topic.name) + ' wires are on the way.</p>'; }
    else {
      var lead = all[0], rest = all.slice(1);
      var grid = rest.slice(0, 4), list = rest.slice(4, 12);
      var h = leadCard(lead);
      if (grid.length) h += '<div class="grid sm:grid-cols-2 gap-x-10 gap-y-8 mb-9">' + grid.map(gridCard).join('') + '</div>';
      if (list.length) h += '<div class="border-t-2 border-lw-ink pt-3"><div class="flex items-center gap-2 mb-1"><span class="w-2 h-2 bg-lw-gold"></span><h2 class="secttl text-sm">Latest in ' + esc(topic.name) + '</h2></div><div class="divide-y rule">' + list.map(listRow).join('') + '</div></div>';
      main.innerHTML = h;
    }
    // sidebar: run-a-scan + other beats + ad
    var rail = document.querySelector('[data-beat-rail]');
    if (rail) {
      var others = (window.LW_TOPICS || []).filter(function (t) { return t.slug !== topic.slug; });
      rail.innerHTML =
        '<div class="border border-lw-ink p-5 mb-7"><div class="kicker mb-2">Follow ' + esc(topic.name) + '</div><p class="ff-b text-[15px] text-lw-sub leading-snug mb-3">New ' + esc(topic.name) + ' wires land in your Following feed and daily email digest.</p><button class="follow-btn follow-pill w-full text-center py-2.5" data-follow="topic:' + esc(topic.name) + '"><span data-follow-label>Follow</span></button></div>' +
        '<div class="mb-7"><div class="border-t-2 border-lw-ink pt-3 mb-3"><h2 class="secttl text-sm">More topics</h2></div><div class="flex flex-wrap gap-2">' + others.map(function (t) { return '<a href="topic.html?t=' + t.slug + '" class="scan-chip" style="text-transform:none;letter-spacing:.02em">' + esc(t.name) + '</a>'; }).join('') + '</div></div>' +
        '<div class="ad-label ff-m text-[10px] tracking-[.2em] uppercase mb-2" style="color:#B0A794">Advertisement</div><div class="h-[250px] flex items-center justify-center" style="background:#F2EEE5;border:1px solid #E4DFD4"><span class="ff-d italic text-lw-muted text-sm">300 × 250</span></div>';
    }
    if (window.lwRewire) window.lwRewire();
  }

  function boot() {
    if (window.LW_FEED_READY && window.LW_FEED_READY.then) { var done = false, g = function () { if (done) return; done = true; render(); }; window.LW_FEED_READY.then(g, g); setTimeout(g, 2500); }
    else render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
