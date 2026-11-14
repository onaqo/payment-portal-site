#!/usr/bin/env node
// Renders branded 1200x630 cover images (used on the page AND as the social/Google preview image).
//   node scripts/render-covers.mjs            -> covers for posts that don't have one yet
//   node scripts/render-covers.mjs <slug>     -> refresh one article’s updated artwork
//   node scripts/render-covers.mjs --all      -> re-render every cover
//   node scripts/render-covers.mjs --site     -> also render /og-image.jpg for the main site
// Install Chromium with npx playwright install chromium, or use PLAYWRIGHT_CHANNEL=chrome.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content/blog');
const OUT = path.join(ROOT, 'blog/covers');
const args = new Set(process.argv.slice(2));

const font = w => {
  const f = path.join(ROOT, `node_modules/@fontsource/inter/files/inter-latin-${w}-normal.woff2`);
  return fs.existsSync(f) ? `@font-face{font-family:Inter;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2')}` : '';
};
const FONTS = [500, 600, 700].map(font).join('');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rng = seed => () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) ^ Math.imul(seed ^ (seed >>> 13), 3266489909)) >>> 0) / 4294967296;

const MARK = `<svg width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="mb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#131D36"/><stop offset="1" stop-color="#060A14"/></linearGradient><linearGradient id="mr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6E9BFF"/><stop offset=".55" stop-color="#6E9BFF"/><stop offset="1" stop-color="#3DDC97"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="16" fill="url(#mb)" stroke="rgba(255,255,255,.09)" stroke-width="1.5"/><circle cx="31" cy="30" r="17" fill="none" stroke="url(#mr)" stroke-width="5.5" stroke-linecap="round"/><path d="M24.5 38.5 L31 21.5 L37.5 38.5" fill="none" stroke="#F1F5FF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M27.4 33 H34.6" stroke="#F1F5FF" stroke-width="3.4" stroke-linecap="round"/><path d="M39.4 37.2 Q46.6 44.4 55.4 44.6 A1.55 1.55 0 0 1 55.3 47.7 Q44.9 48.3 37.2 40.2 Z" fill="#3DDC97"/></svg>`;

