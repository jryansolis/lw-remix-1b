/* Livewire Remix 1.0 — article.html as a data-driven, auth-gated template.
   ?id=wire-N  → renders RSS wire N (real title/hero/byline + full body fetched
                 into data/feed.json). Signed in → whole article. Signed out →
                 a free teaser + sign-in gate (the body is Livewire's own).
   ?id=<demo>  → full in-house demo article (same gate logic).
   (no id)     → leaves the default hand-written article in the HTML untouched. */
(function () {
  'use strict';

  var DEMO = {
    'etf-income-2026': {
      kicker: [['ETFs', 'topics.html'], ['Income', 'topics.html']],
      title: 'Six ETFs built for income — without the equity-risk hangover',
      standfirst: 'Yield is everywhere in 2026. The trick is collecting it without quietly doubling down on the same five bank stocks every other income fund already owns.',
      author: 'Carl Capolingua', role: 'Markets Writer, Livewire', avatar: 'carl-capolingua.jpg',
      date: '10 JUNE 2026', read: '7 MIN READ', hero: 'etf.jpg', heroAlt: 'Income ETFs',
      herocap: 'The income-ETF shelf has roughly tripled in three years. Source: Livewire',
      tags: ['ETFs', 'Income', 'Wealth'], bio: 'Markets writer at Livewire covering ETFs, income strategies and personal finance.',
      body:
        '<p>Income investing used to be simple and dangerous in equal measure: buy the big four banks, clip the franked dividend, and hope the share price behaved. In 2026 the menu is far wider — but the hidden concentration risk has only grown, because most "income" ETFs are still quietly stuffed with the same handful of yield-heavy names.</p>' +
        '<p>The point of building an income sleeve from exchange-traded funds is diversification of the <em>source</em> of the income, not just the ticker on the label. Below are six funds that, used together, spread that income across credit, infrastructure, global equities and cash-plus — so a wobble in the banks does not take your whole pay cheque with it.</p>' +
        '<h2>Start with the engine room, not the yield headline</h2>' +
        '<p>The highest trailing yield is almost never the best forward decision. A 7% distribution funded by return-of-capital is a slow liquidation dressed up as income. Read the distribution composition before the headline number — the fund\'s own factsheet will tell you how much is genuine net income versus capital.</p>' +
        '<blockquote class="my-10 text-center"><div class="w-8 h-px bg-lw-gold mx-auto mb-5"></div><p class="ff-d text-3xl md:text-[2.4rem] font-400 leading-snug italic text-lw-ink">"Chase the source of the income, never the size of the number."</p><div class="w-8 h-px bg-lw-gold mx-auto mt-5"></div></blockquote>' +
        '<h2>Layer the sleeves</h2>' +
        '<p>A resilient income portfolio looks less like a single high-yield fund and more like four or five complementary ones: a core Australian-equity income fund, a global-equity income fund to dilute the bank weighting, an active credit fund for the part of the cycle where duration finally pays, and a cash-plus fund as the shock absorber.</p>' +
        '<p>Done well, the blended yield lands in the high-4s to mid-5s — below the flashiest single fund, but far steadier, and with a fraction of the drawdown when one sector rolls over. For most investors building toward or living in retirement, that trade is the entire game.</p>'
    },
    'small-cap-takeovers': {
      kicker: [['Small Caps', 'topics.html'], ['Shares', 'topics.html']],
      title: 'The six ASX small caps most likely to get taken over in 2026',
      standfirst: 'Private equity is sitting on record dry powder and the strategics are hungry. These are the names screening hardest as targets — and why.',
      author: 'Kerry Sun', role: 'Market Analyst, Livewire', avatar: 'kerry-sun.jpg',
      date: '9 JUNE 2026', read: '6 MIN READ', hero: 'predictions.jpg', heroAlt: 'ASX takeover targets',
      herocap: 'M&A volumes are building into the second half. Source: Livewire',
      tags: ['Small Caps', 'Shares', 'Markets'], bio: 'Market analyst at Livewire covering small caps, reporting season and the daily ASX wrap.',
      body:
        '<p>Takeover season rarely announces itself. It builds quietly — a register tightening here, a strategic buyer circling there — and then a Monday morning arrives with a 40% premium and a halt. The conditions for that morning are unusually well-aligned in 2026.</p>' +
        '<p>Buyout funds are holding near-record uncommitted capital, the Australian dollar is making offshore acquirers\' maths easier, and a clutch of quality small caps are trading well below where private buyers value them. When public-market patience and private-market hunger diverge this far, the gap usually closes with a bid.</p>' +
        '<h2>What the screen is looking for</h2>' +
        '<p>The targets that screen hardest share a profile: a defensible niche, recurring revenue, a clean balance sheet, and a share price that has de-rated for reasons that have nothing to do with the underlying business. Add a fragmented register with no blocking stake, and you have the textbook setup.</p>' +
        '<blockquote class="my-10 text-center"><div class="w-8 h-px bg-lw-gold mx-auto mb-5"></div><p class="ff-d text-3xl md:text-[2.4rem] font-400 leading-snug italic text-lw-ink">"You don\'t buy a stock for the bid. You buy it because it\'s cheap — the bid is the bonus."</p><div class="w-8 h-px bg-lw-gold mx-auto mt-5"></div></blockquote>' +
        '<h2>The discipline that matters</h2>' +
        '<p>The trap is buying mediocre businesses purely on takeover hope. The names worth owning are the ones you would happily hold for five years if no bid ever came — where the acquisition premium is upside on top of a thesis that already stands on its own.</p>' +
        '<p>That distinction is everything. Treat the bid as a free option, not the investment case, and a takeover wave becomes a tailwind rather than a gamble.</p>'
    }
  };

  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function initials(name) { return name.split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); }
  function signedIn() { try { return !!(JSON.parse(localStorage.getItem('lw_auth') || '{}').signedIn); } catch (e) { return false; } }
  function fmtDate(iso) {
    var MON = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    var d = new Date(iso); if (isNaN(d)) return '';
    return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
  }
  function avatarHtml(name, headshot, px) {
    if (headshot) return '<img src="assets/img/contributors/' + headshot + '" alt="' + esc(name) + '" class="avatar rounded-full" style="width:' + px + 'px;height:' + px + 'px;object-fit:cover">';
    return '<span class="ff-m" style="width:' + px + 'px;height:' + px + 'px;border-radius:9999px;background:linear-gradient(135deg,#374662,#19202D);color:#E0A82E;display:inline-grid;place-items:center;font-weight:700;font-size:' + Math.round(px * 0.34) + 'px">' + initials(name) + '</span>';
  }
  function set(sel, html) { var el = document.querySelector(sel); if (el) el.innerHTML = html; }
  function firstBlocks(html, n) {
    var tmp = document.createElement('div'); tmp.innerHTML = html;
    return [].slice.call(tmp.children, 0, n).map(function (e) { return e.outerHTML; }).join('');
  }

  function gateHtml(o) {
    var secondary = o.sourceUrl
      ? '<div class="ts mt-3" style="text-transform:none;letter-spacing:0">Prefer the source? <a href="' + esc(o.sourceUrl) + '" target="_blank" rel="noopener" class="underline" style="color:#7A2E2E">Read it free on Livewire ↗</a></div>'
      : '';
    return '<div class="lw-gate" style="position:relative;margin-top:-1px">' +
      '<div style="position:absolute;left:0;right:0;top:-140px;height:140px;background:linear-gradient(to bottom,rgba(251,250,246,0),#FBFAF6);pointer-events:none"></div>' +
      '<div style="border-top:2px solid #16130E;background:#F2EEE5;padding:2.2rem 1.6rem;text-align:center">' +
        '<div class="ff-m" style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#8C8474">Keep reading — it\'s free</div>' +
        '<h3 class="ff-d" style="font-size:1.7rem;line-height:1.12;margin:.6rem auto .4rem;max-width:24rem;color:#16130E">Create a free account to finish this article</h3>' +
        '<p class="ff-b" style="font-size:1.02rem;color:#6B6358;max-width:26rem;margin:0 auto 1.3rem">Join 280,000+ investors reading Australia\'s best market minds. No paywall — just a free account.</p>' +
        '<button data-art-unlock class="follow-btn" style="background:#16130E;color:#FBFAF6;padding:13px 30px;letter-spacing:.06em">Sign in / Create free account</button>' +
        secondary +
      '</div></div>';
  }
  function provenanceHtml(url) {
    if (!url) return '';
    return '<div class="ts mt-10 pt-5 border-t rule" style="text-transform:none;letter-spacing:0">Originally published on <a href="' + esc(url) + '" target="_blank" rel="noopener" class="underline" style="color:#7A2E2E">Livewire Markets ↗</a></div>';
  }

  function paintCommon(o) {
    document.title = o.title + ' | Livewire';
    var t = document.querySelector('[data-art-title]'); if (t) t.textContent = o.title;
    var sf = document.querySelector('[data-art-standfirst]'); if (sf) sf.textContent = o.standfirst;
    set('[data-art-kicker]', o.kicker.map(function (k) { return '<a href="' + k[1] + '" class="hover:text-lw-gold" style="color:#B88E1E">' + esc(k[0]).toUpperCase() + '</a>'; }).join(' · '));
    var hero = document.querySelector('[data-art-hero]');
    if (hero && o.heroSrc) { hero.src = o.heroSrc; hero.alt = o.heroAlt || o.title; if (o.heroRemote) hero.onerror = function () { var z = hero.closest('.imgz'); if (z) z.style.background = '#EEE9DF'; }; }
    var cap = document.querySelector('[data-art-herocap]'); if (cap) cap.innerHTML = o.herocap || '';
    set('[data-art-byline]',
      '<span class="text-lw-muted">By</span>' +
      '<span class="author-tag inline-flex items-center">' +
        '<button data-popover-trigger class="inline-flex items-center gap-2 font-600 hover:text-lw-oxblood">' + avatarHtml(o.author, o.avatar, 28) + esc(o.author) + '</button>' +
        '<div class="lw-popover"><div class="mx-auto mb-3" style="display:flex;justify-content:center">' + avatarHtml(o.author, o.avatar, 64) + '</div>' +
        '<div class="ff-d font-600 text-lg leading-tight">' + esc(o.author) + '</div>' +
        '<div class="kicker mb-3" style="color:#8C8474">' + esc(o.role) + '</div>' +
        '<p class="ff-b text-[15px] text-lw-muted leading-snug mb-4">Follow to add this author\'s wires to your feed.</p>' +
        '<button class="follow-btn follow-solid w-full py-2.5 mb-3" data-follow="author:' + esc(o.author) + '"><span data-follow-label>Follow</span></button>' +
        '<a href="author.html" class="ff-m text-[11px] uppercase tracking-wide underline">See all by ' + esc(o.author.split(' ')[0]) + '</a></div></span>' +
      '<span class="ts">· ' + esc(o.date) + (o.read ? ' · ' + esc(o.read) : '') + '</span>');
    var av = document.querySelector('[data-art-rail-avatar]');
    if (av) { var n = document.createElement('div'); n.innerHTML = avatarHtml(o.author, o.avatar, 56); var node = n.firstChild; node.setAttribute('data-art-rail-avatar', ''); node.className = (node.className || '') + ' mb-2'; av.replaceWith(node); }
    var rn = document.querySelector('[data-art-rail-name]'); if (rn) rn.textContent = o.author;
    var rr = document.querySelector('[data-art-rail-role]'); if (rr) rr.textContent = o.role;
    var rf = document.querySelector('[data-art-rail-follow]'); if (rf) rf.setAttribute('data-follow', 'author:' + o.author);
    set('[data-art-tags]', '<span class="ts mr-1">FILED UNDER</span>' +
      o.tags.map(function (t) { return '<a href="topics.html" class="follow-btn follow-pill px-3 py-1.5">' + esc(t) + '</a>'; }).join(''));
    set('[data-art-authorcards]',
      '<div class="border border-lw-line bg-white p-5 flex items-start gap-4">' + avatarHtml(o.author, o.avatar, 56) +
      '<div class="flex-1 min-w-0"><div class="flex items-center justify-between gap-3 mb-1"><a href="author.html" class="ff-d font-600 text-lg hover:text-lw-oxblood">' + esc(o.author) + '</a>' +
      '<button class="follow-btn follow-pill px-4 py-1.5" data-compact data-follow="author:' + esc(o.author) + '">Follow</button></div>' +
      '<p class="ff-b text-[15px] text-lw-muted leading-snug">' + esc(o.bio || (o.role + ' at Livewire.')) + '</p></div></div>');
  }

  function renderBody(o) {
    if (!o.body) { // no full text (rare) — show standfirst + outbound
      set('[data-art-body]', '<p>' + esc(o.standfirst || o.title) + '</p>' + provenanceHtml(o.sourceUrl));
      return;
    }
    if (signedIn()) { set('[data-art-body]', o.body + provenanceHtml(o.sourceUrl)); }
    else { set('[data-art-body]', firstBlocks(o.body, 3) + gateHtml(o)); }
    bindUnlock();
  }
  function bindUnlock() {
    document.querySelectorAll('[data-art-unlock]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); if (window.lwOpenSignin) window.lwOpenSignin(); });
    });
  }

  var CURRENT = null;
  function render(o) { CURRENT = o; paintCommon(o); renderBody(o); if (window.lwRewire) window.lwRewire(); try { window.scrollTo(0, 0); } catch (e) {} }

  function boot() {
    var id = new URLSearchParams(location.search).get('id');
    if (!id) return;
    if (DEMO[id]) { var a = DEMO[id]; a.heroSrc = 'assets/img/' + a.hero; render(a); return; }
    if (id.indexOf('wire-') === 0) {
      var nx = parseInt(id.slice(5), 10);
      fetch('data/feed.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!j || !j.items || !j.items.length) return;
        var items = j.items.slice().sort(function (a, b) { return new Date(b.pubDate) - new Date(a.pubDate); });
        var it = items[nx]; if (!it) return;
        var topic = it.topic || 'Markets';
        render({
          title: it.title, standfirst: it.dek || '', kicker: [[topic, 'topics.html']],
          author: it.author || 'Livewire', role: 'Livewire Contributor', avatar: null,
          date: fmtDate(it.pubDate), read: (it.readMins ? it.readMins + ' MIN READ' : 'LIVEWIRE WIRE'),
          heroSrc: it.image || 'assets/img/markets.jpg', heroRemote: !!it.image, heroAlt: it.title,
          herocap: 'Published on Livewire Markets', tags: [topic],
          bio: 'Published on Livewire Markets — Australia\'s home for investment insight from leading fund managers.',
          body: it.body || '', sourceUrl: it.url
        });
      }).catch(function () {});
    }
  }

  // re-gate (or reveal) when auth state flips
  document.addEventListener('lw:auth', function () { if (CURRENT) renderBody(CURRENT); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
