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
    const had = following.has(key);
    if (had) following.delete(key); else following.add(key);
    saveFollowing(following);
    // repaint every button bound to this key
    document.querySelectorAll(`[data-follow="${cssEscape(key)}"]`).forEach(paintButton);
    // update any "following count" badges
    document.querySelectorAll('[data-following-count]').forEach((el) => {
      el.textContent = following.size;
    });
    if (!had) followToast(key);
    return following.has(key);
  }

  // Feedback when you follow: what happened + what to expect.
  function followToast(key) {
    const isTopic = key.indexOf('topic:') === 0;
    const name = key.replace(/^(topic|author):/, '');
    const msg = isTopic
      ? '<strong>Following ' + name + '</strong><br>New ' + name + ' wires will land in your <b>Following</b> feed and daily email digest.'
      : '<strong>Following ' + name + '</strong><br>You’ll see ' + name + '’s latest wires in your <b>Following</b> feed and daily digest.';
    showToast(msg, isTopic ? ('topic.html?t=' + topicSlug(name)) : 'index.html');
  }
  function topicSlug(name) { return String(name).toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''); }
  let toastTimer = null;
  function showToast(html, href) {
    let t = document.getElementById('lw-toast');
    if (!t) {
      t = document.createElement('div'); t.id = 'lw-toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(12px);z-index:130;max-width:min(92vw,440px);background:#16130E;color:#FBFAF6;border:1px solid #B88E1E;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 24px 50px -18px rgba(0,0,0,.5);opacity:0;transition:opacity .2s,transform .2s;font-family:Literata,serif;font-size:14px;line-height:1.4';
      document.body.appendChild(t);
    }
    t.innerHTML = '<span style="color:#E0A82E;flex-shrink:0;font-size:16px">✓</span><div style="flex:1">' + html +
      ' <a href="' + href + '" style="color:#E0A82E;text-decoration:underline;white-space:nowrap">View →</a></div>' +
      '<button data-toast-x style="color:rgba(251,250,246,.6);flex-shrink:0;font-family:monospace">✕</button>';
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
    clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 5200);
    t.querySelector('[data-toast-x]').onclick = hideToast;
  }
  function hideToast() { const t = document.getElementById('lw-toast'); if (!t) return; t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(12px)'; }

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
            followToast(key);
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

  // ---- Masthead: two-tier "terminal" header (dark utility bar + light sub-nav) ----
  const MH_NAV = [
    { label: 'Latest', href: 'index.html' },
    { label: 'Shares', href: 'topic.html?t=shares' },
    { label: 'Growth', href: 'topic.html?t=growth' },
    { label: 'Income', href: 'topic.html?t=income' },
    { label: 'ETFs', href: 'topic.html?t=etfs' },
    { label: 'Retirement', href: 'topic.html?t=retirement' },
    { label: 'Property', href: 'topic.html?t=property' },
    { label: 'Buy Hold Sell', href: 'buy-hold-sell.html' },
    { label: 'Podcast', href: 'video.html' }
  ];
  function mhPage() { return (location.pathname.split('/').pop() || 'index').toLowerCase().replace(/\.html$/, ''); }
  function mhActive(href) {
    const cur = mhPage(), t = new URLSearchParams(location.search).get('t');
    if (href === 'index.html') return cur === '' || cur === 'index';
    if (href.indexOf('topic.html?t=') === 0) return cur === 'topic' && t === href.split('=')[1];
    return cur === href.replace('.html', '');
  }
  function mhNavLinks() {
    return MH_NAV.map((n) => `<a href="${n.href}" class="lw-navlink${mhActive(n.href) ? ' is-active' : ''}">${n.label}</a>`).join('');
  }
  // the right-hand action cluster on the dark bar (auth-aware)
  function mhCluster() {
    const ico = (label, path, dot) => `<button aria-label="${label}" class="lw-ico relative w-9 h-9 grid place-items-center"><svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">${path}</svg>${dot ? '<span class="lw-dot"></span>' : ''}</button>`;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const themeBtn = `<button data-theme-toggle aria-label="Toggle dark mode" class="lw-ico w-9 h-9 grid place-items-center">` +
      (dark ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4"/><path stroke-linecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>') + '</button>';
    const search = `<button data-act="search" class="lw-search-pill hidden md:flex items-center gap-2 h-9 px-3.5 rounded-full w-[210px]"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="1.7" d="M21 21l-5-5m2-4a6 6 0 11-12 0 6 6 0 0112 0z"/></svg><span>Search</span></button>` +
      `<button data-act="search" aria-label="Search" class="lw-ico md:hidden w-9 h-9 grid place-items-center"><svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="1.7" d="M21 21l-5-5m2-4a6 6 0 11-12 0 6 6 0 0112 0z"/></svg></button>`;
    const write = `<a href="article.html" class="lw-write hidden sm:inline-flex items-center h-9 px-4">Write a Wire</a>`;
    let tail;
    if (auth.signedIn) {
      tail = ico('Notifications', '<path stroke-width="1.7" stroke-linecap="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1"/>', true) +
        ico('Saved', '<path stroke-width="1.7" stroke-linecap="round" d="M6 4h12a1 1 0 011 1v15l-7-3.5L5 20V5a1 1 0 011-1z"/>', false) +
        `<button data-act="avatar" class="flex items-center gap-1.5 pl-1" aria-label="Account"><span class="ff-m text-[12px] font-700 tracking-[.08em]" style="color:#fff">${USER.first.toUpperCase()}</span><svg class="w-4 h-4" style="color:rgba(251,250,246,.6)" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></button>`;
    } else {
      tail = `<a href="#" data-act="signin" class="ff-m text-[12px] font-700 tracking-[.06em] inline-flex items-center h-9 px-4" style="border:1px solid rgba(251,250,246,.45);color:#fff;text-transform:uppercase">Sign up</a>`;
    }
    return `${search}${write}${themeBtn}${tail}`;
  }
  function mastheadHtml() {
    return `<style id="lw-mh-css">
      .lw-navlink{font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:#16130E;white-space:nowrap;transition:color .15s;padding:14px 0;display:inline-block}
      .lw-navlink:hover{color:#B88E1E}.lw-navlink.is-active{color:#B88E1E}
      .lw-navdiv{width:1px;height:16px;background:#CFC8BA;flex-shrink:0}
      .lw-search-pill{font-family:'Spline Sans Mono',monospace;font-size:12.5px;letter-spacing:.02em;background:rgba(251,250,246,.1);color:rgba(251,250,246,.7);transition:background .15s}
      .lw-search-pill:hover{background:rgba(251,250,246,.18)}
      .lw-ico{color:rgba(251,250,246,.82);transition:color .15s,background .15s}
      .lw-ico:hover{color:#fff;background:rgba(251,250,246,.12)}
      .lw-dot{position:absolute;top:7px;right:8px;width:7px;height:7px;border-radius:9999px;background:#C0392B;box-shadow:0 0 0 2px #16130E}
      .lw-write{font-family:'Spline Sans Mono',monospace;font-size:12px;font-weight:700;letter-spacing:.02em;background:#E0A82E;color:#16130E;transition:background .15s}
      .lw-write:hover{background:#caa12f}
      [data-theme=dark] .lw-navlink{color:#EDE7DB}[data-theme=dark] .lw-navlink:hover,[data-theme=dark] .lw-navlink.is-active{color:#D8A93A}
      [data-theme=dark] .lw-navdiv{background:#4A4338}
      [data-theme=dark] .lw-subnav{background:#14120E !important;border-color:#4A4338 !important}
    </style>` +
      `<header class="lw-masthead sticky top-0 z-50">` +
        `<div class="bg-lw-ink">` +
          `<div class="max-w-[1240px] mx-auto px-5 h-[72px] flex items-center justify-between gap-4">` +
            `<a href="index.html" class="flex-shrink-0"><img data-fixed-logo src="assets/logo/wordmark-neg.svg" alt="Livewire Markets" class="h-12" onerror="this.style.display='none'"></a>` +
            `<div class="flex items-center gap-2 sm:gap-2.5" data-auth-cluster>${mhCluster()}</div>` +
          `</div>` +
        `</div>` +
        `<div class="lw-subnav bg-lw-paper border-b border-lw-ink">` +
          `<div class="max-w-[1240px] mx-auto px-5 flex items-center gap-x-5 lg:gap-x-7 overflow-x-auto">` +
            mhNavLinks() +
            `<span class="lw-navdiv"></span>` +
            `<a href="funds.html" class="lw-navlink${mhActive('funds.html') ? ' is-active' : ''}">Find Funds</a>` +
            `<a href="#newsletter" class="lw-navlink">Newsletter</a>` +
            `<button data-nav-more aria-label="More topics" class="lw-navlink" style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap">More <svg class="w-3.5 h-3.5" style="display:block;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6"/></svg></button>` +
          `</div>` +
        `</div>` +
      `</header>`;
  }
  function injectMasthead() {
    const slot = document.querySelector('[data-lw-masthead]');
    if (slot) slot.outerHTML = mastheadHtml();
    else document.body.insertAdjacentHTML('afterbegin', mastheadHtml());
    try { document.dispatchEvent(new CustomEvent('lw:masthead')); } catch (e) {}
  }
  function renderAuthUI() {
    const cluster = document.querySelector('[data-auth-cluster]');
    if (cluster) cluster.innerHTML = mhCluster();
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

  // ZDNet-style topics mega-menu: hover "Topics" → dropdown of beats + subtopics
  const TOPICS_NAV = [
    { slug: 'shares', name: 'Shares', subs: ['ASX 200', 'Banks', 'Resources', 'Healthcare', 'Global equities'] },
    { slug: 'income', name: 'Income', subs: ['Dividends', 'Bonds', 'Private credit', 'Franking', 'Yield'] },
    { slug: 'growth', name: 'Growth', subs: ['Technology', 'AI', 'Thematics', 'Founders', 'Disruption'] },
    { slug: 'etfs', name: 'ETFs', subs: ['Core', 'Thematic', 'Income ETFs', 'Global', 'Active ETFs'] },
    { slug: 'retirement', name: 'Retirement', subs: ['Superannuation', 'Pensions', 'Annuities', 'Drawdown', 'SMSF'] },
    { slug: 'wealth', name: 'Wealth', subs: ['Tax & estate', 'Strategy', 'Behaviour', 'Education', 'Advice'] },
    { slug: 'smallcaps', name: 'Small Caps', subs: ['Emerging', 'Takeovers', 'Microcaps', 'Founder-led', 'Resources'] },
    { slug: 'property', name: 'Property', subs: ['Residential', 'REITs', 'Property credit', 'Commercial', 'Housing data'] }
  ];
  function initTopicsMenu() {
    const header = document.querySelector('header'); if (!header) return;
    const link = header.querySelector('[data-nav-more]');
    if (!link || link.__megawired) return; link.__megawired = true;
    // header is position:sticky (a containing block already) — don't override it
    const panel = elFrom('<div class="lw-mega" style="position:absolute;left:0;right:0;top:100%;z-index:60;background:var(--lw-paper,#FBFAF6);border-bottom:1px solid #16130E;box-shadow:0 30px 50px -24px rgba(22,19,14,.4);opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .16s,transform .16s"></div>');
    panel.classList.add('bg-lw-paper');
    panel.innerHTML = '<div class="max-w-[1240px] mx-auto px-5 py-7 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-7">' +
      TOPICS_NAV.map((t) => '<div><a href="topic.html?t=' + t.slug + '" class="ff-d font-600 text-[17px] leading-tight hover:text-lw-oxblood block mb-2">' + t.name + '</a>' +
        '<div class="flex flex-col gap-1.5">' + t.subs.map((s) => '<a href="topic.html?t=' + t.slug + '" class="ff-b text-[13.5px] text-lw-muted hover:text-lw-ink leading-snug">' + s + '</a>').join('') + '</div></div>').join('') +
      '</div><div class="border-t rule"><div class="max-w-[1240px] mx-auto px-5 py-3 flex items-center justify-between"><a href="topics.html" class="navlink text-[11px] hover:text-lw-gold">All topics →</a><a href="funds.html" class="navlink text-[11px] hover:text-lw-gold" style="color:#B88E1E">Find Funds →</a></div></div>';
    header.appendChild(panel);
    let over = false, t;
    const show = () => { clearTimeout(t); panel.style.opacity = '1'; panel.style.visibility = 'visible'; panel.style.transform = 'translateY(0)'; };
    const hide = () => { t = setTimeout(() => { if (!over) { panel.style.opacity = '0'; panel.style.visibility = 'hidden'; panel.style.transform = 'translateY(-6px)'; } }, 120); };
    [link, panel].forEach((el) => { el.addEventListener('mouseenter', () => { over = true; show(); }); el.addEventListener('mouseleave', () => { over = false; hide(); }); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectGlobals();
    injectMasthead();
    renderAuthUI();
    initTopicsMenu();
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
