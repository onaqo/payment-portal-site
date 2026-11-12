#!/usr/bin/env node
// Quality gate for blog posts. Exits non-zero if any post breaks an SEO or content rule.
//   node scripts/check-posts.mjs            -> check all posts
//   node scripts/check-posts.mjs <slug>     -> check one post
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'content/blog');
const only = process.argv[2];
const PAGES = new Set(['/', '/white-label-gateway', '/payment-orchestration', '/merchant-services', '/high-risk-processing', '/industries', '/developers', '/api-reference', '/partner-program', '/about', '/book-a-demo', '/blog', '/privacy', '/terms', '/cookies', '/acceptable-use', '/licences']);
const slugs = new Set(fs.readdirSync(DIR).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')));
const BANNED = [/we guarantee (approval|acceptance)/i, /100% approval/i, /\bbest in the world\b/i, /#1 /, /lorem ipsum/i, /\[citation needed\]/i, /as an ai\b/i, /\bTODO\b/];
let failed = 0;

for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.md'))) {
  const slug = f.replace(/\.md$/, ''); if (only && slug !== only) continue;
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8'); const errs = []; const warns = [];
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) { console.log(`✗ ${f}: no front matter`); failed++; continue; }
  let fm; try { fm = JSON.parse(m[1]); } catch (e) { console.log(`✗ ${f}: front matter JSON invalid — ${e.message}`); failed++; continue; }
  const body = m[2]; const text = body.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ');
  const extra = [...(fm.takeaways || []), ...(fm.faq || []).flatMap(q => [q.q, q.a])].join(' ');
  const words = (text + ' ' + extra).split(/\s+/).filter(Boolean).length;
  const kw = (fm.primaryKeyword || '').toLowerCase();
  if ((fm.slug || slug) !== slug) errs.push(`slug "${fm.slug}" must match file name "${slug}"`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errs.push('slug must be lowercase-hyphenated');
  for (const k of ['title', 'seoTitle', 'description', 'date', 'category', 'market', 'primaryKeyword', 'keywords', 'coverAlt', 'takeaways', 'faq']) if (!fm[k] || (Array.isArray(fm[k]) && !fm[k].length)) errs.push(`missing "${k}"`);
  if (fm.seoTitle && fm.seoTitle.length > 52) errs.push(`seoTitle is ${fm.seoTitle.length} chars (max 52 — " | AQ Pay" is appended)`);
  if (fm.description && (fm.description.length < 120 || fm.description.length > 155)) errs.push(`description is ${fm.description.length} chars (want 120–155)`);
  if (fm.date && !/^\d{4}-\d{2}-\d{2}$/.test(fm.date)) errs.push('date must be YYYY-MM-DD');
  if (!['Global', 'UK & Europe', 'US', 'India & Asia'].includes(fm.market)) errs.push('market must be one of: Global, UK & Europe, US, India & Asia');
  if (!['Guides', 'Explainers', 'Compliance', 'Industry'].includes(fm.category)) errs.push('category must be one of: Guides, Explainers, Compliance, Industry');
  if (kw && !fm.title.toLowerCase().includes(kw.split(' ')[0])) warns.push('primary keyword not visible in title');
  if (kw && !(fm.seoTitle || '').toLowerCase().includes(kw.split(' ').slice(0, 2).join(' '))) warns.push('primary keyword not in seoTitle');
  if (kw && !fm.description.toLowerCase().includes(kw.split(' ').slice(0, 2).join(' '))) warns.push('primary keyword not in description');
  if (kw && !text.slice(0, 900).toLowerCase().includes(kw)) errs.push('primary keyword must appear in the first ~150 words');
  if (words < 1100) errs.push(`only ${words} words (min 1100)`);
  if (words > 2600) warns.push(`${words} words — consider tightening`);
  const h2 = (body.match(/^## /gm) || []).length; if (h2 < 4) errs.push(`only ${h2} H2 sections (min 4)`);
  if (/^# /m.test(body)) errs.push('do not use a "# " H1 in the body — the title is the H1');
  if (!/<figure>[\s\S]*?<svg[\s\S]*?<\/svg>[\s\S]*?<figcaption>/.test(body)) errs.push('needs at least one <figure> with an inline <svg> diagram and <figcaption>');
  for (const s of body.match(/<svg[^>]*>/g) || []) if (!/aria-label=/.test(s) || !/role="img"/.test(s)) errs.push('every <svg> needs role="img" and aria-label');
  if (/<figure>[\s\S]*?\n\s*\n[\s\S]*?<\/figure>/.test(body)) errs.push('no blank lines allowed inside <figure> (breaks Markdown)');
  const links = [...body.matchAll(/\]\((\/[^)\s#]*)(#[^)]*)?\)/g)].map(x => x[1] || '/');
  const internal = links.filter(l => PAGES.has(l) || (l.startsWith('/blog/') && slugs.has(l.slice(6))));
  const broken = links.filter(l => !(PAGES.has(l) || (l.startsWith('/blog/') && slugs.has(l.slice(6)))));
  if (broken.length) errs.push(`broken internal links: ${broken.join(', ')}`);
  if (new Set(internal).size < 4) errs.push(`only ${new Set(internal).size} distinct internal links (min 4)`);
  const SERVICE = ['/white-label-gateway', '/payment-orchestration', '/merchant-services', '/high-risk-processing', '/industries', '/developers', '/api-reference', '/partner-program'];
  if (!links.some(l => SERVICE.includes(l))) errs.push('link to at least one service page');
  const generic = [...body.matchAll(/\[([^\]]+)\]\(\/[^)]*\)/g)].map(x => x[1].trim().toLowerCase()).filter(a => /^(click here|read more|here|this page|learn more|link)$/.test(a));
  if (generic.length) errs.push(`generic anchor text on internal links: ${[...new Set(generic)].join(', ')}`);
  if (!links.some(l => l.startsWith('/blog/')) && slugs.size > 1) errs.push('link to at least one other blog post');
  if (!links.includes('/book-a-demo')) warns.push('no link to /book-a-demo');
  const ext = [...body.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map(x => x[1]);
  if (ext.length < 1) warns.push('no external authoritative source linked');
  if ((fm.faq || []).length < 3) errs.push('FAQ needs 3–5 questions');
  if ((fm.takeaways || []).length < 3) errs.push('needs 3–4 takeaways');
  for (const re of BANNED) if (re.test(raw)) errs.push(`banned phrase: ${re}`);
  if (!fs.existsSync(path.join(ROOT, 'blog/covers', `${slug}.jpg`))) warns.push('cover image not rendered yet (run node scripts/render-covers.mjs)');
  const dens = kw ? (text.toLowerCase().split(kw).length - 1) / Math.max(1, words) * 100 : 0;
  if (dens > 2.5) errs.push(`primary keyword density ${dens.toFixed(1)}% — keyword stuffing`);
  console.log(`${errs.length ? '✗' : '✓'} ${slug} — ${words} words, ${h2} sections, ${new Set(internal).size} internal links, ${ext.length} external`);
  errs.forEach(e => console.log('   ERROR', e)); warns.forEach(w => console.log('   warn ', w));
  if (errs.length) failed++;
}
process.exit(failed ? 1 : 0);
