/* Livewire Remix 1b — shows registry.
   A "show" is a first-class, followable entity (alongside contributors and
   topics): a recurring branded programme with hosts, a repeatable format, a
   release cadence and discrete episodes. This data drives the reusable
   show-landing template (show.html?show=<slug>, rendered by assets/show.js).
   Adding a new show = adding an entry here + cover art. No new template file.

   Shape:
     slug, name, kind ('video' | 'podcast'), tagline
     hosts:[{name, role, headshot}]          // link to author.html
     cadence, nextEpisode
     coverArt, brand (accent hex)
     playlist (YouTube playlist id, for the hub)
     subscribeLinks:{apple, spotify, youtube} // external platforms
     formatPrimer:{ lead, rules:[{verdict?,label?,text}], note }
     topics:[], tickers:[], funds:[]          // cross-links
     episodes:[{ title, date, guests:[], thumb, duration, tickers:[], topics:[],
                 tier:'lead'|'featured'|'standard'?, url }]
*/
window.LW_SHOWS = [
  {
    slug: 'buy-hold-sell',
    name: 'Buy Hold Sell',
    kind: 'video',
    tagline: 'Two fund managers. Five stocks. One verdict each — buy, hold or sell.',
    hosts: [
      { name: 'Vishal Teckchandani', role: 'Host & Presenter', headshot: 'vishal-teckchandani.jpg', bio: 'Lead Investment Writer & Presenter. Vishal puts Australia’s best fund managers on the spot, every Friday.' }
    ],
    cadence: 'New episode every Friday',
    nextEpisode: 'Friday, 7:00am AEST',
    coverArt: 'assets/img/video-banks.jpg',
    brand: '#E0A82E',
    playlist: 'PLnaSJPapN1XSTgxqTYQJRTtDDSXGn84HV',
    subscribeLinks: {
      youtube: 'https://www.youtube.com/playlist?list=PLnaSJPapN1XSTgxqTYQJRTtDDSXGn84HV',
      apple: 'https://podcasts.apple.com/',
      spotify: 'https://open.spotify.com/'
    },
    formatPrimer: {
      lead: 'New here? Each episode, two fund managers face the same five stocks and must commit — out loud, on camera — to a single call on each.',
      rules: [
        { verdict: 'BUY', text: 'conviction it outperforms from here' },
        { verdict: 'HOLD', text: 'happy to own it, not adding' },
        { verdict: 'SELL', text: 'the risk/reward no longer stacks up' }
      ],
      note: 'No hedging, no “it depends” — that discipline is exactly why it’s become the most-watched thing Livewire makes. Every episode is also written up as a wire, so you can read the calls and revisit the reasoning any time.'
    },
    topics: ['Shares', 'Income', 'ETFs', 'Small Caps'],
    tickers: ['ASX:CBA', 'ASX:NAB', 'ASX:MQG', 'ASX:CSL', 'ASX:WTC'],
    funds: ['Forager Australian Shares Fund'],
    episodes: [
      { title: 'Is it time to ditch the banks? 7 ASX financials to watch', date: '2026-06-12', guests: ['Steve Johnson', 'Carl Capolingua'], thumb: 'assets/img/video-banks.jpg', duration: '12:04', tickers: ['ASX:CBA', 'ASX:NAB', 'ASX:MQG', 'ASX:GQG'], topics: ['Shares', 'Income'], tier: 'lead', url: 'article-video.html' },
      { title: '5 founder-led compounders with cult followings', date: '2026-06-05', guests: ['Marcus Marshall', 'Ben Richards'], thumb: 'assets/img/bhs-marshall.jpg', duration: '13:20', tickers: ['ASX:WTC', 'ASX:PME'], topics: ['Shares'], tier: 'featured', url: 'article-video.html' },
      { title: '8 consistent ASX dividend stocks (and 2 big buys)', date: '2026-05-29', guests: ['Carl Capolingua', 'Sara Allen'], thumb: 'assets/img/bank-dividends.jpg', duration: '13:40', tickers: ['ASX:CBA', 'ASX:NAB'], topics: ['Income'], tier: 'featured', url: 'article-video.html' },
      { title: 'Healthcare vs real estate: which wins 2026?', date: '2026-05-22', guests: ['Tom Stelzer', 'Steve Johnson'], thumb: 'assets/img/healthcare-vs.jpg', duration: '14:22', tickers: ['ASX:CSL', 'ASX:RMD'], topics: ['Shares'], url: 'article-video.html' },
      { title: 'The ETFs the pros are buying in 2026', date: '2026-05-15', guests: ['Will Taylor', 'Sara Allen'], thumb: 'assets/img/taylor-volt.jpg', duration: '15:18', tickers: ['ASX:VAS', 'ASX:NDQ'], topics: ['ETFs'], url: 'article-video.html' },
      { title: 'Three small caps the market has left behind', date: '2026-05-08', guests: ['Jun Bei Liu', 'Steve Johnson'], thumb: 'assets/img/junbei-sims.jpg', duration: '11:50', tickers: ['ASX:IMU'], topics: ['Small Caps'], url: 'article-video.html' },
      { title: 'Gold miners: dig in or take profits?', date: '2026-05-01', guests: ['Daniel Goldberg', 'Carl Capolingua'], thumb: 'assets/img/goldberg-commodities.jpg', duration: '12:30', tickers: ['ASX:NST', 'ASX:EVN'], topics: ['Markets'], url: 'article-video.html' },
      { title: 'Uranium’s second leg: buy, hold or sell?', date: '2026-04-24', guests: ['Guy Keller', 'Steve Johnson'], thumb: 'assets/img/uranium-keller.jpg', duration: '13:05', tickers: ['ASX:PDN', 'ASX:BOE'], topics: ['Small Caps'], url: 'article-video.html' }
    ]
  },
  {
    slug: 'the-rules-of-investing',
    name: 'The Rules of Investing',
    kind: 'podcast',
    tagline: 'Long-form conversations with the sharpest minds in markets.',
    hosts: [
      { name: 'James Marlay', role: 'Host & Co-founder', headshot: 'james-marlay.jpg', bio: 'Co-founder of Livewire. James sits down with leading investors for unhurried, deeply-researched conversations.' }
    ],
    cadence: 'New episode every second Friday',
    nextEpisode: 'Fri 26 Jun',
    coverArt: 'assets/img/watling-roi.jpg',
    brand: '#7FB996',
    playlist: 'PLnaSJPapN1XTfd_AXD4VDZIOduCQKleSX',
    subscribeLinks: {
      youtube: 'https://www.youtube.com/playlist?list=PLnaSJPapN1XTfd_AXD4VDZIOduCQKleSX',
      apple: 'https://podcasts.apple.com/',
      spotify: 'https://open.spotify.com/'
    },
    formatPrimer: {
      lead: 'A long-form interview podcast. Each episode, one guest — a leading fund manager, economist or founder — goes deep on how they actually invest.',
      rules: [
        { label: 'Format', text: 'one guest, ~45 minutes, unhurried' },
        { label: 'Why listen', text: 'the reasoning behind the calls, not just the calls' },
        { label: 'Also a wire', text: 'every episode is written up with the key takeaways' }
      ],
      note: 'Best listened end-to-end on your commute — but if you’re short on time, the companion wire has the highlights and the charts.'
    },
    topics: ['Markets', 'Shares', 'Growth'],
    tickers: [],
    funds: [],
    episodes: [
      { title: 'Chris Watling on the macro signals that matter in 2026', date: '2026-06-08', guests: ['Chris Watling'], thumb: 'assets/img/watling-roi.jpg', duration: '48 MIN', tickers: [], topics: ['Markets'], tier: 'lead', url: 'article-video.html' },
      { title: 'James Abela: the high-stakes search for quality', date: '2026-05-25', guests: ['James Abela'], thumb: 'assets/img/abela-roi.jpg', duration: '52 MIN', tickers: [], topics: ['Shares'], tier: 'featured', url: 'article-video.html' },
      { title: 'Reece Birtles on the AI infrastructure decade', date: '2026-05-11', guests: ['Reece Birtles'], thumb: 'assets/img/birtles-ai.jpg', duration: '44 MIN', tickers: ['ASX:GMG', 'ASX:NXT'], topics: ['Growth'], url: 'article-video.html' },
      { title: 'Inside a multi-strategy portfolio, with the team', date: '2026-04-27', guests: ['David Thornton'], thumb: 'assets/img/portfolio-panel.jpg', duration: '41 MIN', tickers: [], topics: ['Markets'], url: 'article-video.html' }
    ]
  },
  {
    slug: 'expert-insights',
    name: 'Expert Insights',
    kind: 'video',
    tagline: 'A single idea, explained by a pro — in under twenty minutes.',
    hosts: [
      { name: 'James Marlay', role: 'Host', headshot: 'james-marlay.jpg', bio: 'Co-founder of Livewire, drawing out one clear, actionable idea from a manager in each short episode.' }
    ],
    cadence: 'New episodes weekly',
    nextEpisode: null,
    coverArt: 'assets/img/video-colending.jpg',
    brand: '#B88E1E',
    playlist: 'PLnaSJPapN1XR8tjeo_Zo_ULzYe15DGTjx',
    subscribeLinks: {
      youtube: 'https://www.youtube.com/playlist?list=PLnaSJPapN1XR8tjeo_Zo_ULzYe15DGTjx'
    },
    formatPrimer: {
      lead: 'Short, focused explainers. One manager, one idea — clearly enough that a newcomer can follow it.',
      rules: [
        { label: 'Length', text: '10–20 minutes, one topic' },
        { label: 'Best for', text: 'understanding a strategy before you go deeper' }
      ],
      note: 'Concept demo. General information only, not financial advice.'
    },
    topics: ['Income', 'Shares'],
    tickers: [],
    funds: [],
    episodes: [
      { title: 'Suhail Shaikh on building income that lasts', date: '2026-06-03', guests: ['Suhail Shaikh'], thumb: 'assets/img/shaikh-energy.jpg', duration: '10 MIN', tickers: [], topics: ['Income'], tier: 'lead', url: 'article-video.html' },
      { title: 'Co-lending explained, with Gianpaolo Pellegrini', date: '2026-05-20', guests: ['Gianpaolo Pellegrini'], thumb: 'assets/img/video-colending.jpg', duration: '9 MIN', tickers: [], topics: ['Income'], tier: 'featured', url: 'article-video.html' },
      { title: 'The case for agriculture income, with Angus McKeown', date: '2026-05-06', guests: ['Angus McKeown'], thumb: 'assets/img/video-agriculture.jpg', duration: '16 MIN', tickers: ['ASX:GNC'], topics: ['Markets'], url: 'article-video.html' },
      { title: 'Nicholas Condoleon on the Ausbil approach', date: '2026-04-22', guests: ['Nicholas Condoleon'], thumb: 'assets/img/fif-ausbil.jpg', duration: '19 MIN', tickers: [], topics: ['Shares'], url: 'article-video.html' }
    ]
  },
  {
    slug: 'success-and-more-interesting-stuff',
    name: 'Success & More Interesting Stuff',
    kind: 'podcast',
    tagline: 'Conversations beyond the markets — on careers, decisions and life.',
    hosts: [
      { name: 'Vishal Teckchandani', role: 'Host', headshot: 'vishal-teckchandani.jpg', bio: 'Lead Investment Writer & Presenter, exploring the people and decisions behind the track records.' }
    ],
    cadence: 'New episode monthly',
    nextEpisode: null,
    coverArt: 'assets/img/markets.jpg',
    brand: '#7A2E2E',
    playlist: 'PLnaSJPapN1XR82fN20groofrDoZ4YGBwT',
    subscribeLinks: {
      youtube: 'https://www.youtube.com/playlist?list=PLnaSJPapN1XR82fN20groofrDoZ4YGBwT',
      apple: 'https://podcasts.apple.com/',
      spotify: 'https://open.spotify.com/'
    },
    formatPrimer: {
      lead: 'The off-markets podcast. Honest conversations with investors and operators about what actually drove their success.',
      rules: [
        { label: 'Format', text: 'one guest, wide-ranging, personal' },
        { label: 'Why listen', text: 'the decisions and mistakes behind the track record' }
      ],
      note: 'Concept demo. General information only, not financial advice.'
    },
    topics: ['Wealth'],
    tickers: [],
    funds: [],
    episodes: [
      { title: 'Roger Montgomery on the compounding mindset', date: '2026-06-01', guests: ['Roger Montgomery'], thumb: 'assets/img/markets.jpg', duration: '57 MIN', tickers: [], topics: ['Wealth'], tier: 'lead', url: 'article-video.html' },
      { title: 'Steve Johnson on contrarian conviction', date: '2026-05-02', guests: ['Steve Johnson'], thumb: 'assets/img/gopaul-bear.jpg', duration: '61 MIN', tickers: [], topics: ['Wealth'], tier: 'featured', url: 'article-video.html' },
      { title: 'Building a research process that scales', date: '2026-04-04', guests: ['Anna Dadic'], thumb: 'assets/img/fif-ausbil.jpg', duration: '49 MIN', tickers: [], topics: ['Wealth'], url: 'article-video.html' }
    ]
  }
];
window.LW_SHOW_BY_SLUG = {};
window.LW_SHOWS.forEach(function (s) { window.LW_SHOW_BY_SLUG[s.slug] = s; });
// title → show name, for tagging live RSS / curated wires onto a show
window.LW_SHOW_TITLE_MATCH = [
  { re: /buy hold sell/i, name: 'Buy Hold Sell' },
  { re: /rules of investing/i, name: 'The Rules of Investing' },
  { re: /expert insights/i, name: 'Expert Insights' },
  { re: /success and more interesting|success & more interesting/i, name: 'Success & More Interesting Stuff' }
];
window.LW_SHOW_NAME_TO_SLUG = {
  'Buy Hold Sell': 'buy-hold-sell',
  'The Rules of Investing': 'the-rules-of-investing',
  'Expert Insights': 'expert-insights',
  'Success & More Interesting Stuff': 'success-and-more-interesting-stuff'
};
