# AQ Pay — marketing site

Static site, no build step. Pages are `*.html`; the shared header and footer are
`SiteNav.dc.html` and `SiteFooter.dc.html` (keep those two file names — the page
runtime in `support.js` loads them by name).

## Run locally
    npx serve .
Then open http://localhost:3000. (Opening the files directly with file:// won't work.)

## Deploy
- **Netlify:** Add new site → Import from Git → this repo. Build command: empty. Publish directory: `.`
- **Vercel:** Add New Project → import this repo → Framework preset "Other", no build command.

## Forms (Resend)
All three forms (homepage demo, Book a demo, Contact) POST to `/api/contact`, which emails
your team via Resend and sends the visitor a confirmation. The same code runs on both hosts:
`netlify/functions/contact.mjs` (Netlify) and `api/contact.js` (Vercel), sharing `lib/contact.mjs`.

1. In Resend, add and verify your sending domain (Domains → Add domain → add the DNS records).
2. Create an API key (API Keys → Create, "Sending access").
3. In Netlify or Vercel, add the environment variables from `.env.example`, then redeploy.

## Blog
Posts live in `content/blog/*.md` (JSON front matter + Markdown). Build:

    npm install
    node scripts/render-covers.mjs   # branded cover images
    node scripts/check-posts.mjs     # SEO/quality gate
    node scripts/build-blog.mjs      # blog pages, RSS, sitemap.xml

The 3x-weekly autopilot follows `AUTOMATION.md` and works through `content/keyword-plan.json`.

## SEO
Main pages are prerendered: full content, title, description, canonical, Open Graph,
Twitter cards and JSON-LD are in the HTML for every crawler. `robots.txt` and
`sitemap.xml` are at the root.
