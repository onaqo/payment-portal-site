#!/usr/bin/env node
// Builds the AQ Pay blog from content/blog/*.md into static, SEO-ready HTML.
//   node scripts/build-blog.mjs
// Outputs: blog/index.html, blog/<slug>.html, blog/category/<cat>.html, blog/rss.xml, sitemap.xml
// Post format: a JSON front-matter block between --- lines, then Markdown (inline HTML/SVG allowed).
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.aqpay.services';
// Feed readers use the original URL namespace to recognise previously seen articles.
const FEED_ID_ORIGIN = 'https://aqpay.services';
const BRAND = 'AQ Pay';
const CONTENT = path.join(ROOT, 'content/blog');
const OUT = path.join(ROOT, 'blog');
const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_PAGES = ['/', '/white-label-gateway', '/payment-orchestration', '/merchant-services', '/high-risk-processing',
  '/industries', '/developers', '/api-reference', '/partner-program', '/about', '/book-a-demo', '/apply', '/apply-white-label'];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slugify = s => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
const fmtDate = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// ---------- load posts ----------
function load() {
  if (!fs.existsSync(CONTENT)) return [];
  return fs.readdirSync(CONTENT).filter(f => f.endsWith('.md')).map(f => {
    const raw = fs.readFileSync(path.join(CONTENT, f), 'utf8');
    const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!m) throw new Error(`${f}: missing --- JSON front matter ---`);
    let fm; try { fm = JSON.parse(m[1]); } catch (e) { throw new Error(`${f}: front matter is not valid JSON (${e.message})`); }
    const need = ['title', 'description', 'date', 'category'];
    for (const k of need) if (!fm[k]) throw new Error(`${f}: front matter needs "${k}"`);
    fm.slug = fm.slug || slugify(fm.title);
    fm.seoTitle = fm.seoTitle || fm.title;
    fm.updated = fm.updated || fm.date;
    fm.body = m[2];
    fm.file = f;
    return fm;
  }).filter(p => !p.draft && p.date <= TODAY).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

