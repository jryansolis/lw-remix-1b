/* Livewire Remix 1b — Funds directory (concept / indicative demo data).
   Each fund is tied to one of our contributors as its manager, so the article
   reader and contributor surfaces can connect a wire to the fund behind it.
   `manager` matches the author/dc:creator name for lookups. */
window.LW_FUNDS = [
  { slug:'forager-australian-shares', name:'Forager Australian Shares Fund', manager:'Steve Johnson', firm:'Forager Funds Management',
    type:'Managed Fund', assetClass:'Australian Equities', ticker:'ASX:FOR', strategy:'High-conviction, contrarian value across overlooked ASX small and mid caps.',
    image:'assets/img/gopaul-bear.jpg', themes:['small caps','value','contrarian','shares'], mer:'1.20%', aum:'$420m' },
  { slug:'montgomery-small-companies', name:'Montgomery Small Companies Fund', manager:'Roger Montgomery', firm:'Montgomery Investment Management',
    type:'Managed Fund', assetClass:'Australian Small Caps', strategy:'Quality emerging leaders bought below intrinsic value and held for the compounding.',
    image:'assets/img/predictions.jpg', themes:['small caps','quality','growth','shares'], mer:'1.30%', aum:'$310m' },
  { slug:'tribeca-alpha', name:'Tribeca Alpha Plus Fund', manager:'Jun Bei Liu', firm:'Tribeca Investment Partners',
    type:'Managed Fund', assetClass:'Australian Equities (long/short)', strategy:'Active long/short on the ASX 200, leaning into the cycle’s strongest themes.',
    image:'assets/img/junbei-sims.jpg', themes:['shares','long short','china','markets'], mer:'1.50%', aum:'$1.1b' },
  { slug:'airlie-australian-share', name:'Airlie Australian Share Fund', manager:'Vihari Ross', firm:'Airlie Funds Management',
    type:'Managed Fund', assetClass:'Australian Equities', ticker:'ASX:AASF', strategy:'A concentrated book of cash-generative businesses with strong balance sheets.',
    image:'assets/img/vihari-ross.jpg', themes:['shares','quality','compounders'], mer:'0.78%', aum:'$840m' },
  { slug:'amp-dynamic-markets', name:'AMP Dynamic Markets Fund', manager:'Shane Oliver', firm:'AMP',
    type:'Managed Fund', assetClass:'Multi-Asset', strategy:'A macro-driven, dynamically allocated mix of growth and defensive assets.',
    image:'assets/img/mousina-amp.jpg', themes:['macro','markets','multi-asset','inflation'], mer:'0.65%', aum:'$560m' },
  { slug:'challenger-retirement-income', name:'Challenger Guaranteed Income', manager:'Aaron Minney', firm:'Challenger',
    type:'Annuity', assetClass:'Retirement Income', strategy:'A guaranteed income stream layered over the age pension for life-long certainty.',
    image:'assets/img/retirement.jpg', themes:['retirement','income','annuities','yield'], mer:'—', aum:'$5.2b' },
  { slug:'pengana-credit', name:'Pengana Global Private Credit', manager:'Chris Conway', firm:'Pengana Capital',
    type:'LIT', assetClass:'Private Credit', ticker:'ASX:PCX', strategy:'Diversified senior private credit targeting a stable, floating-rate income.',
    image:'assets/img/video-colending.jpg', themes:['income','private credit','credit','yield'], mer:'1.05%', aum:'$680m' },
  { slug:'msquared-mortgage-income', name:'Msquared Mortgage Income Fund', manager:'Paul Miron', firm:'Msquared Capital',
    type:'Managed Fund', assetClass:'Property Credit', strategy:'First-mortgage lending against Australian real estate for monthly income.',
    image:'assets/img/property.jpg', themes:['income','property','mortgages','credit'], mer:'—', aum:'$240m' },
  { slug:'vaneck-quality-etf', name:'VanEck MSCI Quality ETF', manager:'Carl Capolingua', firm:'VanEck',
    type:'ETF', assetClass:'Global Equities', ticker:'ASX:QUAL', strategy:'The world’s highest-quality companies, screened on returns, leverage and stability.',
    image:'assets/img/etf.jpg', themes:['etf','global','quality','growth'], mer:'0.40%', aum:'$3.4b' }
];
