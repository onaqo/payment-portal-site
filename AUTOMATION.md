# AQ Pay blog autopilot — playbook

This file is the complete instruction set for the scheduled run that publishes one blog post
**every day**. Follow it top to bottom. Never skip the quality gate.

## 0. Setup (every run)

```bash
git clone https://github.com/onaqo/payment-portal-site.git aqpay && cd aqpay
npm ci --no-audit --no-fund
# On machines with Google Chrome installed, including the publishing Mac:
export PLAYWRIGHT_CHANNEL=chrome
# Otherwise use npx playwright install chromium and leave PLAYWRIGHT_CHANNEL unset.
```

Work only inside this repository. Do not change anything outside `content/`, `blog/`, `sitemap.xml`
and `content/keyword-plan.json` unless a step below says so.

## 1. Pick the topic

1. Open `content/keyword-plan.json`. Take the **first** topic with `"status": "todo"` whose `market`
   differs from the market of the most recently published post. If none qualifies, take the first `todo`.
2. If fewer than 10 `todo` topics remain, append 10 new ones (same fields) based on live research:
   what PSPs, ISOs, platforms and merchants in Global / UK & Europe / US / India & Asia are searching for
   about payment gateways, orchestration, high-risk processing, compliance and merchant services.
   Never duplicate an existing `primaryKeyword` or a published slug.

## 2. Research (mandatory)

- Search the live web for the primary keyword. Read the top-ranking pages to understand search intent,
  the questions they answer and what they miss. Our post must be more useful, not longer for its own sake.
- Verify every fact, regulation, threshold, date or number against an **authoritative primary source**
  (card schemes, regulators such as the RBI, FCA, EBA or CFPB, PCI SSC, EMVCo, official provider docs).
  If you can't verify a figure, leave it out. Never invent statistics, studies, customers, quotes or case studies.
- Note 1–3 authoritative URLs to cite in the post.

## 3. Write the post

Create `content/blog/<slug>.md`. The slug is the primary keyword, lowercase-hyphenated, ≤ 6 words.
Start with a JSON front-matter block exactly like the existing posts:

```json
{
  "title": "Human, compelling H1 that contains the primary keyword",
  "seoTitle": "≤ 52 chars, primary keyword near the start",
  "description": "120–155 chars, contains the primary keyword, states the benefit",
  "slug": "the-slug",
  "date": "YYYY-MM-DD (today, UTC)",
  "category": "Guides | Explainers | Compliance | Industry",
  "market": "Global | UK & Europe | US | India & Asia",
  "primaryKeyword": "...",
  "keywords": ["4–6 closely related secondary keywords"],
  "coverAlt": "Describes the cover illustration in words",
  "takeaways": ["3–4 one-sentence takeaways"],
  "faq": [{ "q": "Real question people search", "a": "2–3 sentence direct answer" }]
}
```

Body rules (Markdown; inline HTML allowed):

- **1,100–2,000 words** total on the page, written for decision-makers at PSPs, ISOs, platforms and merchants.
  Plain English, British spelling, confident and practical, no hype. Short paragraphs.
- Primary keyword in the first 100 words, in at least one `##` heading, and used naturally (density under 2%).
  Use secondary keywords and natural variations in headings and body. Never keyword-stuff.
- **No `# ` H1** in the body (the title is the H1). At least **4 `##` sections**; use `###` for sub-points.
- At least one **comparison table** or numbered checklist when the topic allows.
- **Exactly one or two diagrams**: a `<figure>` containing an inline `<svg role="img" aria-label="...">`
  and a `<figcaption>`. Use the brand palette only: background `#0F1729`, blue `#6E9BFF`, green `#3DDC97`,
  gold `#E6C27A`, text `#F4F7FC` / `#AEB9CC`, font `Inter, sans-serif`, `viewBox` width 760.
  **No blank lines inside the `<figure>`.** Look at the existing posts for the style.
- **Internal links (min 4 distinct):** every post must send readers and search engines back to the money pages.
  - The topic's `linkTo` service page, linked in the first 300 words, with anchor text that is that page's
    target keyword or a close natural variation (for example "white-label payment gateway",
    "payment orchestration platform", "high-risk merchant account", "merchant services").
  - A second, different service or product page where it genuinely helps the reader
    (`/white-label-gateway`, `/payment-orchestration`, `/merchant-services`, `/high-risk-processing`,
    `/industries`, `/developers`, `/api-reference`, `/partner-program`).
  - At least one other published blog post, and `/book-a-demo`.
  - Anchor text must describe the destination. Never use "click here", "read more", "this page" or a bare URL,
    and never repeat the exact same anchor text for the same page more than twice in one post.
  - Only link to pages that exist (see `scripts/check-posts.mjs` for the list).
- **External links (1–3):** the authoritative sources from your research.
- Honesty rules: AQ Pay is a technology provider that does not hold client funds by default; acquirers decide
  approvals; never promise approval, rankings, approval-rate uplifts or savings; don't name or disparage competitors;
  no legal or financial advice — say "check with your acquirer / adviser / regulator" where appropriate.
- End with a short practical "next step" paragraph pointing to the relevant service page and `/book-a-demo`.
- Do not repeat a topic or angle already covered by a published post; one post per day means each must add something new.

When an actual reviewer has confirmed the article, record their supplied name and relevant role in the optional `reviewer` object. Leave it absent without that confirmation. Link to the routing worksheet where relevant. When an article introduces another reusable worksheet, keep its downloadable CSV in `blog/resources/` and link to it from the article.

## 4. Build, check, fix

Compose a new 1200 × 630 cover at `content/blog/covers/<slug>.svg`. Use the existing covers’ dark navy background, light lettering and blue, green or gold accents. Base the illustration on a concrete example from this article. Compare the finished thumbnail with the existing covers, especially others in the same topic cluster. If the central illustration or composition repeats one already published, design a different scene before publishing. Update `coverAlt` to describe the actual art.

```bash
node scripts/render-covers.mjs      # branded 1200x630 cover → blog/covers/<slug>.jpg
node scripts/check-posts.mjs <slug> # quality gate — must print ✓ with no ERROR lines
node scripts/build-blog.mjs         # blog pages, categories, RSS, sitemap.xml
```

If the checker reports errors, fix the post and run it again. Also fix warnings where reasonable.
Then look at the cover image (Read `blog/covers/<slug>.jpg`) to confirm the title isn't clipped.

## 5. Update the plan and publish

1. In `content/keyword-plan.json`, set the topic's `status` to `"published"`, and fill `slug` and `date`.
2. Commit and push:

```bash
git add -- content/blog content/keyword-plan.json blog sitemap.xml
git -c user.name="AQ Pay Blog Bot" -c user.email="hello@aqpay.services" commit -m "Blog: <title>"
git push origin main
```

Vercel deploys automatically after the push. Verify that the public post, cover, blog index, RSS feed and sitemap contain the new post after deployment.

## 6. If anything fails

- If `git push` fails (authentication, rules), do **not** retry endlessly. Send the user a push notification
  explaining what failed and that the post is written but not published, then stop.
- If research can't verify the topic's core facts, mark the topic `"status": "skipped"` with a `"note"`,
  and write the next topic instead.
- Never publish a post that fails `check-posts.mjs`.

## 7. Report

Finish with a two-line summary: the post title, its URL (`https://www.aqpay.services/blog/<slug>`),
the primary keyword and market.