// ---------- markdown ----------
function render(md) {
  const toc = []; const used = new Set();
  const renderer = new marked.Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const plain = text.replace(/<[^>]+>/g, '');
    let id = slugify(plain) || 'section'; while (used.has(id)) id += '-2'; used.add(id);
    if (depth === 2) toc.push({ id, text: plain });
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };
  renderer.link = function ({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const ext = /^https?:\/\//.test(href) && !href.startsWith(SITE);
    return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ''}${ext ? ' rel="noopener" target="_blank"' : ''}>${text}</a>`;
  };
  renderer.image = function ({ href, title, text }) {
    return `<img src="${esc(href)}" alt="${esc(text)}" loading="lazy" decoding="async"${title ? ` title="${esc(title)}"` : ''}>`;
  };
  const html = marked.parse(md, { renderer, gfm: true });
  const words = md.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return { html, toc, words, minutes: Math.max(3, Math.round(words / 225)) };
}

// Keep shared asset URLs in step with the versioned links on marketing pages.
const assetUrl = name => {
  const digest = createHash('md5').update(fs.readFileSync(path.join(ROOT, name))).digest('hex').slice(0, 8);
  return `/${name}?v=${digest}`;
};
const blogCss = assetUrl('blog/blog.css');
const fxCss = assetUrl('fx.css');
const fxScript = assetUrl('fx.js');

// ---------- shared chrome ----------
const head = ({ title, description, canonical, image, type = 'website', extra = '', jsonld = [] }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="theme-color" content="#060A14">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_GB">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${image}">
${extra}<link rel="icon" href="/aq-mark.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${BRAND} Blog" href="${SITE}/blog/rss.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${blogCss}">
<link rel="stylesheet" href="${fxCss}">
${canonical.startsWith(SITE + '/blog') ? `<link rel="stylesheet" href="${assetUrl('site.css')}">` : ''}
<style>.shared-nav{position:sticky;top:0;z-index:60;min-height:72px}.shared-nav x-dc{display:none}.shared-nav:has(#dc-root header) .nav-fallback{display:none}@media(max-width:959px){.nav-fallback nav{display:none!important}}</style>
<script defer src="${assetUrl('support.js')}"></script>
<script src="${fxScript}" data-fx defer></script>
${jsonld.map(ld).join('\n')}
</head>
<body>`;

// Embed the same navigation component used by the marketing pages. The article
// stays static while the runtime mounts only the interactive header.
const navSource = fs.readFileSync(path.join(ROOT, 'SiteNav.dc.html'), 'utf8');
const component = navSource.match(/<x-dc>[\s\S]*?<\/x-dc>/)[0];
const logic = navSource.match(/<script type="text\/x-dc"[\s\S]*?<\/script>/)[0];
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const fallback = home.match(/<header\b[\s\S]*?<\/header>/)[0];
const header = '<div class="shared-nav"><div class="nav-fallback">' + fallback.replaceAll('src="aq-mark.svg"', 'src="/aq-mark.svg"') + '</div>' + component + logic + '</div>';

const footer = () => `
<footer class="ftr"><div class="wrap">
  <div class="ftr-grid">
    <div><a class="brand" href="/" aria-label="AQ Pay home"><img src="/aq-pay-logo.svg" alt="" width="156" height="36" style="display:block;flex:none;width:156px;height:36px"></a>
      <p>White-label gateway, orchestration and merchant services infrastructure for PSPs, platforms and merchants.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="/book-a-demo" style="font-size:14px;padding:10px 18px">Book a Demo</a><a class="btn btn-ghost" href="https://portal.aqpay.services/" target="_blank" rel="noopener" style="font-size:14px">Portal login ↗</a></div></div>
    <nav aria-label="Solutions"><h3>Solutions</h3><ul><li><a href="/white-label-gateway">White-Label Gateway</a></li><li><a href="/merchant-services">Merchant Services</a></li><li><a href="/high-risk-processing">High-Risk Processing</a></li><li><a href="/payment-orchestration">Payment Orchestration</a></li><li><a href="/about#consulting">Payment Consulting</a></li><li><a href="/industries">Industries</a></li></ul></nav>
    <nav aria-label="Platform"><h3>Platform</h3><ul><li><a href="/payment-orchestration#routing">Intelligent Routing</a></li><li><a href="/payment-orchestration#connectivity">Gateway Connectivity</a></li><li><a href="/high-risk-processing#chargebacks">Risk &amp; Fraud</a></li><li><a href="/white-label-gateway#operations">Reconciliation</a></li><li><a href="/white-label-gateway#infrastructure">Security</a></li></ul></nav>
    <nav aria-label="Developers"><h3>Developers</h3><ul><li><a href="/developers">Overview</a></li><li><a href="/developers#quick-start">Quick Start</a></li><li><a href="/api-reference">API Reference</a></li><li><a href="/api-reference#webhooks">Webhooks</a></li><li><a href="/developers#sandbox">Sandbox</a></li></ul></nav>
    <nav aria-label="Company"><h3>Company</h3><ul><li><a href="/about">About</a></li><li><a href="/blog">Blog</a></li><li><a href="/partner-program">Partner Program</a></li><li><a href="/book-a-demo">Book a Demo</a></li><li><a href="/book-a-demo#contact">Contact</a></li><li><a href="mailto:hello@aqpay.services">hello@aqpay.services</a></li></ul></nav>
  </div>
  <div class="ftr-base"><span>Services are subject to industry eligibility, geographic restrictions, underwriting and partner approval. ${BRAND} is a technology provider and does not hold or move client funds unless expressly stated in a service agreement.</span>
    <div class="row"><span>© ${TODAY.slice(0, 4)} ${BRAND}. All rights reserved.</span><span style="display:flex;gap:18px"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/cookies">Cookies</a><a href="/licences">Licences</a><a href="/acceptable-use">Acceptable use</a></span></div></div>
</div></footer>
</body>
</html>
`;

const ORG = { '@type': 'Organization', '@id': `${SITE}/#organization`, name: BRAND, url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/aq-mark.svg` }, email: 'hello@aqpay.services' };
const coverUrl = p => assetUrl(`blog/covers/${p.slug}.jpg`);

const card = (p, h = 'h3', feature = false) => `<a class="card${feature ? ' feature' : ''}" href="/blog/${p.slug}">
  <img src="${coverUrl(p)}" alt="${esc(p.coverAlt || p.title)}" width="1200" height="630" loading="${feature ? 'eager' : 'lazy'}" decoding="async">
  <span class="body"><span class="mono cat">${esc(p.category)}${p.market && p.market !== 'Global' ? ' · ' + esc(p.market) : ''}</span><${h}>${esc(p.title)}</${h}><p>${esc(p.description)}</p>
  <span class="meta"><time datetime="${p.date}">${fmtDate(p.date)}</time><span>${p.minutes} min read</span></span></span></a>`;

// ---------- pages ----------
function postPage(p, all) {
  const url = `${SITE}/blog/${p.slug}`, img = `${SITE}${coverUrl(p)}`;
  const related = all.filter(x => x.slug !== p.slug).map(x => ({ x, s: (x.category === p.category ? 2 : 0) + (x.market === p.market ? 1 : 0) + (x.keywords || []).filter(k => (p.keywords || []).includes(k)).length }))
    .sort((a, b) => b.s - a.s || b.x.date.localeCompare(a.x.date)).slice(0, 3).map(r => r.x);
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, image: [img], datePublished: p.date, dateModified: p.updated,
      author: { '@type': 'Organization', name: `${BRAND} Payments Team`, url: `${SITE}/about` }, publisher: ORG, mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      articleSection: p.category, keywords: [p.primaryKeyword, ...(p.keywords || [])].filter(Boolean).join(', '), wordCount: p.words, inLanguage: 'en' },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: p.category, item: `${SITE}/blog/category/${slugify(p.category)}` }, { '@type': 'ListItem', position: 4, name: p.title, item: url }] },
  ];
  if (p.faq?.length) jsonld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  const extra = `<meta property="article:published_time" content="${p.date}T00:00:00Z">\n<meta property="article:modified_time" content="${p.updated}T00:00:00Z">\n<meta property="article:section" content="${esc(p.category)}">\n${(p.keywords || []).slice(0, 6).map(k => `<meta property="article:tag" content="${esc(k)}">`).join('\n')}\n`;
  return head({ title: `${p.seoTitle} | ${BRAND}`.length <= 65 ? `${p.seoTitle} | ${BRAND}` : p.seoTitle, description: p.description, canonical: url, image: img, type: 'article', extra, jsonld }) + header + `
<main>
<article>
<div class="article-hero"><div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog">Blog</a><span>/</span><a href="/blog/category/${slugify(p.category)}">${esc(p.category)}</a></nav>
  <h1>${esc(p.title)}</h1>
  <p class="lede">${esc(p.description)}</p>
  <div class="byline"><img src="/aq-mark.svg" alt="" width="28" height="28"><span>${BRAND} Payments Team</span>${p.reviewer?.name && p.reviewer?.role ? `<span>·</span><span>Reviewed by ${esc(p.reviewer.name)}, ${esc(p.reviewer.role)}</span>` : ''}<span>·</span><time datetime="${p.date}">${fmtDate(p.date)}</time>${p.updated !== p.date ? `<span>· Updated <time datetime="${p.updated}">${fmtDate(p.updated)}</time></span>` : ''}<span>·</span><span>${p.minutes} min read</span></div>
  <div class="cover"><img src="${coverUrl(p)}" alt="${esc(p.coverAlt || p.title)}" width="1200" height="630" fetchpriority="high"></div>
</div></div>
<div class="article"><div class="wrap"><div class="layout">
  <div class="prose">
    ${p.takeaways?.length ? `<aside class="takeaways"><h2>Key takeaways</h2><ul>${p.takeaways.map(t => `<li>${esc(t)}</li>`).join('')}</ul></aside>` : ''}
    ${p.html}
    ${p.faq?.length ? `<section class="faq" aria-labelledby="faq"><h2 id="faq">Frequently asked questions</h2>${p.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>` : ''}
    <section class="cta"><div><h2>${esc(p.ctaTitle || 'See it on your own use case')}</h2><p>${esc(p.ctaText || 'A 45-minute working session with the team that runs AQ Pay — no scripted pitch.')}</p></div><a class="btn" href="/book-a-demo">Book a Demo</a></section>
    <div class="author"><img src="/aq-mark.svg" alt="" width="44" height="44"><div><strong>${BRAND} Payments Team</strong>The engineers and payment specialists who build and operate AQ Pay's gateway and orchestration platform.</div></div>
  </div>
  <aside class="toc" aria-label="On this page"><span class="mono" style="color:var(--faint)">On this page</span><ol>${p.toc.map(t => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}${p.faq?.length ? '<li><a href="#faq">FAQ</a></li>' : ''}</ol><a class="btn" href="/book-a-demo">Book a Demo</a></aside>
</div></div></div>
</article>
${related.length ? `<section class="related"><div class="wrap"><h2>Keep reading</h2><div class="grid">${related.map(r => card(r)).join('')}</div></div></section>` : ''}
</main>` + footer();
}

function listPage({ posts, title, h1, lede, canonical, cats, active }) {
  const jsonld = [{ '@context': 'https://schema.org', '@type': 'Blog', name: `${BRAND} Blog`, url: `${SITE}/blog`, publisher: ORG,
    blogPost: posts.slice(0, 20).map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}`, datePublished: p.date, image: `${SITE}${coverUrl(p)}` })) },
  { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
    ...(active ? [{ '@type': 'ListItem', position: 3, name: active, item: canonical }] : [])] }];
  return head({ title, description: lede, canonical, image: posts[0] ? `${SITE}${coverUrl(posts[0])}` : `${SITE}/og-image.jpg`, jsonld }) + header + `
<main>
<section class="hero"><div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>${active ? `<a href="/blog">Blog</a><span>/</span><span aria-current="page">${esc(active)}</span>` : '<span aria-current="page">Blog</span>'}</nav>
  <h1>${esc(h1)}</h1><p class="lede">${esc(lede)}</p>
  <nav class="chips" aria-label="Categories"><a class="chip" href="/blog"${!active ? ' aria-current="page"' : ''}>All</a>${cats.map(c => `<a class="chip" href="/blog/category/${slugify(c)}"${c === active ? ' aria-current="page"' : ''}>${esc(c)}</a>`).join('')}</nav>
</div></section>
<section class="wrap"><div class="grid">${posts.length ? posts.map((p, i) => card(p, 'h2', i === 0 && !active)).join('') : '<p class="lede">New articles are on the way.</p>'}</div></section>
</main>` + footer();
}

