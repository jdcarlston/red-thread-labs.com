// Structured data: a block of JSON-LD in each page's <head> that tells search engines and AI tools
// what the page is, in a form they can read without guessing. It's built from the data the site
// already has; nothing here needs editing for a normal new page.
//
//   Every page        Red Thread Labs (Organization), JD (Person) and the website itself.
//   Blog posts        BlogPosting: headline, summary, date, author, image.
//   Library pages     Article: the idea, the people behind it, its sources (as citations), last updated.
//   About JD          ProfilePage about JD.
//   FAQ blocks        FAQPage, from any page whose rows include a `type: faq` block.
//   Offers            Service with a price, from a page that sets `offer:` in its _data/pages file.
//
// Check a page with Google's Rich Results Test or validator.schema.org.

// Markdown and HTML in the site's text, reduced to plain text for structured data.
function plain(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Every block on a data page (_data/pages/*.yml), across all its rows.
function blocksOf(pageData) {
  return ((pageData && pageData.rows) || []).flatMap((row) => row.blocks || []);
}

function structuredData(ctx, absolute, mediaUrl) {
  const site = ctx.site;
  const page = ctx.page;
  const org = { "@id": `${site.url}/#org` };
  const jd = { "@id": `${site.url}/about/jd/#jd` };
  const pageData = ctx.pageKey && ctx.pages ? ctx.pages[ctx.pageKey] : null;
  const image = ctx.shareImage;

  const graph = [
    {
      "@type": "Organization",
      ...org,
      name: site.name,
      url: site.url + "/",
      logo: absolute("/assets/img/apple-touch-icon.png"),
      description: site.tagline,
      email: site.email,
      telephone: site.phone || undefined,
      address: { "@type": "PostalAddress", addressLocality: "Salt Lake City", addressRegion: "UT", addressCountry: "US" },
      founder: jd,
      sameAs: [site.instagram, site.linkedin, site.facebook].filter(Boolean),
    },
    {
      "@type": "Person",
      ...jd,
      name: "JD Carlston",
      jobTitle: "Human Engineer",
      worksFor: org,
      url: `${site.url}/about/jd/`,
      sameAs: [site.linkedinPersonal, site.instagramPersonal, "https://jdcarlston.com", "https://maddercraft.com"].filter(Boolean),
    },
    { "@type": "WebSite", "@id": `${site.url}/#website`, name: site.name, url: site.url + "/", publisher: org },
  ];

  const url = absolute(page.url);
  const entry = ctx.entry && ctx.lineageVisible ? ctx.entry : null;

  if ((ctx.tags || []).includes("post")) {
    graph.push({
      "@type": "BlogPosting",
      headline: plain(ctx.title),
      description: plain(ctx.description),
      datePublished: page.date.toISOString().slice(0, 10),
      author: jd,
      publisher: org,
      image,
      url,
      mainEntityOfPage: url,
    });
  } else if (entry) {
    graph.push({
      "@type": "Article",
      headline: plain(entry.title),
      description: plain(entry.tagline),
      about: plain(entry.people),
      author: org,
      publisher: org,
      dateModified: entry.updated || undefined,
      image,
      url,
      mainEntityOfPage: url,
      isPartOf: { "@type": "CollectionPage", name: "Research Library", url: `${site.url}/library/about/` },
      citation: (entry.sources || []).map((s) => ({ "@type": "CreativeWork", name: plain(s.cite), url: s.url || undefined })),
    });
  } else if (page.url === "/about/jd/") {
    graph.push({ "@type": "ProfilePage", url, mainEntity: jd });
  }

  const faqs = blocksOf(pageData).filter((b) => b.type === "faq").flatMap((b) => b.items || []);
  if (faqs.length) {
    graph.push({
      "@type": "FAQPage",
      url,
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: plain(f.q),
        acceptedAnswer: { "@type": "Answer", text: plain(f.a) },
      })),
    });
  }

  if (pageData && pageData.offer) {
    const o = pageData.offer;
    graph.push({
      "@type": "Service",
      name: o.name || plain(pageData.title),
      description: plain(pageData.description),
      provider: org,
      areaServed: o.areaServed || "US",
      url,
      image,
      offers: { "@type": "Offer", price: String(o.price), priceCurrency: o.currency || "USD", url: o.url || url },
    });
  }

  // JSON.stringify drops the `undefined` values. "<" is escaped so the text can never close the <script> tag.
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

module.exports = { structuredData };
