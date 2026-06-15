/* Livewire Wired — shared interactions (framework-free) */
(function () {
  const LS_KEY = 'lw_following';
  const getFollowing = () => {
    try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); }
    catch { return new Set(); }
  };
  const saveFollowing = (set) => localStorage.setItem(LS_KEY, JSON.stringify([...set]));

  // Seed a demo "following" state on first visit so the Following feed is populated.
  let following = getFollowing();
  if (!localStorage.getItem(LS_KEY)) {
    following = new Set(['author:Vishal Teckchandani', 'author:Steve Johnson', 'topic:ETFs', 'topic:Retirement']);
    saveFollowing(following);
  }

  // ---- Auth (demo) ------------------------------------------------------
  const AUTH_KEY = 'lw_auth';
  const USER = { name: 'Joseph Alcantara', first: 'Joseph', initials: 'JA' };
  let auth = (() => { try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || { signedIn: false }; } catch { return { signedIn: false }; } })();
  const saveAuth = () => localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  let pendingAction = null;
  const authListeners = [];
  const onAuthChange = (fn) => authListeners.push(fn);
  function setSignedIn(v) { auth.signedIn = v; saveAuth(); authListeners.forEach((f) => { try { f(); } catch (_) {} }); try { document.dispatchEvent(new CustomEvent('lw:auth', { detail: { signedIn: v } })); } catch (_) {} }

  // follow state only "counts" while signed in (signed-out shows everything as Follow)
  const isFollowing = (key) => auth.signedIn && following.has(key);

  function paintButton(btn) {
    const key = btn.dataset.follow;
    const on = isFollowing(key);
    btn.classList.toggle('is-following', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    const label = btn.querySelector('[data-follow-label]') || btn;
    const compact = btn.hasAttribute('data-compact');
    if (label === btn) {
      btn.textContent = on ? (compact ? 'Following' : 'Following ✓') : 'Follow';
    } else {
      label.textContent = on ? 'Following' : 'Follow';
    }
  }

  function toggleFollow(key) {
    if (following.has(key)) following.delete(key); else following.add(key);
    saveFollowing(following);
    // repaint every button bound to this key
    document.querySelectorAll(`[data-follow="${cssEscape(key)}"]`).forEach(paintButton);
    // update any "following count" badges
    document.querySelectorAll('[data-following-count]').forEach((el) => {
      el.textContent = following.size;
    });
    return following.has(key);
  }

  function cssEscape(s) { return s.replace(/"/g, '\\"'); }

  const pulse = (btn) => btn.animate([{ transform: 'scale(0.94)' }, { transform: 'scale(1)' }], { duration: 160, easing: 'cubic-bezier(.2,.8,.2,1)' });

  // Wire follow buttons — signed-out clicks open the sign-in modal, then apply.
  function initFollowButtons() {
    document.querySelectorAll('[data-follow]').forEach((btn) => {
      if (btn.__wired) { paintButton(btn); return; }
      btn.__wired = true;
      paintButton(btn);
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = btn.dataset.follow;
        if (!auth.signedIn) {
          openSignin('Follow to build your personalised feed', () => {
            following.add(key); saveFollowing(following);
            document.querySelectorAll(`[data-follow="${cssEscape(key)}"]`).forEach(paintButton);
            document.querySelectorAll('[data-following-count]').forEach((el) => { el.textContent = following.size; });
          });
          return;
        }
        toggleFollow(key); pulse(btn);
      });
    });
  }

  // Author follow popover
  function initPopovers() {
    const triggers = document.querySelectorAll('[data-popover-trigger]');
    let open = null;
    const closeAll = () => {
      document.querySelectorAll('.lw-popover.open').forEach((p) => p.classList.remove('open'));
      open = null;
    };
    triggers.forEach((t) => {
      const pop = t.parentElement.querySelector('.lw-popover');
      if (!pop) return;
      t.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const wasOpen = pop.classList.contains('open');
        closeAll();
        if (!wasOpen) { pop.classList.add('open'); open = pop; }
      });
      // also open on hover (desktop)
      t.parentElement.addEventListener('mouseenter', () => {
        if (window.matchMedia('(hover: hover)').matches) { closeAll(); pop.classList.add('open'); }
      });
      t.parentElement.addEventListener('mouseleave', () => {
        if (window.matchMedia('(hover: hover)').matches) pop.classList.remove('open');
      });
    });
    document.addEventListener('click', (e) => {
      if (open && !e.target.closest('.lw-popover') && !e.target.closest('[data-popover-trigger]')) closeAll();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
  }

  // Homepage feed toggle — supports any number of tabs/panels
  // (e.g. Top News / Latest / Following). Pairs [data-feed-tab="x"] with
  // [data-feed-panel="x"]; defaults to the tab marked [data-default], else the first.
  function initFeedToggle() {
    const tabs = [...document.querySelectorAll('[data-feed-tab]')];
    if (!tabs.length) return;
    const panels = [...document.querySelectorAll('[data-feed-panel]')];
    const setTab = (name) => {
      tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.feedTab === name));
      // Set inline display directly — a `hidden` attribute is overridden by Tailwind
      // display utilities (e.g. `grid`) on the same element, so we can't rely on it.
      panels.forEach((el) => {
        const show = el.dataset.feedPanel === name;
        el.style.display = show ? '' : 'none';
        el.hidden = !show;
      });
    };
    tabs.forEach((t) => t.addEventListener('click', () => setTab(t.dataset.feedTab)));
    const def = tabs.find((t) => 'default' in t.dataset)?.dataset.feedTab || tabs[0].dataset.feedTab;
    setTab(def);
  }

  // Hover-to-preview: on hover (desktop only) play a clean, muted, looping
  // mid-clip of a video card's content using the YouTube IFrame Player API —
  //  • starts ~30% into the video and loops a ~9s window (not the start)
  //  • the player is scaled up inside an overflow-hidden frame so YouTube's
  //    title bar, controls and watermark are cropped out of view
  // Source: the card's own [data-preview] wins; else nearest [data-list].
  //   "VIDEOID" → that video · "list:PLAYLIST" → that playlist's current item
  let ytLoading = false; const ytQueue = [];
  function ensureYT(cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    ytQueue.push(cb);
    if (ytLoading) return;
    ytLoading = true;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prev === 'function') prev();
      ytQueue.splice(0).forEach((f) => f());
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }

  function initVideoPreviews() {
    if (!window.matchMedia('(hover: hover)').matches) return; // skip touch devices
    if (!document.getElementById('lw-prev-style')) {
      const st = document.createElement('style');
      st.id = 'lw-prev-style';
      // scale crops the embed's chrome (title top / controls + watermark bottom)
      st.textContent = '.lw-prev{position:absolute;inset:0;overflow:hidden;z-index:5;pointer-events:none;background:#0b0b0b;opacity:0;transition:opacity .35s ease}.lw-prev>iframe{position:absolute;top:50%;left:50%;width:100%;height:100%;transform:translate(-50%,-50%) scale(1.62);border:0}';
      document.head.appendChild(st);
    }
    const seen = new Set(); const targets = [];
    document.querySelectorAll('[data-preview]').forEach((el) => {
      const z = el.matches('.imgz') ? el : el.querySelector('.imgz');
      if (z && !seen.has(z)) { targets.push(z); seen.add(z); }
    });
    document.querySelectorAll('[data-list]').forEach((host) => {
      host.querySelectorAll('.imgz').forEach((z) => { if (!seen.has(z)) { targets.push(z); seen.add(z); } });
    });

    targets.forEach((z) => {
      const host = z.closest('[data-preview]') || z.closest('[data-list]');
      const raw = z.getAttribute('data-preview') ||
                  (host && host.getAttribute('data-preview')) ||
                  (host && host.getAttribute('data-list') ? 'list:' + host.getAttribute('data-list') : null);
      if (!raw) return;
      if (getComputedStyle(z).position === 'static') z.style.position = 'relative';
      let timer;

      const mount = () => {
        if (z.__prev) return;
        const wrap = document.createElement('div'); wrap.className = 'lw-prev';
        const holder = document.createElement('div'); wrap.appendChild(holder);
        z.appendChild(wrap);
        const state = { wrap: wrap, player: null, interval: null, dead: false, start: null, vid: '' };
        z.__prev = state;
        ensureYT(() => {
          if (state.dead) return;
          const isList = raw.indexOf('list:') === 0;
          const vars = { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, playsinline: 1 };
          if (isList) { vars.listType = 'playlist'; vars.list = raw.slice(5); }
          const opts = {
            host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%', playerVars: vars,
            events: {
              onReady: (e) => { try { e.target.mute(); e.target.playVideo(); } catch (_) {} },
              onStateChange: (e) => {
                if (e.data !== 1) return; // 1 = PLAYING
                const p = e.target; if (state.dead) return;
                wrap.style.opacity = '1';
                let vid = ''; try { vid = (p.getVideoData() || {}).video_id || ''; } catch (_) {}
                if (vid !== state.vid) {
                  state.vid = vid;
                  let d = 0; try { d = p.getDuration() || 0; } catch (_) {}
                  state.dur = d;
                  state.start = d > 40 ? Math.floor(d * 0.3) : (d > 14 ? 5 : 0);
                  if (state.start > 0) { try { p.seekTo(state.start, true); } catch (_) {} }
                }
                if (!state.interval) {
                  // Re-seek only to keep a long mid-window and to avoid the end
                  // screen — a tight loop would re-buffer and flash YouTube chrome.
                  state.interval = setInterval(() => {
                    if (state.dead) return;
                    try {
                      const t = p.getCurrentTime();
                      const past = t > state.start + 28;
                      const nearEnd = state.dur > 0 && t > state.dur - 3;
                      if (past || nearEnd || (state.start > 0 && t < state.start - 2)) p.seekTo(state.start, true);
                    } catch (_) {}
                  }, 1000);
                }
              }
            }
          };
          if (!isList) opts.videoId = raw;
          try { state.player = new YT.Player(holder, opts); } catch (_) {}
        });
      };

      const unmount = () => {
        const st = z.__prev; if (!st) return;
        st.dead = true; if (st.interval) clearInterval(st.interval);
        try { if (st.player && st.player.destroy) st.player.destroy(); } catch (_) {}
        if (st.wrap && st.wrap.parentNode) st.wrap.remove();
        z.__prev = null;
      };

      z.addEventListener('mouseenter', () => { timer = setTimeout(mount, 240); });
      z.addEventListener('mouseleave', () => { clearTimeout(timer); unmount(); });
    });
  }

  // ===================================================================
  //  Global UI: injected styles, search palette, sign-in modal
  // ===================================================================
  const elFrom = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  function injectGlobals() {
    if (document.getElementById('lwx-style')) return;
    const css = `
    .lwx-backdrop{position:fixed;inset:0;z-index:120;background:rgba(13,11,8,.55);backdrop-filter:saturate(120%) blur(2px);display:flex;justify-content:center;align-items:flex-start;padding:14vh 16px 16px;opacity:0;transition:opacity .18s ease}
    .lwx-backdrop[hidden]{display:none!important}
    .lwx-backdrop.show{opacity:1}
    .lwx-search{width:100%;max-width:620px;background:#FBFAF6;border:1px solid #E4DFD4;box-shadow:0 40px 90px -30px rgba(13,11,8,.5);transform:translateY(-8px);transition:transform .18s ease}
    .lwx-backdrop.show .lwx-search{transform:translateY(0)}
    .lwx-search-in{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid #E4DFD4}
    .lwx-search-in input{flex:1;border:0;background:transparent;outline:none;font-family:'Literata',serif;font-size:1.25rem;color:#16130E}
    .lwx-search-in input::placeholder{color:#A89F8E}
    .lwx-esc{font-family:'Spline Sans Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;border:1px solid #E4DFD4;padding:3px 7px;color:#6B6358}
    .lwx-results{max-height:52vh;overflow-y:auto}
    .lwx-grp{font-family:'Spline Sans Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#B88E1E;padding:14px 18px 6px}
    .lwx-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 18px;cursor:pointer;text-decoration:none}
    .lwx-row .lwx-t{font-family:'Besley',serif;font-size:1.02rem;color:#16130E;line-height:1.2}
    .lwx-row .lwx-k{font-family:'Spline Sans Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8C8474;flex-shrink:0}
    .lwx-row.act,.lwx-row:hover{background:#F2EEE5}
    .lwx-empty{padding:26px 18px;font-family:'Literata',serif;color:#6B6358}
    .lwx-foot{display:flex;gap:18px;padding:11px 18px;border-top:1px solid #E4DFD4;font-family:'Spline Sans Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8C8474}
    .lwx-foot kbd{border:1px solid #E4DFD4;padding:1px 5px;margin-right:3px;font-family:inherit}
    .lwx-modal{width:100%;max-width:420px;background:#FBFAF6;border:1px solid #E4DFD4;box-shadow:0 40px 90px -30px rgba(13,11,8,.5);padding:34px 30px;position:relative;transform:translateY(-8px);transition:transform .18s ease;text-align:center}
    .lwx-backdrop.show .lwx-modal{transform:translateY(0)}
    .lwx-x{position:absolute;top:14px;right:16px;color:#8C8474;font-size:18px;line-height:1}
    .lwx-modal h2{font-family:'Besley',serif;font-weight:500;font-size:1.7rem;line-height:1.1;margin:14px 0 8px}
    .lwx-modal .lwx-sub{font-family:'Literata',serif;color:#6B6358;font-size:1rem;margin-bottom:20px}
    .lwx-modal input{width:100%;border:1px solid #16130E;background:transparent;padding:12px 14px;font-family:'Literata',serif;font-size:1rem;outline:none;margin-bottom:10px}
    .lwx-modal input:focus{border-color:#B88E1E}
    .lwx-btn{display:block;width:100%;padding:12px;font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;border:1px solid #16130E}
    .lwx-btn-solid{background:#16130E;color:#FBFAF6}.lwx-btn-solid:hover{background:#B88E1E;border-color:#B88E1E;color:#16130E}
    .lwx-btn-ghost{background:transparent;color:#16130E;margin-top:8px}.lwx-btn-ghost:hover{background:#F2EEE5}
    .lwx-or{display:flex;align-items:center;gap:10px;color:#A89F8E;font-family:'Spline Sans Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;margin:16px 0}
    .lwx-or::before,.lwx-or::after{content:'';height:1px;flex:1;background:#E4DFD4}
    .lwx-fine{font-family:'Literata',serif;font-size:.9rem;color:#6B6358;margin-top:16px}
    .lwx-fine a{color:#7A2E2E;text-decoration:underline;cursor:pointer}
    .lwx-avatar{width:34px;height:34px;border-radius:9999px;background:linear-gradient(135deg,#374662,#19202D);color:#E0A82E;display:grid;place-items:center;font-family:'Spline Sans Mono',monospace;font-weight:700;font-size:12px;cursor:pointer}
    /* comments */
    .cmt-like.on{color:#7A2E2E}
    .cmt-reply-box{display:none}.cmt-reply-box.show{display:block}
    `;
    const st = document.createElement('style'); st.id = 'lwx-style'; st.textContent = css; document.head.appendChild(st);

    document.body.appendChild(elFrom(`<div id="lw-search" class="lwx-backdrop" hidden>
      <div class="lwx-search" role="dialog" aria-modal="true" aria-label="Search Livewire">
        <div class="lwx-search-in">
          <svg width="20" height="20" fill="none" stroke="#8C8474" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="1.6" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input id="lw-search-input" type="text" placeholder="Search articles, topics, contributors…" autocomplete="off" spellcheck="false">
          <button class="lwx-esc" data-search-close>esc</button>
        </div>
        <div id="lw-search-results" class="lwx-results"></div>
        <div class="lwx-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>
      </div></div>`));

    document.body.appendChild(elFrom(`<div id="lw-signin" class="lwx-backdrop" hidden>
      <div class="lwx-modal" role="dialog" aria-modal="true" aria-label="Sign in">
        <button class="lwx-x" data-signin-close aria-label="Close">✕</button>
        <img src="${logoBase()}assets/logo/wordmark.svg" alt="Livewire" style="height:30px;margin:0 auto 4px">
        <h2>Create your free account</h2>
        <p class="lwx-sub" data-signin-reason>Join 280,000+ investors reading Australia's best market minds — free.</p>
        <form id="lw-signin-form">
          <input type="email" placeholder="you@email.com" required aria-label="Email">
          <button type="submit" class="lwx-btn lwx-btn-solid">Continue</button>
        </form>
        <div class="lwx-or">or</div>
        <button class="lwx-btn lwx-btn-ghost" data-signin-sso>Continue with Google</button>
        <button class="lwx-btn lwx-btn-ghost" data-signin-sso>Continue with LinkedIn</button>
        <p class="lwx-fine">Already a member? <a data-signin-sso>Sign in</a></p>
      </div></div>`));
  }

  // logo path differs by depth? all pages are flat → 'assets/...'
  function logoBase() { return ''; }

  // ---- Search ----
  const SEARCH_INDEX = [
    { t: '"A real sting in the tail" — the rules of investing have been rewritten', k: 'Wealth', u: 'article.html', g: 'Articles' },
    { t: 'Where to catch the investment waves in 2026', k: 'Equities', u: 'article.html', g: 'Articles' },
    { t: 'Top 6 ASX takeover picks for 2026 — including one 10-bagger', k: 'Small Caps', u: 'article.html', g: 'Articles' },
    { t: 'The most consistent ASX ETFs for growth and income in 2026', k: 'ETFs', u: 'article.html', g: 'Articles' },
    { t: 'Retiring in 2026? Four smart moves to protect your lifestyle', k: 'Retirement', u: 'article.html', g: 'Articles' },
    { t: '5 shocking predictions for 2026 and beyond', k: 'Growth', u: 'article.html', g: 'Articles' },
    { t: 'Into the gale: positioning for a market few see coming', k: 'Feature', u: 'article-feature.html', g: 'Articles' },
    { t: 'Is it time to ditch the banks? 7 ASX financials to watch', k: 'Video · Buy Hold Sell', u: 'article-video.html', g: 'Videos' },
    { t: 'Co-lending explained, with Gianpaolo Pellegrini', k: 'Video · Expert Insights', u: 'video.html', g: 'Videos' },
    { t: 'The Rules of Investing — full episode archive', k: 'Podcast', u: 'video.html', g: 'Videos' },
    { t: 'Income Series 2026', k: 'Series', u: 'income-series.html', g: 'Series' },
    { t: 'Wealth', k: 'Topic', u: 'topics.html#wealth', g: 'Topics' },
    { t: 'Retirement', k: 'Topic', u: 'topics.html#retirement', g: 'Topics' },
    { t: 'Income', k: 'Topic', u: 'topics.html#income', g: 'Topics' },
    { t: 'Shares', k: 'Topic', u: 'topics.html#shares', g: 'Topics' },
    { t: 'Growth', k: 'Topic', u: 'topics.html#growth', g: 'Topics' },
    { t: 'ETFs', k: 'Topic', u: 'topics.html#etfs', g: 'Topics' },
    { t: 'Small Caps', k: 'Topic', u: 'topics.html#smallcaps', g: 'Topics' },
    { t: 'Property', k: 'Topic', u: 'topics.html#property', g: 'Topics' },
    { t: 'Vishal Teckchandani', k: 'Lead Writer', u: 'author.html', g: 'Contributors' },
    { t: 'Roger Montgomery', k: 'Montgomery Investment Mgmt', u: 'author.html', g: 'Contributors' },
    { t: 'Steve Johnson', k: 'Forager Funds', u: 'author.html', g: 'Contributors' },
    { t: 'Dr Shane Oliver', k: 'AMP', u: 'author.html', g: 'Contributors' },
    { t: 'Carl Capolingua', k: 'Livewire', u: 'author.html', g: 'Contributors' },
    { t: 'Sara Allen', k: 'Livewire', u: 'author.html', g: 'Contributors' },
    { t: 'Jun Bei Liu', k: 'TenCap', u: 'author.html', g: 'Contributors' },
  ];
  let searchActive = -1, searchRows = [];
  // merge the enriched content index (assets/data/index.js + RSS) with the
  // static topics/contributors/series entries; fall back to SEARCH_INDEX alone
  function searchItems() {
    if (!window.LW_DATA) return SEARCH_INDEX;
    const groupFor = (it) => it.type === 'video' ? 'Videos' : it.type === 'podcast' ? 'Podcasts' : it.type === 'report' ? 'Special Reports' : 'Articles';
    const content = window.LW_DATA.map((it) => ({
      t: it.title,
      k: (it.live ? '● ' : '') + ((it.topics && it.topics[0]) || it.author || ''),
      u: it.url, g: groupFor(it),
      x: ((it.themes || []).join(' ') + ' ' + (it.tickers || []).join(' ') + ' ' + (it.author || ''))
    }));
    const navItems = SEARCH_INDEX.filter((x) => x.g === 'Topics' || x.g === 'Contributors' || x.g === 'Series');
    return content.concat(navItems);
  }
  function renderSearch(q) {
    const box = document.getElementById('lw-search-results'); if (!box) return;
    const term = q.trim().toLowerCase();
    const all = searchItems();
    const items = term ? all.filter((x) => (x.t + ' ' + x.k + ' ' + x.g + ' ' + (x.x || '')).toLowerCase().includes(term)) : all.slice(0, 8);
    box.innerHTML = '';
    searchRows = [];
    // scannable ask → pin a "run as scan" row first (Enter runs the scan)
    if (term && window.lwIsScannable && window.lwIsScannable(term)) {
      const scanRow = elFrom(`<a class="lwx-row" href="scans.html?q=${encodeURIComponent(q.trim())}" style="border-left:2px solid #B88E1E"><span class="lwx-t">⌁ Scan every wire for “${q.trim()}”</span><span class="lwx-k">Curated digest</span></a>`);
      searchRows.push(scanRow); box.appendChild(scanRow);
    }
    if (!items.length && !searchRows.length) { box.innerHTML = `<div class="lwx-empty">No results for “${q}”. Try a topic, writer, or show.</div>`; return; }
    const groups = {};
    items.forEach((x) => { (groups[x.g] = groups[x.g] || []).push(x); });
    Object.keys(groups).forEach((g) => {
      box.appendChild(elFrom(`<div class="lwx-grp">${g}</div>`));
      groups[g].slice(0, 6).forEach((x) => {
        const a = elFrom(`<a class="lwx-row" href="${x.u}"><span class="lwx-t">${x.t}</span><span class="lwx-k">${x.k}</span></a>`);
        searchRows.push(a); box.appendChild(a);
      });
    });
    searchActive = 0; paintSearchActive();
  }
  function paintSearchActive() { searchRows.forEach((r, i) => r.classList.toggle('act', i === searchActive)); if (searchRows[searchActive]) searchRows[searchActive].scrollIntoView({ block: 'nearest' }); }
  function openSearch() {
    const bd = document.getElementById('lw-search'); if (!bd) return;
    bd.hidden = false; requestAnimationFrame(() => bd.classList.add('show'));
    const inp = document.getElementById('lw-search-input'); inp.value = ''; renderSearch(''); setTimeout(() => inp.focus(), 30);
  }
  function closeSearch() { const bd = document.getElementById('lw-search'); if (!bd) return; bd.classList.remove('show'); setTimeout(() => { bd.hidden = true; }, 180); }
  function initSearch() {
    const inp = document.getElementById('lw-search-input');
    inp.addEventListener('input', () => renderSearch(inp.value));
    const bd = document.getElementById('lw-search');
    bd.addEventListener('click', (e) => { if (e.target === bd || e.target.closest('[data-search-close]')) closeSearch(); });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); searchActive = Math.min(searchActive + 1, searchRows.length - 1); paintSearchActive(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); searchActive = Math.max(searchActive - 1, 0); paintSearchActive(); }
      else if (e.key === 'Enter') { if (searchRows[searchActive]) window.location.href = searchRows[searchActive].getAttribute('href'); }
    });
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
      else if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
      else if (e.key === 'Escape') { closeSearch(); closeSignin(); }
    });
  }

  // ---- Sign-in modal ----
  function openSignin(reason, cb) {
    const bd = document.getElementById('lw-signin'); if (!bd) return;
    pendingAction = cb || null;
    const r = bd.querySelector('[data-signin-reason]'); if (r && reason) r.textContent = reason;
    bd.hidden = false; requestAnimationFrame(() => bd.classList.add('show'));
    setTimeout(() => { const i = bd.querySelector('input'); if (i) i.focus(); }, 40);
  }
  function closeSignin() { const bd = document.getElementById('lw-signin'); if (!bd) return; bd.classList.remove('show'); setTimeout(() => { bd.hidden = true; }, 180); }
  function doSignIn() {
    setSignedIn(true); closeSignin();
    const cb = pendingAction; pendingAction = null; if (cb) setTimeout(cb, 60);
  }
  function initSignin() {
    const bd = document.getElementById('lw-signin');
    bd.addEventListener('click', (e) => { if (e.target === bd || e.target.closest('[data-signin-close]')) closeSignin(); });
    bd.querySelector('#lw-signin-form').addEventListener('submit', (e) => { e.preventDefault(); doSignIn(); });
    bd.querySelectorAll('[data-signin-sso]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); doSignIn(); }));
  }

  // ---- Auth-driven nav rendering ----
  function rightCluster() {
    const search = `<button data-act="search" aria-label="Search" class="w-9 h-9 grid place-items-center hover:bg-lw-mist rounded-full" style="color:#16130E"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="1.6" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></button>`;
    if (!auth.signedIn) {
      return `<div class="flex items-center gap-3">${search}<a href="#" data-act="signin" class="hidden sm:inline-flex items-center px-4 h-9 navlink" style="border:1px solid #16130E">Sign in</a></div>`;
    }
    const icon = (p) => `<button class="w-9 h-9 grid place-items-center hover:bg-lw-mist rounded-full" style="color:#16130E"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${p}</svg></button>`;
    return `<div class="flex items-center gap-2">${search}
      <a href="#" class="hidden md:inline-flex items-center px-3.5 h-9 navlink" style="background:#B88E1E;color:#16130E">Write a Wire</a>
      ${icon('<path stroke-width="1.6" stroke-linecap="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1"/>')}
      ${icon('<path stroke-width="1.6" stroke-linecap="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>')}
      <span class="lwx-avatar" data-act="avatar" title="${USER.name}">${USER.initials}</span></div>`;
  }
  function stripCluster() {
    if (!auth.signedIn) return `<a href="#" data-act="signin" class="hover:text-white">Sign in</a><a href="#" data-act="signin" style="color:#E0A82E" class="hover:text-white">Subscribe</a>`;
    return `<span style="color:rgba(251,250,246,.8)">Welcome back, ${USER.first}</span><a href="#" data-act="signout" class="hover:text-white" style="color:#E0A82E">Sign out</a>`;
  }
  function renderAuthUI() {
    const header = document.querySelector('header'); const hbar = header && header.querySelector(':scope > div');
    if (hbar && hbar.lastElementChild) { const slot = hbar.lastElementChild; const n = elFrom(rightCluster()); slot.replaceWith(n); }
    const strip = document.querySelector('.bg-lw-ink'); const sbar = strip && strip.querySelector(':scope > div');
    if (sbar && sbar.lastElementChild) { sbar.lastElementChild.innerHTML = stripCluster(); }
  }
  function initAuthActions() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      const act = a.getAttribute('data-act');
      if (act === 'search') { e.preventDefault(); openSearch(); }
      else if (act === 'signin') { e.preventDefault(); openSignin('Join 280,000+ investors reading Australia\'s best market minds — free.', null); }
      else if (act === 'signout') { e.preventDefault(); setSignedIn(false); }
      else if (act === 'avatar') { e.preventDefault(); setSignedIn(false); } // demo: avatar click signs out
    });
  }

  // ---- Pinned scans (saved questions; sign-in gated like follows) ----
  const PINS_KEY = 'lw_pinned_scans';
  function pins() { try { return JSON.parse(localStorage.getItem(PINS_KEY)) || []; } catch (e) { return []; } }
  function savePins(p) { localStorage.setItem(PINS_KEY, JSON.stringify(p)); }
  function paintPinButtons() {
    document.querySelectorAll('[data-pin-scan]').forEach((b) => {
      const label = b.getAttribute('data-pin-scan');
      const on = auth.signedIn && pins().some((p) => p.label === label);
      b.textContent = on ? '✓ Pinned to Following' : '+ Pin scan';
      b.classList.toggle('is-following', on);
    });
  }
  function initPinButtons() {
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pin-scan]'); if (!b) return;
      e.preventDefault();
      const label = b.getAttribute('data-pin-scan');
      const query = b.getAttribute('data-pin-query') || label;
      const toggle = () => {
        let p = pins();
        if (p.some((x) => x.label === label)) p = p.filter((x) => x.label !== label);
        else p.push({ label, query });
        savePins(p); paintPinButtons(); renderFollowingPanel();
      };
      if (!auth.signedIn) { openSignin('Sign in to pin scans — they re-run in your Following feed.', toggle); return; }
      toggle();
    });
    paintPinButtons();
  }
  function pinnedChipsHtml() {
    const p = pins();
    if (!p.length) return '';
    return `<div class="border-b rule pb-5 mb-2">
      <div class="ff-m text-[10px] font-600 tracking-[.18em] uppercase mb-3" style="color:#8C8474">Your pinned scans</div>
      <div class="flex flex-wrap gap-2">${p.map((x) => `<a class="scan-chip" href="scans.html?q=${encodeURIComponent(x.query)}">⌁ ${x.label}</a>`).join('')}</div>
    </div>`;
  }

  // ---- Following panel (homepage): teaser when signed-out ----
  function renderFollowingPanel() {
    const panel = document.querySelector('[data-feed-panel="following"]'); if (!panel) return;
    if (panel.__orig == null) panel.__orig = panel.innerHTML;
    if (auth.signedIn) {
      if (panel.innerHTML !== panel.__orig) panel.innerHTML = panel.__orig;
      const chips = pinnedChipsHtml();
      if (chips) panel.insertAdjacentHTML('afterbegin', `<div class="pt-6">${chips}</div>`);
      document.querySelectorAll('[data-follow]').forEach(paintButton); initFollowButtons(); return;
    }
    panel.innerHTML = `<div class="max-w-2xl mx-auto text-center py-10">
      <div class="kicker" style="color:#B88E1E">Your Livewire</div>
      <h2 class="ff-d text-3xl md:text-4xl font-500 mt-2" style="letter-spacing:-.02em">Follow the minds you trust.</h2>
      <p class="ff-b text-lg text-lw-sub leading-snug mt-3 mb-7">Create a free account to follow topics and contributors — their best ideas land here, every morning.</p>
      <div class="flex flex-wrap justify-center gap-2 mb-8">
        ${['ETFs', 'Retirement', 'Growth', 'Property', 'Income', 'Small Caps'].map((t) => `<button class="follow-btn follow-pill px-3.5 py-1.5" data-act="signin">+ ${t}</button>`).join('')}
      </div>
      <button class="lwx-btn lwx-btn-solid" style="display:inline-block;width:auto;padding:13px 34px" data-act="signin">Create free account</button>
      <p class="lwx-fine">Already a member? <a data-act="signin">Sign in</a></p>
    </div>`;
  }

  // ---- Comments ----
  function timeAgo() { return 'just now'; }
  function renderComposer() {
    document.querySelectorAll('[data-comment-composer]').forEach((c) => {
      if (auth.signedIn) {
        c.innerHTML = `<div class="flex gap-3 items-start">
          <span class="lwx-avatar" style="flex-shrink:0">${USER.initials}</span>
          <div class="flex-1">
            <textarea rows="2" placeholder="Add to the conversation…" class="w-full border border-lw-line bg-white p-3 ff-b" style="font-size:1rem;outline:none;resize:vertical"></textarea>
            <div class="flex justify-end mt-2"><button class="lwx-btn lwx-btn-solid" style="width:auto;padding:9px 22px" data-cmt-post>Post comment</button></div>
          </div></div>`;
      } else {
        c.innerHTML = `<div class="border border-lw-line bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span class="ff-b text-lw-sub" style="font-size:1.05rem">Join the conversation — it's free.</span>
          <button class="lwx-btn lwx-btn-solid" style="width:auto;padding:10px 24px" data-act="signin">Sign in to comment</button></div>`;
      }
    });
  }
  function initComments() {
    const root = document.querySelector('[data-comments]'); if (!root) return;
    renderComposer();
    root.addEventListener('click', (e) => {
      const like = e.target.closest('.cmt-like');
      if (like) {
        const n = like.querySelector('[data-n]'); let v = parseInt(n.textContent, 10) || 0;
        const on = like.classList.toggle('on'); n.textContent = on ? v + 1 : v - 1; return;
      }
      const reply = e.target.closest('.cmt-reply');
      if (reply) {
        if (!auth.signedIn) { openSignin('Sign in to reply', null); return; }
        const box = reply.closest('.cmt').querySelector('.cmt-reply-box'); if (box) box.classList.toggle('show');
        return;
      }
      const post = e.target.closest('[data-cmt-post]');
      if (post) {
        const ta = post.closest('[data-comment-composer]').querySelector('textarea');
        const txt = (ta.value || '').trim(); if (!txt) return;
        const list = root.querySelector('[data-comment-list]');
        list.insertBefore(buildComment(USER.name, 'You', txt), list.firstChild);
        ta.value = '';
        const cc = root.querySelector('[data-comment-count]'); if (cc) cc.textContent = (parseInt(cc.textContent, 10) || 0) + 1;
      }
    });
  }
  function buildComment(name, handle, txt) {
    return elFrom(`<div class="cmt py-6 border-b rule">
      <div class="flex gap-3">
        <span class="lwx-avatar" style="flex-shrink:0;width:40px;height:40px">${(name.split(' ').map((w) => w[0]).join('').slice(0, 2)).toUpperCase()}</span>
        <div class="flex-1 min-w-0">
          <div class="ts" style="text-transform:none;letter-spacing:0"><strong style="color:#16130E">${name}</strong> <span style="color:#8C8474">· ${handle} · just now</span></div>
          <p class="ff-b mt-1.5" style="font-size:1.08rem;line-height:1.6;color:#26211A">${txt.replace(/</g, '&lt;')}</p>
          <div class="flex items-center gap-5 mt-2 ts" style="text-transform:none;letter-spacing:0">
            <button class="cmt-like inline-flex items-center gap-1.5"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="1.6" d="M7 11v9M14 4l-1 6h6.5a2 2 0 012 2.4l-1.3 6A2 2 0 0117.2 21H7V11l3.5-7A1.5 1.5 0 0114 4z"/></svg><span data-n>0</span></button>
            <button class="cmt-reply" style="font-weight:600">Reply</button>
          </div>
        </div></div></div>`);
  }

  // exposed for the special-report gate (and any future member-gated surface)
  window.lwOpenSignin = function (cb) {
    if (auth.signedIn) { if (cb) cb(); return; }
    openSignin('Unlock member content with a free account.', cb);
  };
  // re-wire follow buttons + popovers in content injected after load (article.js)
  window.lwRewire = function () {
    initFollowButtons();
    try { initPopovers(); } catch (e) {}
    document.querySelectorAll('[data-follow]').forEach(paintButton);
  };

  document.addEventListener('DOMContentLoaded', () => {
    injectGlobals();
    renderAuthUI();
    initAuthActions();
    initSearch();
    initSignin();
    initFollowButtons();
    initPopovers();
    initFeedToggle();
    initVideoPreviews();
    renderFollowingPanel();
    initComments();
    initPinButtons();
    document.querySelectorAll('[data-following-count]').forEach((el) => { el.textContent = auth.signedIn ? following.size : 0; });
    onAuthChange(renderAuthUI);
    onAuthChange(renderFollowingPanel);
    onAuthChange(renderComposer);
    onAuthChange(paintPinButtons);
    onAuthChange(() => { document.querySelectorAll('[data-follow]').forEach(paintButton); document.querySelectorAll('[data-following-count]').forEach((el) => { el.textContent = auth.signedIn ? following.size : 0; }); });
  });
})();
