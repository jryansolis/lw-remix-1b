/* Livewire Remix 1b — topic registry. Drives the per-topic hub pages
   (topic.html?t=<slug>), the simplified topics directory, and the nav mega-menu.
   `name` matches the topic value used across LW_DATA / RSS so each hub can
   filter the live index. Banners are the Figma "Beats" hero banners. */
window.LW_TOPICS = [
  { slug:'shares', name:'Shares', banner:'assets/img/beats/shares.jpg',
    blurb:'ASX-listed companies, results season and the stock calls that matter — from the country’s sharpest equity minds.',
    subs:['ASX 200','Banks','Resources','Healthcare','Global equities'] },
  { slug:'income', name:'Income', banner:'assets/img/beats/income.jpg',
    blurb:'Dividends, bonds, private credit and the art of turning capital into a reliable, lasting pay cheque.',
    subs:['Dividends','Bonds','Private credit','Franking','Yield'] },
  { slug:'growth', name:'Growth', banner:'assets/img/beats/growth.jpg',
    blurb:'The structural themes compounding wealth over the next decade — technology, AI, and the founders behind them.',
    subs:['Technology','AI','Thematics','Founders','Disruption'] },
  { slug:'etfs', name:'ETFs', banner:'assets/img/beats/etfs.jpg',
    blurb:'Building blocks for every portfolio — core index, thematic and income ETFs, read the label twice.',
    subs:['Core','Thematic','Income ETFs','Global','Active ETFs'] },
  { slug:'retirement', name:'Retirement', banner:'assets/img/beats/retirement.jpg',
    blurb:'Super, pensions, annuities and drawdown — making your savings last as long as you do.',
    subs:['Superannuation','Pensions','Annuities','Drawdown','SMSF'] },
  { slug:'wealth', name:'Wealth', banner:'assets/img/beats/wealth.jpg',
    blurb:'Strategy, tax and the behavioural edge — how Australians actually build and keep wealth.',
    subs:['Tax & estate','Strategy','Behaviour','Education','Advice'] },
  { slug:'smallcaps', name:'Small Caps', banner:'assets/img/beats/smallcaps.jpg',
    blurb:'Where tomorrow’s leaders hide — emerging companies, takeover targets and the analysts who find them first.',
    subs:['Emerging','Takeovers','Microcaps','Founder-led','Resources'] },
  { slug:'property', name:'Property', banner:'assets/img/beats/property.jpg',
    blurb:'Residential, commercial, REITs and property credit — the data behind Australia’s favourite asset class.',
    subs:['Residential','REITs','Property credit','Commercial','Housing data'] }
];
window.LW_TOPIC_BY_SLUG = {}; window.LW_TOPICS.forEach(function (t) { window.LW_TOPIC_BY_SLUG[t.slug] = t; });
