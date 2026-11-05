# The Payment Portal — marketing site

Static site, no build step. Pages are `*.html`; the shared header and footer are
`SiteNav.dc.html` and `SiteFooter.dc.html` (keep those two file names — the page
runtime in `support.js` loads them by name).

## Run locally
    npx serve .
Then open http://localhost:3000. (Opening the files directly with file:// won't work.)

## Deploy
- **Netlify:** Add new site → Import from Git → this repo. Build command: empty. Publish directory: `.`
  Form submissions (Book a demo, Contact, homepage demo) appear under Site → Forms.
- **Vercel:** Add New Project → import this repo → Framework preset "Other", no build command.
  (Forms only submit on Netlify; on Vercel wire them to a form service.)

## Still to fill in
- Real domain: replace `thepaymentportal.example` (canonical tags and contact emails).
