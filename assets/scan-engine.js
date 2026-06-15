/* Livewire Remix 1b — client-side scan engine.
   Pure functions over window.LW_DATA. No DOM work here: scans.html,
   the home scan shelf and the search palette all call lwScan(). */
(function () {
  'use strict';

  // ---- entity tables -------------------------------------------------------
  var SYNONYMS = {
    uranium: ['nuclear', 'yellowcake', 'u3o8', 'reactor', 'reactors'],
    nuclear: ['uranium', 'yellowcake', 'reactor'],
    memory: ['dram', 'nand', 'hbm', 'micron', 'hynix', 'samsung', 'flash', 'semiconductor', 'semiconductors'],
    hbm: ['memory', 'dram', 'hynix', 'micron', 'semiconductors', 'ai'],
    semiconductor: ['chips', 'semis', 'memory', 'ai', 'semiconductors'],
    semiconductors: ['chips', 'semis', 'memory', 'ai'],
    chips: ['semiconductors', 'ai', 'memory', 'nvidia'],
    gold: ['precious metals', 'bullion', 'miners', 'goldminers'],
    silver: ['precious metals'],
    dividend: ['income', 'yield', 'franking', 'payout', 'dividends'],
    dividends: ['income', 'yield', 'franking', 'payout', 'dividend'],
    income: ['dividend', 'yield', 'franking', 'bonds', 'credit'],
    yield: ['income', 'dividend'],
    tech: ['technology', 'software', 'saas', 'ai'],
    technology: ['tech', 'software', 'saas'],
    software: ['tech', 'saas', 'technology'],
    ai: ['artificial intelligence', 'chips', 'semiconductors', 'data centres', 'machine learning'],
    artificial: ['ai'],
    intelligence: ['ai'],
    bank: ['banks', 'financials', 'cba', 'lenders'],
    banks: ['bank', 'financials', 'lenders', 'dividend'],
    retirement: ['retire', 'super', 'superannuation', 'annuities', 'pension', 'income'],
    retire: ['retirement', 'super', 'income'],
    property: ['housing', 'real estate', 'reits', 'reit'],
    housing: ['property', 'real estate'],
    energy: ['gas', 'oil', 'utilities', 'electrification', 'transition'],
    lithium: ['batteries', 'energy', 'transition'],
    takeover: ['m&a', 'merger', 'acquisition', 'takeovers', 'private equity'],
    macro: ['economy', 'rates', 'rba', 'inflation'],
    inflation: ['cpi', 'rates', 'macro', 'rba'],
    rates: ['rba', 'fed', 'inflation', 'macro', 'bonds'],
    rba: ['rates', 'inflation', 'macro'],
    china: ['global', 'consumption', 'stimulus'],
    bonds: ['fixed income', 'duration', 'credit', 'income'],
    credit: ['private credit', 'lending', 'bonds', 'income'],
    etf: ['etfs', 'index', 'funds', 'passive'],
    etfs: ['etf', 'index', 'funds', 'passive'],
    healthcare: ['csl', 'biotech', 'medical'],
    agriculture: ['soft commodities', 'grain', 'farming'],
    commodities: ['resources', 'materials', 'mining'],
    resources: ['commodities', 'mining', 'materials'],
    mining: ['resources', 'commodities', 'miners'],
    smallcaps: ['small caps', 'microcaps'],
    quality: ['compounders', 'moats', 'founders'],
    compounders: ['quality', 'moats', 'founders'],
    recession: ['macro', 'indicators', 'downturn'],
    global: ['international', 'world', 'us', 'china']
  };

  // company/ticker → themes (names lowercased; matched as substrings of the query)
  var TICKERS = {
    'asx:cba': { names: ['cba', 'commonwealth bank', 'commbank'], themes: ['banks', 'dividend'] },
    'asx:nab': { names: ['nab', 'national australia bank'], themes: ['banks', 'dividend'] },
    'asx:wbc': { names: ['westpac'], themes: ['banks', 'dividend'] },
    'asx:anz': { names: ['anz'], themes: ['banks', 'dividend'] },
    'asx:mqg': { names: ['macquarie'], themes: ['banks', 'financials'] },
    'asx:wtc': { names: ['wisetech'], themes: ['tech', 'software'] },
    'asx:xro': { names: ['xero'], themes: ['tech', 'software'] },
    'asx:tne': { names: ['technology one', 'technologyone'], themes: ['tech', 'software'] },
    'asx:vgl': { names: ['vista'], themes: ['tech', 'software'] },
    'asx:pme': { names: ['pro medicus'], themes: ['tech', 'healthcare'] },
    'asx:nxt': { names: ['nextdc'], themes: ['ai', 'data centres', 'tech'] },
    'asx:gmg': { names: ['goodman'], themes: ['property', 'ai', 'data centres'] },
    'asx:scg': { names: ['scentre'], themes: ['property'] },
    'asx:nst': { names: ['northern star'], themes: ['gold'] },
    'asx:evn': { names: ['evolution mining'], themes: ['gold'] },
    'asx:gor': { names: ['gold road'], themes: ['gold'] },
    'asx:pdn': { names: ['paladin'], themes: ['uranium'] },
    'asx:boe': { names: ['boss energy'], themes: ['uranium'] },
    'asx:dyl': { names: ['deep yellow'], themes: ['uranium'] },
    'asx:pls': { names: ['pilbara minerals'], themes: ['lithium', 'energy'] },
    'asx:lyc': { names: ['lynas'], themes: ['resources', 'materials'] },
    'asx:sto': { names: ['santos'], themes: ['energy', 'gas'] },
    'asx:org': { names: ['origin energy', 'origin'], themes: ['energy', 'gas'] },
    'asx:csl': { names: ['csl'], themes: ['healthcare'] },
    'asx:rmd': { names: ['resmed'], themes: ['healthcare'] },
    'asx:twe': { names: ['treasury wine'], themes: ['china', 'consumer'] },
    'asx:a2m': { names: ['a2 milk'], themes: ['china', 'consumer'] },
    'asx:vas': { names: ['vas', 'vanguard australian shares'], themes: ['etf'] },
    'asx:ndq': { names: ['ndq', 'nasdaq 100 etf'], themes: ['etf', 'tech'] },
    'asx:gnc': { names: ['graincorp'], themes: ['agriculture'] },
    'asx:eld': { names: ['elders'], themes: ['agriculture'] },
    'nas:nvda': { names: ['nvidia'], themes: ['ai', 'chips', 'semiconductors'] },
    'nas:mu': { names: ['micron'], themes: ['memory', 'hbm', 'semiconductors'] },
    'krx:000660': { names: ['sk hynix', 'hynix'], themes: ['memory', 'hbm', 'semiconductors'] }
  };

  var INTENT = {
    boostPop: /\b(top|best|favourite|favorite|leading|strongest)\b/,
    asxOnly: /\basx\b/,
    wantStocks: /\b(stocks?|shares?|companies|tickers?)\b/,
    strip: /\b(the best of|best of|what livewire has( to offer)?|show me|curate|give me|fetch|find( me)?|digest|everything|anything|about|on|for|in|me|i('m| am) after|whatever)\b/g
  };

  var STOP = { a:1, an:1, and:1, of:1, to:1, is:1, it:1, my:1, with:1, or:1, that:1, this:1, what:1, whats:1 };

  // ---- matcher -------------------------------------------------------------
  function tokenize(q) {
    return q.toLowerCase().replace(/[^a-z0-9$:&\s]/g, ' ').split(/\s+/).filter(function (t) { return t && !STOP[t]; });
  }

  function expand(tokens, joined) {
    var terms = {};   // term -> weight class ('theme' | 'word')
    var tickers = {}; // ticker ids hit
    tokens.forEach(function (t) {
      terms[t] = terms[t] || 'word';
      var syn = SYNONYMS[t] || SYNONYMS[t.replace(/s$/, '')] || null;
      if (syn) { terms[t] = 'theme'; syn.forEach(function (s) { terms[s] = terms[s] || 'theme'; }); }
    });
    Object.keys(TICKERS).forEach(function (tk) {
      var rec = TICKERS[tk];
      var hit = rec.names.some(function (n) { return joined.indexOf(n) !== -1; }) ||
                joined.indexOf(tk.split(':')[1]) !== -1;
      if (hit) { tickers[tk] = true; rec.themes.forEach(function (th) { terms[th] = 'theme'; }); }
    });
    return { terms: terms, tickers: tickers };
  }

  // word-boundary match for short tokens (so "ai" ≠ "chairman"), substring for longer
  function has(hay, term) {
    if (!hay) return false;
    if (term.length <= 3) { return new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(hay); }
    return hay.indexOf(term) !== -1;
  }
  function scoreItem(item, ex, flags, phrase) {
    var s = 0;
    var title = (item.title || '').toLowerCase();
    var dek = (item.dek || '').toLowerCase();
    var themes = (item.themes || []).join(' ').toLowerCase();
    var meta = ((item.topics || []).join(' ') + ' ' + (item.sectors || []).join(' ') + ' ' + (item.author || '')).toLowerCase();
    var tickstr = (item.tickers || []).join(' ').toLowerCase();
    var body = item.body ? item.body.replace(/<[^>]+>/g, ' ').toLowerCase() : '';
    // ticker match (company name / code → its themes flagged in expand)
    (item.tickers || []).forEach(function (tk) { if (ex.tickers[tk.toLowerCase()]) s += 6; });
    // per expanded term: score the strongest field it appears in (title wins)
    Object.keys(ex.terms).forEach(function (term) {
      if (term.length < 2) return;
      if (has(title, term)) s += 4;            // a title hit alone clears the bar
      else if (has(themes, term)) s += 3;
      else if (has(dek, term)) s += 2.5;
      else if (has(tickstr, term)) s += 2.5;
      else if (has(meta, term)) s += 2;
      else if (has(body, term)) s += 1.5;      // full-text over the wire body
    });
    if (!s) return 0;
    // exact multi-word phrase bonus
    if (phrase && phrase.indexOf(' ') !== -1) {
      if (title.indexOf(phrase) !== -1) s += 6;
      else if ((dek + ' ' + body).indexOf(phrase) !== -1) s += 3;
    }
    if (flags.asxOnly && flags.wantStocks && !(item.tickers || []).some(function (t) { return t.indexOf('ASX:') === 0; })) s *= 0.6;
    if (flags.boostPop) s += (item.pop || 0) / 40;
    if (item.live) s += 1.2;                    // gentle freshness nudge (not a filter)
    // recency as a small ADDITIVE bonus — never drags a real match below the cut
    var age = (Date.now() - new Date(item.pubDate).getTime()) / 864e5;
    s += Math.max(0, 2 - age / 14);
    return s;
  }

  function lwScan(query) {
    var q = (query || '').toLowerCase().trim();
    var flags = {
      boostPop: INTENT.boostPop.test(q),
      asxOnly: INTENT.asxOnly.test(q),
      wantStocks: INTENT.wantStocks.test(q)
    };
    var cleaned = q.replace(INTENT.strip, ' ').replace(/\s+/g, ' ').trim();
    var tokens = tokenize(cleaned);
    if (!tokens.length) return { query: query, flags: flags, results: [] };
    var ex = expand(tokens, ' ' + cleaned + ' ');
    var scored = (window.LW_DATA || []).map(function (item) {
      return { item: item, score: scoreItem(item, ex, flags, cleaned) };
    }).filter(function (r) { return r.score >= 3; });
    scored.sort(function (a, b) { return b.score - a.score; });
    return { query: query, flags: flags, entities: ex, results: scored.map(function (r) { return r.item; }) };
  }

  // does this query look scannable? (used by the search palette)
  function lwIsScannable(q) {
    q = (q || '').toLowerCase().trim();
    if (q.split(/\s+/).length >= 2) return true;
    var t = tokenize(q);
    if (!t.length) return false;
    var ex = expand(t, ' ' + q + ' ');
    return Object.keys(ex.tickers).length > 0 || t.some(function (x) { return SYNONYMS[x]; });
  }

  // ---- pre-mixed scans -----------------------------------------------------
  var SCANS = [
    { slug: 'top-tech-asx',    label: 'Top Tech ASX',            promise: 'The software and platform names earning their multiples.', query: 'top tech asx stocks' },
    { slug: 'gold',            label: 'Gold & Precious Metals',  promise: 'Bullion, miners and the central-bank bid.',                query: 'gold and precious metals' },
    { slug: 'memory',          label: 'Memory Manufacturers',    promise: 'DRAM, HBM and the AI memory squeeze.',                     query: 'memory manufacturers hbm' },
    { slug: 'dividend-income', label: 'Dividend Income',         promise: 'Franking, payout safety and yield that lasts.',            query: 'best dividend income stocks' },
    { slug: 'uranium',         label: 'Uranium & Nuclear',       promise: 'The supply squeeze powering the restart.',                 query: 'uranium and nuclear' },
    { slug: 'ai-supercycle',   label: 'The AI Supercycle',       promise: 'Chips, data centres and the build-out economics.',         query: 'ai chips data centres' },
    { slug: 'takeover-targets',label: 'Takeover Targets',        promise: 'Where private equity and strategics are circling.',        query: 'asx takeover targets small caps' },
    { slug: 'retire-on-income',label: 'Retire on Income',        promise: 'Turning a portfolio into a pay cheque.',                   query: 'retirement income annuities' }
  ];

  window.lwScan = lwScan;
  window.lwIsScannable = lwIsScannable;
  window.LW_SCANS = SCANS;
})();
