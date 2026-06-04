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

  const isFollowing = (key) => following.has(key);

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

  // Wire follow buttons
  function initFollowButtons() {
    document.querySelectorAll('[data-follow]').forEach((btn) => {
      paintButton(btn);
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nowOn = toggleFollow(btn.dataset.follow);
        // tiny feedback pulse
        btn.animate(
          [{ transform: 'scale(0.94)' }, { transform: 'scale(1)' }],
          { duration: 160, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
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

  document.addEventListener('DOMContentLoaded', () => {
    initFollowButtons();
    initPopovers();
    initFeedToggle();
    document.querySelectorAll('[data-following-count]').forEach((el) => { el.textContent = following.size; });
  });
})();
