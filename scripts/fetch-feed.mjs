#!/usr/bin/env node
/* Fetch the Livewire RSS feed → data/feed.json, and for each wire also fetch
   the article page and extract its body (Livewire's own content, used in this
   concept redesign). Zero dependencies — the shapes are known, so targeted
   regex parsing is safer than pulling an XML/HTML library. Exits non-zero on
   feed failure or an empty parse so the GitHub Action never commits a broken
   file; a single body-fetch failure is tolerated (that item just has no body). */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FEED = 'https://www.livewiremarkets.com/feeds/latest.rss';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'feed.json');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 lw-remix';

const res = await fetch(FEED, { headers: { 'User-Agent': UA } });
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
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, block]) => {
  const categories = [...block.matchAll(/<category>([\s\S]*?)<\/category>/g)].map((m) => unescape(m[1]));
  const tickers = categories.filter((c) => /^\[.*\]$/.test(c)).flatMap((c) => c.replace(/[\[\]]/g, '').split(';')).map((t) => t.trim()).filter(Boolean);
  const image = (block.match(/<media:content url="([^"]+)" medium="image"/) || [])[1] || '';
  const pub = tag(block, 'pubDate');
  return {
    title: tag(block, 'title'), url: tag(block, 'link'), author: tag(block, 'dc:creator'),
    topic: tag(block, 'dc:subject'), tickers,
    categories: categories.filter((c) => !/^\[.*\]$/.test(c)),
    image, dek: tag(block, 'description'), pubDate: pub ? new Date(pub).toISOString() : ''
  };
}).filter((it) => it.title && it.url);

if (!items.length) { console.error('Parsed 0 items — refusing to write.'); process.exit(1); }

// ---- body extraction -------------------------------------------------------
const BOILER = /^(please note|this (interview|episode|wire|conversation) was recorded|edited transcript|disclaimer|in the (interview|video) above)/i;

function blocksToHtml(blocks) {
  return blocks.map(([t, txt]) => {
    if (t === 'blockquote') {
      return '<blockquote class="my-9 text-center"><div class="w-8 h-px bg-lw-gold mx-auto mb-5"></div>' +
        '<p class="ff-d text-2xl md:text-[2rem] font-400 leading-snug italic text-lw-ink">' + esc(txt) + '</p>' +
        '<div class="w-8 h-px bg-lw-gold mx-auto mt-5"></div></blockquote>';
    }
    if (t === 'h2' || t === 'h3') return '<h2>' + esc(txt) + '</h2>';
    return '<p>' + esc(txt) + '</p>';
  }).join('\n');
}

async function fetchBody(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
    if (!r.ok) return null;
    const h = await r.text();
    const i = h.indexOf('class="wire-body full-wire wire-page"');
    if (i < 0) return null;
    const seg = h.slice(i, i + 80000);
    const blocks = [];
    for (const m of seg.matchAll(/<(p|h2|h3|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
      const txt = m[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
      if (txt.length < 40) continue;
      blocks.push([m[1], txt]);
    }
    while (blocks.length && BOILER.test(blocks[0][1])) blocks.shift();
    const clean = blocks.filter(([, t]) => !/embed it in your site|iframe|^contact$|^wires$/i.test(t));
    const capped = clean.slice(0, 22);
    if (!capped.length) return null;
    const words = capped.reduce((n, b) => n + b[1].split(/\s+/).length, 0);
    return { html: blocksToHtml(capped), readMins: Math.max(2, Math.round(words / 220)) };
  } catch { return null; }
  finally { clearTimeout(timer); }
}

let bodies = 0;
for (const it of items) {
  const b = await fetchBody(it.url);
  if (b) { it.body = b.html; it.readMins = b.readMins; bodies++; }
}

// Guard: never overwrite a good feed.json with a body-less one. The CI runner
// is sometimes Cloudflare-blocked on the per-wire pages (bodies come back empty);
// keep the last good committed copy rather than wiping the article bodies.
if (bodies === 0) {
  try {
    const prev = JSON.parse(readFileSync(OUT, 'utf8'));
    const prevBodies = (prev.items || []).filter((i) => i.body && i.body.length).length;
    if (prevBodies > 0) {
      console.warn(`Fetched 0 bodies (blocked?) — keeping existing feed.json with ${prevBodies} bodies. No overwrite.`);
      process.exit(0);
    }
  } catch { /* no previous file — write what we have */ }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ fetched: new Date().toISOString(), items }, null, 1) + '\n');
console.log(`Wrote ${items.length} items (${bodies} with full body) to data/feed.json`);