// ---------- build ----------
const posts = load();
for (const p of posts) Object.assign(p, render(p.body));
const missing = posts.filter(p => !fs.existsSync(path.join(OUT, 'covers', `${p.slug}.jpg`)));
if (missing.length) console.warn(`! missing cover images (run: node scripts/render-covers.mjs): ${missing.map(p => p.slug).join(', ')}`);

fs.mkdirSync(path.join(OUT, 'category'), { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.rmSync(path.join(OUT, f));
for (const f of fs.readdirSync(path.join(OUT, 'category'))) fs.rmSync(path.join(OUT, 'category', f));

for (const p of posts) fs.writeFileSync(path.join(OUT, `${p.slug}.html`), postPage(p, posts));
const cats = [...new Set(posts.map(p => p.category))].sort();
fs.writeFileSync(path.join(OUT, 'index.html'), listPage({ posts, cats, title: `Payments Blog — Gateways, Orchestration & Risk | ${BRAND}`, h1: 'The AQ Pay payments blog',
  lede: 'Practical guides on white-label payment gateways, payment orchestration, high-risk processing, compliance and merchant services — from the team that runs the infrastructure.', canonical: `${SITE}/blog` }));
for (const c of cats) fs.writeFileSync(path.join(OUT, 'category', `${slugify(c)}.html`), listPage({ posts: posts.filter(p => p.category === c), cats, active: c,
  title: `${c} — Payments Blog | ${BRAND}`, h1: c, lede: `${c} from the ${BRAND} blog: payment gateways, orchestration, risk and merchant services explained.`, canonical: `${SITE}/blog/category/${slugify(c)}` }));

// Legal / policy pages (content/legal/*.md -> /<slug>.html)
const LEGAL_DIR = path.join(ROOT, 'content/legal'); const legal = [];
if (fs.existsSync(LEGAL_DIR)) for (const f of fs.readdirSync(LEGAL_DIR).filter(f => f.endsWith('.md'))) {
  const raw = fs.readFileSync(path.join(LEGAL_DIR, f), 'utf8'); const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/); const fm = JSON.parse(m[1]); const r = render(m[2]); legal.push(fm);
  const url = `${SITE}/${fm.slug}`;
  fs.writeFileSync(path.join(ROOT, `${fm.slug}.html`), head({ title: `${fm.title} | ${BRAND}`, description: fm.description, canonical: url, image: `${SITE}/og-image.jpg`,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'WebPage', name: fm.title, description: fm.description, url, dateModified: fm.updated, publisher: ORG },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: fm.title, item: url }] }] }) + header + `
<main>
<div class="article-hero"><div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span aria-current="page">Legal</span></nav>
  <h1>${esc(fm.title)}</h1>
  <p class="lede">${esc(fm.description)}</p>
  <div class="byline"><span>Last updated <time datetime="${fm.updated}">${fmtDate(fm.updated)}</time></span></div>
</div></div>
<div class="article"><div class="wrap"><div class="layout">
  <div class="prose">${r.html}</div>
  <aside class="toc" aria-label="On this page"><span class="mono" style="color:var(--faint)">Legal</span><ol>${[['privacy', 'Privacy Policy'], ['terms', 'Terms of Use'], ['cookies', 'Cookie Policy'], ['acceptable-use', 'Acceptable Use Policy'], ['licences', 'Open-Source Licences']].map(([s, n]) => `<li><a href="/${s}"${s === fm.slug ? ' style="color:var(--fg);font-weight:600"' : ''}>${n}</a></li>`).join('')}</ol><span class="mono" style="color:var(--faint);display:block;margin-top:18px">On this page</span><ol>${r.toc.map(x => `<li><a href="#${x.id}">${esc(x.text)}</a></li>`).join('')}</ol></aside>
</div></div></div>
</main>` + footer());
}

