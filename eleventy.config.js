// Eleventy setup for red-thread-labs.com.
const { heroArtwork, menuThreads } = require("./lib/hero");
const { logoSvg } = require("./lib/logo");
const site = require("./_data/site");

// Research Library pages have a status:
//   published = reviewed by JD. Live, no marker.
//   review    = not reviewed yet. Live; marked "Draft" only in your preview, so visitors don't see it.
//   hidden    = not ready to show anyone. Only in your preview (npm start, or RTL_REVIEW=1).
const previewing = process.env.ELEVENTY_RUN_MODE === "serve";
const reviewMode = previewing || process.env.RTL_REVIEW === "1";

// Photos load from the Cloudflare media bucket on the live site. While previewing on your Mac
// they load from the media/ folder instead, so a new photo shows up before you've uploaded it.
// RTL_LOCAL_MEDIA=1 npm run build does the same for a one-off build (handy for testing).
const useBucket = site.media.useBucket && !previewing && process.env.RTL_LOCAL_MEDIA !== "1";

function visibleEntries() {
  const live = ["published", "review"];
  // Read the pages fresh each build, so an edit shows in the preview without restarting it.
  delete require.cache[require.resolve("./_data/lineage")];
  const lineage = require("./_data/lineage");
  return lineage.entries.filter((e) => live.includes(e.status) || (reviewMode && e.status === "hidden"));
}