// Topic illustrations (420x420), chosen from the post's category/keywords.
const MOTIFS = {
  routing: r => { const n = [[60, 210], [210, 90], [210, 210], [210, 330], [360, 150], [360, 270]]; return `<g fill="none" stroke-linecap="round">${[[0, 1], [0, 2], [0, 3], [1, 4], [2, 4], [2, 5], [3, 5]].map(([a, b], i) => `<path d="M${n[a][0]} ${n[a][1]} C ${(n[a][0] + n[b][0]) / 2} ${n[a][1]}, ${(n[a][0] + n[b][0]) / 2} ${n[b][1]}, ${n[b][0]} ${n[b][1]}" stroke="${i === 1 || i === 4 ? '#3DDC97' : 'rgba(110,155,255,.45)'}" stroke-width="${i === 1 || i === 4 ? 5 : 2.5}"/>`).join('')}</g>${n.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 0 ? 26 : 18}" fill="#0F1729" stroke="${i === 0 ? '#6E9BFF' : i === 2 || i === 4 ? '#3DDC97' : 'rgba(255,255,255,.25)'}" stroke-width="3"/>`).join('')}<circle cx="60" cy="210" r="9" fill="#6E9BFF"/>` },
  shield: () => `<path d="M210 50 L330 95 V200 C330 280 280 340 210 370 C140 340 90 280 90 200 V95 Z" fill="rgba(110,155,255,.08)" stroke="#6E9BFF" stroke-width="4"/><path d="M210 92 L295 124 V200 C295 258 260 302 210 326 C160 302 125 258 125 200 V124 Z" fill="#0F1729" stroke="rgba(255,255,255,.18)" stroke-width="2"/><path d="M168 205 L200 237 L258 172" fill="none" stroke="#3DDC97" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`,
  layers: () => [0, 1, 2].map(i => `<g transform="translate(${70 + i * 34} ${250 - i * 70})"><rect width="250" height="140" rx="22" fill="${i === 2 ? '#131D36' : '#0F1729'}" stroke="${i === 2 ? '#6E9BFF' : 'rgba(255,255,255,.16)'}" stroke-width="${i === 2 ? 3 : 2}"/><rect x="24" y="26" width="${i === 2 ? 60 : 90}" height="12" rx="6" fill="${i === 2 ? '#E6C27A' : 'rgba(255,255,255,.14)'}"/><rect x="24" y="54" width="170" height="10" rx="5" fill="rgba(255,255,255,.1)"/><rect x="24" y="76" width="130" height="10" rx="5" fill="rgba(255,255,255,.08)"/>${i === 2 ? '<circle cx="214" cy="106" r="14" fill="#3DDC97"/>' : ''}</g>`).join(''),
  chart: r => { const pts = Array.from({ length: 7 }, (_, i) => [50 + i * 54, 300 - (40 + i * 28 + r() * 40)]); return `<g stroke="rgba(255,255,255,.07)">${[120, 200, 280, 340].map(y => `<path d="M40 ${y} H380"/>`).join('')}</g>${pts.map(([x, y], i) => `<rect x="${x - 14}" y="${y + 20}" width="28" height="${340 - y - 20}" rx="7" fill="${i === pts.length - 1 ? '#3DDC97' : 'rgba(110,155,255,.35)'}"/>`).join('')}<path d="${pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')}" fill="none" stroke="#E6C27A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#060A14" stroke="#E6C27A" stroke-width="3"/>`).join('')}` },
  doc: () => `<rect x="110" y="50" width="210" height="290" rx="22" fill="#0F1729" stroke="rgba(255,255,255,.18)" stroke-width="2.5"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="140" y="${92 + i * 34}" width="${[150, 120, 140, 100, 135, 90][i]}" height="11" rx="5.5" fill="${i === 0 ? '#E6C27A' : 'rgba(255,255,255,.12)'}"/>`).join('')}<circle cx="300" cy="320" r="52" fill="#060A14" stroke="#6E9BFF" stroke-width="4"/><path d="M278 320 L294 336 L324 304" fill="none" stroke="#3DDC97" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
  globe: () => `<circle cx="210" cy="210" r="150" fill="rgba(110,155,255,.06)" stroke="#6E9BFF" stroke-width="3"/><ellipse cx="210" cy="210" rx="70" ry="150" fill="none" stroke="rgba(110,155,255,.4)" stroke-width="2"/><path d="M60 210 H360 M80 140 H340 M80 280 H340" stroke="rgba(110,155,255,.3)" stroke-width="2"/>${[[150, 130, '#3DDC97'], [280, 170, '#E6C27A'], [190, 290, '#3DDC97'], [300, 260, '#6E9BFF']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="11" fill="${c}"/><circle cx="${x}" cy="${y}" r="22" fill="none" stroke="${c}" stroke-opacity=".35" stroke-width="2"/>`).join('')}<path d="M150 130 Q 220 100 280 170 Q 260 240 190 290" fill="none" stroke="#3DDC97" stroke-width="3" stroke-dasharray="8 8"/>`,
  card: () => `<g transform="rotate(-8 210 210)"><rect x="60" y="110" width="300" height="190" rx="24" fill="#131D36" stroke="#6E9BFF" stroke-width="3"/><rect x="92" y="150" width="54" height="40" rx="9" fill="#E6C27A"/><rect x="92" y="230" width="210" height="14" rx="7" fill="rgba(255,255,255,.18)"/><rect x="92" y="258" width="120" height="12" rx="6" fill="rgba(255,255,255,.1)"/><circle cx="300" cy="170" r="22" fill="#3DDC97" fill-opacity=".85"/><circle cx="324" cy="170" r="22" fill="#6E9BFF" fill-opacity=".7"/></g>`,
};
function motifFor(p) {
  const s = `${p.category} ${p.primaryKeyword || ''} ${(p.keywords || []).join(' ')} ${p.title}`.toLowerCase();
  if (p.motif && MOTIFS[p.motif]) return p.motif;
  if (/orchestrat|routing|cascad|failover|connect/.test(s)) return 'routing';
  if (/risk|fraud|chargeback|3ds|security|pci|aml|kyc/.test(s)) return 'shield';
  if (/white.label|platform|saas|tenant|payfac|build/.test(s)) return 'layers';
  if (/compliance|regulat|licen|psd2|rbi|guideline|underwrit/.test(s)) return 'doc';
  if (/approval|analytics|rate|cost|fee|interchange|data/.test(s)) return 'chart';
  if (/cross.border|global|currency|fx|international|india|uk|europe|us\b|asia/.test(s)) return 'globe';
  return 'card';
}

function html(p) {
  const r = rng(hash(p.slug || p.title));
  const blob = (c, a) => `radial-gradient(circle at ${20 + r() * 60}% ${10 + r() * 80}%, ${c} 0, transparent ${a}%)`;
  const t = p.title.length > 78 ? 50 : p.title.length > 56 ? 56 : 62;
  return `<!doctype html><html><head><style>${FONTS}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;overflow:hidden;font-family:Inter,'DejaVu Sans',sans-serif;color:#F4F7FC;
