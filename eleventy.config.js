// Eleventy setup for red-thread-labs.com.
const { heroArtwork, menuThreads } = require("./lib/hero");
const { logoSvg } = require("./lib/logo");
const lineage = require("./_data/lineage");
const site = require("./_data/site");

// Research Library pages have a status:
//   published = reviewed by JD. Live, no marker.
//   review    = not reviewed yet. Live, marked "Draft".
//   hidden    = not ready to show anyone. Only in your preview (npm start, or RTL_REVIEW=1).
const previewing = process.env.ELEVENTY_RUN_MODE === "serve";
const reviewMode = previewing || process.env.RTL_REVIEW === "1";

// Photos load from the Cloudflare media bucket on the live site. While previewing on your Mac
// they load from the media/ folder instead, so a new photo shows up before you've uploaded it.
// RTL_LOCAL_MEDIA=1 npm run build does the same for a one-off build (handy for testing).
const useBucket = site.media.useBucket && !previewing && process.env.RTL_LOCAL_MEDIA !== "1";

function visibleEntries() {
  const live = ["published", "review"];
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
        tagline: plain(e.tagline), draft: e.status !== "published",
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
