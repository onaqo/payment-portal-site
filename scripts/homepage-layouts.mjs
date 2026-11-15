// Both the static snapshot and the interactive homepage contain the same section.
export function homepageLayouts(home, articles) {
  const articlesBlock = /<!-- latest articles -->[\s\S]*?<!-- end latest articles -->/g;
  if (home.match(articlesBlock)?.length !== 2) throw new Error('Expected both homepage article sections');

  const section = `<!-- latest articles -->
<section id="latest-articles" class="wrap home-reading">
  <div class="reading-heading"><h2>Latest payment guides</h2><a href="/blog">View all articles <span aria-hidden="true">↗</span></a></div>
  <div class="reading-grid">${articles}</div>
</section>
<!-- end latest articles -->`;
  const standard = home.replace(articlesBlock, () => section);
  const preview = standard.replace('content="index, follow,', 'content="noindex, follow,');
  const afterHero = /(?=<section [^>]*id="live-demo")/g;
  const services = `<section id="service-selector" class="wrap home-services">
<h2>What do you want to build?</h2>
<div class="service-options">
<a href="/white-label-gateway"><strong>Launch a branded gateway</strong><span>Explore white-label infrastructure for your payment business.</span></a>
<a href="/payment-orchestration"><strong>Connect multiple processors</strong><span>Explore routing and payment orchestration.</span></a>
<a href="/merchant-services"><strong>Accept merchant payments</strong><span>Explore merchant services for your business.</span></a>
</div></section>\n`;
  return {
    'index.html': standard,
    'home-services-preview.html': preview.replace(afterHero, () => services),
    'home-journal-preview.html': preview.replace(articlesBlock, '').replace(afterHero, () => section.replace('wrap home-reading', 'wrap home-reading reading-feature') + '\n'),
  };
}