background:${blob('rgba(110,155,255,.28)', 38)},${blob('rgba(61,220,151,.16)', 30)},${blob('rgba(230,194,122,.12)', 26)},#060A14}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:60px 60px;-webkit-mask-image:radial-gradient(ellipse 80% 80% at 70% 50%,#000,transparent 85%)}
.l{position:absolute;left:72px;top:64px;bottom:64px;width:640px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:14px;font-weight:600;font-size:26px;letter-spacing:-.01em}.brand svg{width:52px;height:52px}
.cat{margin-top:52px;font-family:'DejaVu Sans Mono',monospace;font-size:17px;letter-spacing:.18em;text-transform:uppercase;color:#6E9BFF;display:flex;align-items:center;gap:12px}
.cat i{width:9px;height:9px;border-radius:50%;background:#3DDC97;display:block}
h1{margin-top:22px;font-weight:700;font-size:${t}px;line-height:1.06;letter-spacing:-.03em;text-wrap:balance}
.foot{margin-top:auto;display:flex;align-items:center;gap:14px;font-size:19px;color:#AEB9CC}
.chip{border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:7px 16px;color:#F4F7FC;font-weight:500}
.art{position:absolute;right:56px;top:105px;width:420px;height:420px}
.edge{position:absolute;inset:0;border:1px solid rgba(255,255,255,.06)}
</style></head><body><div class="grid"></div>
<svg class="art" viewBox="0 0 420 420">${MOTIFS[motifFor(p)](r)}</svg>
<div class="l"><div class="brand">${MARK}AQ Pay</div><div class="cat"><i></i>${esc(p.category)}</div><h1>${esc(p.title)}</h1>
<div class="foot">${p.market ? `<span class="chip">${esc(p.market)}</span>` : ''}<span>aqpay.services${p.slug ? '/blog' : ''}</span></div></div><div class="edge"></div></body></html>`;
}

function loadPosts() {
  if (!fs.existsSync(CONTENT)) return [];
  return fs.readdirSync(CONTENT).filter(f => f.endsWith('.md')).map(f => {
    const m = fs.readFileSync(path.join(CONTENT, f), 'utf8').match(/^---\s*\n([\s\S]*?)\n---/);
    const fm = JSON.parse(m[1]); fm.slug = fm.slug || f.replace(/\.md$/, ''); return fm;
  });
}

const jobs = [];
if (args.has('--site')) jobs.push({ out: path.join(ROOT, 'og-image.jpg'), p: { title: 'White-label payment gateway & payment orchestration', category: 'Payment infrastructure', market: 'PSPs · ISOs · Platforms · Merchants', motif: 'routing' } });
fs.mkdirSync(OUT, { recursive: true });
// The initial four articles keep their original cover treatment when rebuilt.
const legacySlugs = new Set([
  'what-is-payment-orchestration', 'white-label-payment-gateway-vs-building-your-own',
  'high-risk-merchant-account-underwriting', 'payment-facilitator-vs-iso',
]);
const artworkUsed = new Map();
for (const p of loadPosts()) {
  const out = path.join(OUT, `${p.slug}.jpg`);
  const source = path.join(CONTENT, 'covers', `${p.slug}.svg`);
  if (!fs.existsSync(source)) {
    if (!legacySlugs.has(p.slug)) throw new Error(`Create original artwork at content/blog/covers/${p.slug}.svg`);
    if (args.has('--all') || !fs.existsSync(out)) jobs.push({ out, p });
    continue;
  }
  const art = fs.readFileSync(source, 'utf8');
  const drawing = art.replace(/<(title|desc|text)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/\s+/g, '');
  if (artworkUsed.has(drawing)) throw new Error(`${p.slug} repeats the artwork for ${artworkUsed.get(drawing)}`);
  artworkUsed.set(drawing, p.slug);
  if (args.has('--all') || args.has(p.slug) || !fs.existsSync(out)) {
    jobs.push({ out, p, art });
  }
}
if (!jobs.length) { console.log('All covers up to date.'); process.exit(0); }
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const { out, p, art } of jobs) {
  if (art) {
    const image = 'data:image/svg+xml;base64,' + Buffer.from(art).toString('base64');
    await page.setContent(`<body style="margin:0"><img width="1200" height="630" src="${image}"></body>`);
    await page.locator('img').evaluate(img => img.decode());
  } else {
    await page.setContent(html(p), { waitUntil: 'load' });
  }
  await page.screenshot({ path: out, type: 'jpeg', quality: 86 });
  console.log('cover:', path.relative(ROOT, out));
}
await browser.close();
