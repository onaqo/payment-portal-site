// Both the static snapshot and the interactive homepage contain the same section.
export function homepageLayouts(home, articles) {
  const articlesBlock = /<!-- latest articles -->[\s\S]*?<!-- end latest articles -->/g;
  if (home.match(articlesBlock)?.length !== 2) throw new Error('Expected both homepage article sections');

  const section = `<!-- latest articles -->
<section id="latest-articles" class="wrap home-reading">
  <div class="reading-heading"><h2>Payment insights</h2><a href="/blog">View all articles <span aria-hidden="true">↗</span></a></div>
  <div class="reading-grid">${articles}</div>
  <div class="slide-controls" hidden><button type="button" data-slide="previous" aria-label="Previous article">←</button><button type="button" data-slide="pause">Pause slideshow</button><button type="button" data-slide="next" aria-label="Next article">→</button></div>
</section>
<!-- end latest articles -->`;
  const standard = home.replace(/<!-- services -->[\s\S]*?<!-- end services -->\n/g, '').replace(articlesBlock, () => section);
  const preview = standard.replace('content="index, follow,', 'content="noindex, follow,');
  const afterHero = /(?=<section [^>]*id="live-demo")/g;
  const services = `<!-- services --><section id="service-selector" class="wrap home-services">
<h2>What do you want to build?</h2>
<div class="service-options">
<a href="/white-label-gateway"><svg aria-hidden="true" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="30" height="25" rx="4"/><path d="M5 14h30"/><path class="gateway-pulse" d="M11 24h5l3-5 4 9 3-5h4"/></svg><strong>Launch a branded gateway</strong><span>Explore white-label infrastructure for your payment business.</span></a>
<a href="/payment-orchestration"><svg aria-hidden="true" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20h9l9-10h9M15 20l9 10h9"/><circle cx="6" cy="20" r="3"/><circle cx="34" cy="10" r="3"/><circle cx="34" cy="30" r="3"/><circle class="route-dot" cx="6" cy="20" r="2"/></svg><strong>Connect multiple processors</strong><span>Explore routing and payment orchestration.</span></a>
<a href="/merchant-services"><svg aria-hidden="true" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="33" height="24" rx="4"/><path d="M3 15h33M9 25h6"/><path class="paid-check" d="m21 24 4 4 6-8"/></svg><strong>Accept merchant payments</strong><span>Explore merchant services for your business.</span></a>
</div></section><!-- end services -->\n`;
  return {
    'index.html': standard.replace(afterHero, () => services),
    'home-services-preview.html': preview.replace(afterHero, () => services),
    'home-journal-preview.html': preview.replace(articlesBlock, '').replace(afterHero, () => section.replace('wrap home-reading', 'wrap home-reading reading-feature') + '\n'),
  };
}