module.exports = function (eleventyConfig) {
  // The site editor (/admin) can't open if admin/config.yml has a YAML mistake, and it only says
  // "can't be parsed". Check it here so the build stops and names the line instead.
  try {
    require("js-yaml").load(require("fs").readFileSync("admin/config.yml", "utf8"));
  } catch (err) {
    throw new Error(`admin/config.yml can't be read, so the site editor won't open:\n${err.message}`);
  }

  // private/ is in .gitignore, so it never reaches GitHub or the live site, but it should still
  // build in your preview. Eleventy skips git-ignored files by default; turn that off, and list
  // what it should skip in .eleventyignore instead.
  eleventyConfig.setUseGitIgnore(false);

  // Research Library entries live in research-roots/ (read by _data/lineage.js); rebuild when they change.
  eleventyConfig.addWatchTarget("./research-roots/");
  eleventyConfig.addPassthroughCopy("assets");
  // The site editor (Sveltia CMS) at /admin. Its settings are in admin/config.yml.
  eleventyConfig.addPassthroughCopy("admin");
  // Photos ship with the site only while the media bucket is off; once it's on they load from Cloudflare.
  if (!useBucket) eleventyConfig.addPassthroughCopy("media");
  // Files that must keep their old addresses: images already sent in emails and shared links,
  // and the old favicon. legacy/img/x.png is served at /img/x.png.
  eleventyConfig.addPassthroughCopy({ legacy: "/" });

  // {{ "img/roots-web.jpg" | media }} gives the right address for a file in media/, wherever it's served from.
  eleventyConfig.addFilter("media", (file) =>
    useBucket ? `${site.media.base}/${file}` : `/media/${file}`
  );
  eleventyConfig.addWatchTarget("lib/");

  eleventyConfig.addGlobalData("reviewMode", reviewMode);

  // ---------- Drafts: things JD hasn't reviewed yet ----------
  // A whole page:      draft: true in its front matter.
  // Part of a page:    {% draft %} ... {% enddraft %} around it.
  // A menu item:       draft: true on it in _data/site.js.
  // While previewing (npm start, or RTL_REVIEW=1) drafts show with a dashed "Draft" marker.
  // On the live site (npm run build, Netlify) they're left out entirely, so the site can go
  // live and each draft goes public when you delete its draft marker.
  eleventyConfig.addPreprocessor("drafts", "njk,md", (data) => {
    if (data.draft && !reviewMode) return false; // false = don't build this page
  });
  eleventyConfig.addPairedShortcode("draft", (content, note) =>
    reviewMode
      ? `<div class="draft-block"><p class="draft-badge">Draft · hidden on the live site${note ? ` · ${note}` : ""}</p>${content}</div>`
      : ""
  );
  // {{ page.date | longDate }} -> "May 14, 2026"
  eleventyConfig.addFilter("longDate", (d) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
  );
  // Data files can be YAML (like _data/jd.yml, which the site editor writes).
  eleventyConfig.addDataExtension("yml,yaml", (contents) => require("js-yaml").load(contents));
  // {{ text | md | safe }}: one paragraph of Markdown (links, *italic*, **bold**) as HTML, for words edited in /admin.
  // Links to other sites open in a new tab.
  const mdInline = require("markdown-it")({ html: true });
  const mdLinkOpen = mdInline.renderer.rules.link_open || ((t, i, o, e, self) => self.renderToken(t, i, o));
  mdInline.renderer.rules.link_open = (t, i, o, e, self) => {
    if (/^https?:/.test(t[i].attrGet("href"))) { t[i].attrSet("target", "_blank"); t[i].attrSet("rel", "noopener"); }
    return mdLinkOpen(t, i, o, e, self);
  };
  // In links, @booking means the Calendly link and @email the contact address (site.js), so they stay in one place.
  const siteLinks = (text) => String(text || "")
    .replace(/\]\(@booking\)/g, `](${site.bookingUrl})`)
    .replace(/\]\(@email/g, `](mailto:${site.email}`)
    // Practice Labs is still a draft, so on the live site its links go to the contact page.
    .replace(/\]\(\/practice-labs\/[^)]*\)/g, (m) => (reviewMode ? m : "](/contact/)"));
  eleventyConfig.addFilter("md", (text) => mdInline.renderInline(siteLinks(text)));
  eleventyConfig.addFilter("absoluteUrl", (path) => new URL(path, site.url).href);
  eleventyConfig.addGlobalData("year", new Date().getFullYear());
  eleventyConfig.addGlobalData("lineageVisible", visibleEntries);

  // Artwork, drawn at build time as plain SVG.
  eleventyConfig.addShortcode("heroArtwork", heroArtwork);
  eleventyConfig.addShortcode("menuThreads", menuThreads);
  eleventyConfig.addShortcode("logo", (variant, size) => logoSvg(variant, size));

  // Lineage helpers for templates.
  eleventyConfig.addFilter("inCluster", (entries, id) => entries.filter((e) => e.cluster === id));
  eleventyConfig.addFilter("clusterById", (clusters, id) => clusters.find((c) => c.id === id) || { title: "" });
  eleventyConfig.addFilter("entryBySlug", (entries, slug) => entries.find((e) => e.slug === slug));
  eleventyConfig.addFilter("clustersWithEntries", (clusters, entries) =>
    clusters.filter((c) => entries.some((e) => e.cluster === c.id))
  );
  // The words a page can be found by, in lowercase: its title, people, field, tagline, cluster and
  // key concepts. The Library search (data-search on each card) and the Source Map search both use
  // this, so the two always find the same pages.
  const searchText = (e, clusterTitle) =>
    [e.title, e.people, e.field, e.tagline, clusterTitle, ...(e.concepts || []).map((c) => c.term)]
      .join(" ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").toLowerCase();
  eleventyConfig.addFilter("searchText", searchText);

  // The Library Index (/library/index/): every page, and every idea named on a page, A to Z.
  // Returns { pages: [{ letter, items }], ideas: [{ letter, items }] }, each item { name, slug, note }.
  // How the index sorts a name ("The Art of Loving" goes under A), and which letter it's filed under.
  const sortKey = (s) => String(s).replace(/<[^>]+>/g, "").replace(/^(the|a|an)\s+/i, "").normalize("NFD").replace(/[^\w\s]/g, "").toLowerCase();
  const indexLetter = (s) => { const k = sortKey(s)[0] || "#"; return /[a-z]/.test(k) ? k.toUpperCase() : "#"; };
  eleventyConfig.addFilter("indexLetter", indexLetter);
  eleventyConfig.addFilter("libraryIndex", (entries, clusters) => {
    const plain = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
    const short = Object.fromEntries(clusters.map((c) => [c.id, c.short || c.title]));
    const group = (items) => {
      const out = [];
      items.sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name))).forEach((i) => {
        const letter = indexLetter(i.name);
        if (!out.length || out[out.length - 1].letter !== letter) out.push({ letter, items: [] });
        out[out.length - 1].items.push(i);
      });
      return out;
    };
    const pages = entries.map((e) => ({ name: plain(e.title), slug: e.slug, note: `${plain(e.people)} · ${short[e.cluster]}` }));
    const ideas = [];
    entries.forEach((e) => {
      (e.concepts || []).forEach((c) => ideas.push({ name: plain(c.term), slug: e.slug, note: plain(e.title) }));
      if (e.framework && e.framework.name) {
        ideas.push({ name: plain(e.framework.name), slug: e.slug, note: plain(e.title) });
        (e.framework.items || []).forEach((i) => ideas.push({ name: plain(i.name), slug: e.slug, note: `${plain(e.framework.name)} · ${plain(e.title)}` }));
      }
    });
    return { pages: group(pages), ideas: group(ideas) };
  });

  // The data the Research Radar (assets/js/lineage-radar.js) draws from, as JSON for a <script> tag.
  // Pages with no ring aren't on the radar. In your preview they're listed under it as "not on the radar yet".
  eleventyConfig.addFilter("radarData", (entries, clusters) => {
    const plain = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
    const short = Object.fromEntries(clusters.map((c) => [c.id, c.short || c.title]));
    const data = entries
      .filter((e) => e.ring || reviewMode)
      .map((e) => ({
        slug: e.slug, title: plain(e.title), people: plain(e.people), tagline: plain(e.tagline),
        cluster: short[e.cluster], quadrant: e.quadrant, ring: e.ring || null, evidence: e.evidence,
        search: searchText(e, (clusters.find((c) => c.id === e.cluster) || {}).title),
        // Unreviewed pages get a dotted outline on the radar, only in your preview.
        draft: reviewMode && e.status !== "published",
      }));
    return JSON.stringify(data).replace(/</g, "\\u003c");
  });

  // The data the lineage map (assets/js/lineage-map.js) draws from, as JSON for a <script> tag.
  // Only the fields the map shows; HTML tags are stripped so the map can use them as plain text.
  eleventyConfig.addFilter("lineageMapData", (entries, clusters) => {
    const plain = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
    const shown = clusters.filter((c) => entries.some((e) => e.cluster === c.id));
    const slugs = new Set(entries.map((e) => e.slug));
    const data = {
      clusters: shown.map((c) => ({ id: c.id, title: c.title, short: c.short || c.title, blurb: c.blurb })),
      entries: entries.map((e) => ({
        slug: e.slug, cluster: e.cluster, title: plain(e.title), people: plain(e.people),
        // Unreviewed pages get a dotted outline on the map, but only in your preview, not on the live site.
        tagline: plain(e.tagline), draft: reviewMode && e.status !== "published",
        search: searchText(e, (clusters.find((c) => c.id === e.cluster) || {}).title),
        related: (e.related || []).filter((r) => slugs.has(r)),
      })),
    };
    return JSON.stringify(data).replace(/</g, "\\u003c");
  });

  return {
    dir: { input: ".", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    // Markdown pages (blog posts) can use {{ "img/x.jpg" | media }} for their pictures.
    markdownTemplateEngine: "njk",
  };
};