// RSS
fs.writeFileSync(path.join(OUT, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${BRAND} Blog</title><link>${SITE}/blog</link><description>Payment gateways, orchestration, risk and merchant services.</description><language>en</language>
<atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${posts.slice(0, 30).map(p => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${p.slug}</link><guid>${FEED_ID_ORIGIN}/blog/${p.slug}</guid><pubDate>${new Date(p.date + 'T08:00:00Z').toUTCString()}</pubDate><category>${esc(p.category)}</category><description>${esc(p.description)}</description></item>`).join('\n')}
</channel></rss>
`);

// Sitemap (whole site)
const urls = [
  ...STATIC_PAGES.map(u => ({ loc: SITE + u, pri: u === '/' ? '1.0' : '0.8' })),
  { loc: `${SITE}/blog`, lastmod: posts[0]?.updated || TODAY, pri: '0.8' },
  ...cats.map(c => ({ loc: `${SITE}/blog/category/${slugify(c)}`, lastmod: posts.find(p => p.category === c)?.updated, pri: '0.5' })),
  ...posts.map(p => ({ loc: `${SITE}/blog/${p.slug}`, lastmod: p.updated, pri: '0.7', img: `${SITE}${coverUrl(p)}` })),
  ...legal.map(l => ({ loc: `${SITE}/${l.slug}`, lastmod: l.updated, pri: '0.3' })),
];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.pri}</priority>${u.img ? `<image:image><image:loc>${u.img}</image:loc></image:image>` : ''}</url>`).join('\n')}
</urlset>
`);
console.log(`Built ${legal.length} legal pages, ${posts.length} posts, ${cats.length} categories, sitemap with ${urls.length} URLs.`);
