/* Livewire Remix 1b — per-topic editorial content for the topic hubs.
   NOTE: livewiremarkets.com's topic listing pages (/growth, /shares, …) are
   Cloudflare-blocked (HTTP 403) to automated fetches, and there is no per-topic
   RSS (only /feeds/latest.rss). So this is curated demo content — real Livewire
   contributors with topic-appropriate headlines — used to populate each hub.
   topic.js layers the genuinely-live RSS wires (from data/feed.json, mapped to
   the topic) ON TOP of this, newest-first, so real content leads where present.
   Keyed by topic slug; first item per topic is the lead (image + dek). */
window.LW_TOPIC_CONTENT = {
  shares: [
    { t: 'Reporting season scorecard: the 8 results that beat hardest', a: 'Chris Conway', d: 'Margins held up better than feared. The standouts — and the misses the market punished.', img: 'assets/img/equities.jpg' },
    { t: 'Is the ASX 200 finally too expensive to chase?', a: 'Hans Lee' },
    { t: 'Jun Bei Liu on the trade she wishes she’d held', a: 'Jun Bei Liu' },
    { t: 'CSL vs ResMed: the healthcare heavyweight bout', a: 'Tom Stelzer' },
    { t: 'Global equities: where the next decade of returns hides', a: 'Vihari Ross' },
    { t: 'Dear chairman: ReadyTech is in play', a: 'Kerry Sun' }
  ],
  income: [
    { t: 'Who wins the income battle: bonds, private credit or equities?', a: 'Aaron Minney', d: 'Three income managers stress-test the trade-offs across the cycle — and where the real risk sits.', img: 'assets/img/bank-dividends.jpg' },
    { t: 'Bank dividends: still the income engine, or a value trap?', a: 'Sara Allen' },
    { t: 'This ETF income portfolio delivered 7.2% — here’s how it’s built', a: 'Carl Capolingua' },
    { t: 'Franking credits: the hidden return most investors ignore', a: 'Sara Allen' },
    { t: 'The best ASX dividend stocks for 2026', a: 'Tom Stelzer' },
    { t: 'Private credit, explained: where the yield really sits', a: 'Paul Miron' }
  ],
  growth: [
    { t: 'Armina Rosenberg on riding the AI chip supercycle', a: 'Armina Rosenberg', d: 'The memory build-out has years to run — but the easy money has already been made.', img: 'assets/img/armina-ai.jpg' },
    { t: 'Is ASX tech back? Here’s 7 stocks rated buy', a: 'Kerry Sun' },
    { t: 'Reece Birtles on the AI infrastructure spend', a: 'Reece Birtles' },
    { t: 'Thematic investing: signal vs hype in 2026', a: 'Anna Dadic' },
    { t: 'Western reindustrialisation and the next resource boom', a: 'Kerry Sun' },
    { t: 'The energy transition’s second act: who profits now', a: 'Mary Shaikh' }
  ],
  etfs: [
    { t: 'The most consistent ASX ETFs for growth and income in 2026', a: 'Carl Capolingua', d: 'Ranking the steadiest performers on the Sortino ratio, not the headline return.', img: 'assets/img/etf.jpg' },
    { t: 'The five ETFs that quietly doubled investors’ money', a: 'Tom Stelzer' },
    { t: 'Core, satellite, thematic: building an ETF portfolio that lasts', a: 'Will Taylor' },
    { t: 'Active ETFs are booming — which ones actually earn their fee?', a: 'Kerry Sun' },
    { t: 'Global ETFs: hedged or unhedged in 2026?', a: 'Tom Stelzer' },
    { t: 'The mining giant and 4 ETFs to ride the next commodity leg', a: 'David Thornton' }
  ],
  retirement: [
    { t: 'Retiring in 2026? Four smart moves to protect your lifestyle', a: 'Aaron Minney', d: 'Sequencing risk is the quiet killer. Here’s how to defuse it before you draw down.', img: 'assets/img/retirement.jpg' },
    { t: 'Super in 2026: the changes every member needs to know', a: 'Sara Allen' },
    { t: 'Adam Dawes’ masterclass on investing for a wealthy retirement', a: 'Vishal Teckchandani' },
    { t: 'How much do you really need to retire? The new maths', a: 'Aaron Minney' },
    { t: 'Annuities are back: locking in income for life', a: 'David Thornton' },
    { t: 'The retirement income covenant, three years on', a: 'Aaron Minney' }
  ],
  wealth: [
    { t: 'Why the new tax regime could spark a revival in AREITs', a: 'Mark Mazzarella', d: 'Three reforms reshape how Australians build wealth — and where the opportunity now sits.', img: 'assets/img/tax.jpg' },
    { t: '3 pieces of investing wisdom that need to be chucked out', a: 'Keith Ford' },
    { t: 'Behavioural traps that quietly cost you returns', a: 'Roger Montgomery' },
    { t: 'James Abela on the quality that compounds', a: 'James Marlay' },
    { t: 'How the great compounders quietly built generational wealth', a: 'Roger Montgomery' },
    { t: 'The 10 golden rules of investing that never go out of style', a: 'James Marlay' }
  ],
  smallcaps: [
    { t: 'Top 6 ASX takeover picks for 2026 — including one 10-bagger', a: 'Ben Richards', d: 'Private equity is sitting on record dry powder. The names screening hardest as targets.', img: 'assets/img/predictions.jpg' },
    { t: 'Guy Keller on the uranium bull market’s second leg', a: 'Guy Keller' },
    { t: 'Each deal makes Tasmea harder to beat', a: 'Kerry Sun' },
    { t: 'The microcap founders quietly building the next 10-baggers', a: 'Anna Dadic' },
    { t: 'Emerging resources: the explorers turning into producers', a: 'David Thornton' },
    { t: 'Small-cap takeovers: the six names screening hardest', a: 'Ben Richards' }
  ],
  property: [
    { t: 'Where the smart money is buying property in 2026', a: 'Paul Miron', d: 'Private credit and build-to-rent are reshaping where the yield actually sits.', img: 'assets/img/property.jpg' },
    { t: 'Why the CBD prime office crunch is a buying opportunity', a: 'Paul Miron' },
    { t: 'REITs vs direct property: the 2026 income verdict', a: 'David Thornton' },
    { t: 'Property credit: the yield hiding in plain sight', a: 'Paul Miron' },
    { t: 'Build-to-rent: the institutional money reshaping renting', a: 'Paul Miron' },
    { t: 'Housing data signals a turn — what it means for investors', a: 'Diana Mousina' }
  ]
};
