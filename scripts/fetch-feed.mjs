#!/usr/bin/env node
/* Fetch the Livewire RSS feed and write data/feed.json.
   Zero dependencies — the feed shape is known, so a targeted regex parse
   is safer than shipping an XML library. Exits non-zero on failure or an
   empty parse so the GitHub Action never commits a broken file. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FEED = 'https://www.livewiremarkets.com/feeds/latest.rss';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'feed.json');

const res = await fetch(FEED, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 lw-remix-1b' }
});
if (!res.ok) { console.error(`Feed fetch failed: HTTP ${res.status}`); process.exit(1); }
const xml = await res.text();

const unescape = (s) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim();

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? unescape(m[1]) : '';
};

const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, block]) => {
  const categories = [...block.matchAll(/<category>([\s\S]*?)<\/category>/g)].map((m) => unescape(m[1]));
  const tickers = categories
    .filter((c) => /^\[.*\]$/.test(c))
    .flatMap((c) => c.replace(/[\[\]]/g, '').split(';'))
    .map((t) => t.trim()).filter(Boolean);
  const image = (block.match(/<media:content url="([^"]+)" medium="image"/) || [])[1] || '';
  const pub = tag(block, 'pubDate');
  return {
    title: tag(block, 'title'),
    url: tag(block, 'link'),
    author: tag(block, 'dc:creator'),
    topic: tag(block, 'dc:subject'),
    tickers,
    categories: categories.filter((c) => !/^\[.*\]$/.test(c)),
    image,
    dek: tag(block, 'description'),
    pubDate: pub ? new Date(pub).toISOString() : ''
  };
}).filter((it) => it.title && it.url);

if (!items.length) { console.error('Parsed 0 items — refusing to write.'); process.exit(1); }

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ fetched: new Date().toISOString(), items }, null, 1) + '\n');
console.log(`Wrote ${items.length} items to data/feed.json`);
