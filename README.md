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

### Leads in the sales portal (optional)
Every enquiry can also be registered as a lead in the sales portal, with the source "Website", an owner, a task and
a notification for that person. The form handler sends it from the server, so the key is never in a page.

1. In the sales portal open **Settings → Website enquiries**, add this website and choose who receives enquiries.
2. Copy the address and the key it shows (the key is shown once) into `SALES_ENQUIRY_URL` and `SALES_ENQUIRY_KEY`
   in Vercel or Netlify, then redeploy.
3. Send a test enquiry from the site: it appears under **Latest enquiries** in the portal.

If the portal cannot be reached the form still works and the emails are still sent; the failure is in the function log.

## Visitor analytics

Every page reports its views to the sales portal, where they appear under **Web Analytics**: visitors, pages,
sources, countries, devices, who is on the site now, and which known leads visited.

- `fx.js` loads `track.js` on every page. `track.js` posts to `/api/t` (`api/t.js` on Vercel,
  `netlify/functions/t.mjs` on Netlify, both using `lib/track.mjs`), which passes the page view to the portal with
  the same two variables as the forms: `SALES_ENQUIRY_URL` and `SALES_ENQUIRY_KEY`. Nothing else needs to be set, and
  nothing is sent to anyone but your own portal. With the variables missing, nothing is recorded.
- No cookie is set. A visitor's address never reaches the portal: `/api/t` sends a one-way hash of it. Only after
  "Accept all" in the cookie banner does the browser keep a random id (`aq-vid`) so a return visit is recognised.
  Browsers that send Do Not Track or Global Privacy Control are not counted.
- Counting is switched on and off in the portal: **Settings → Website enquiries & chat → Edit** on this website.
- A page can report something a visitor did with `window.aqTrack('name')` (lower-case letters, digits, `_`, `-`,
  `:`). Sent forms, the "Book a demo" link, links to other sites, email and phone links and downloads are reported
  already.
- The forms and the chat send the same visitor reference with an enquiry, so the pages seen before it show on the
  lead in the portal.
- What is collected is described in `content/legal/cookies.md` and `content/legal/privacy.md`. Keep them in step with
  `track.js`. After editing them, run `node scripts/build-blog.mjs`. The build versions shared script and style links automatically.

To measure organic enquiries, use Search Console performance data for the www property and filter out AQ Pay brand queries. The site's analytics record article-to-service clicks as `article_to_<service>`. Successful demo requests and applications record `demo_form_submit`, `merchant_application_submit` or `white_label_application_submit`. Use sales-portal lead status to identify qualified enquiries. A form submission alone does not establish qualification.

## Chat (optional)
A chat box at the bottom right of every page. An AI assistant in the sales portal answers visitors from text your
team keeps there, and a visitor who leaves their details becomes a website lead with a summary of the conversation.

- It needs nothing new here: it uses `SALES_ENQUIRY_URL` and `SALES_ENQUIRY_KEY` from the section above.
- It is switched on and off in the portal: **Settings → Website enquiries & chat → Chat** on this website. While it
  is off, or the two variables are missing, no chat box is shown. A change shows on the site within a minute.
- `fx.js` loads `chat.js` on every page. `chat.js` asks `/api/chat` whether the chat is on and, if so, draws the box.
  `/api/chat` (`api/chat.js` on Vercel, `netlify/functions/chat.mjs` on Netlify, both using `lib/chat.mjs`) passes
  each message to the portal with the key, so the key never reaches a page.
- A visitor can press **Talk to a person**. The people chosen for this website in the portal are told and answer
  from the portal's Website Chats page; their messages appear in the same chat box (the page asks `/api/chat` every
  three seconds while a person is in the conversation or on the way). With nobody at the portal, or nobody joining
  within two minutes, the visitor is asked to leave their details instead. It can be switched off in the portal.
- Everything the visitor or the assistant writes is put on the page as plain text. The conversation is kept in the
  browser tab (session storage) so it follows the visitor from page to page, and in the portal for the sales team.
- The note under the chat tells visitors they are talking to an AI assistant and that messages are kept, and links
  to `/privacy`. Check that the privacy policy covers this before switching the chat on.

## Blog
Posts live in `content/blog/*.md` (JSON front matter + Markdown). Build:

    npm install
    node scripts/render-covers.mjs   # branded cover images
    node scripts/check-posts.mjs     # SEO/quality gate
    node scripts/build-blog.mjs      # blog pages, RSS, sitemap.xml

The daily autopilot follows `AUTOMATION.md` and works through `content/keyword-plan.json`.

## SEO
Main pages are prerendered: full content, title, description, canonical, Open Graph,
Twitter cards and JSON-LD are in the HTML for every crawler. `robots.txt` and
`sitemap.xml` are at the root.
