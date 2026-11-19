// Eleventy setup for red-thread-labs.com.
const { heroArtwork, menuThreads } = require("./lib/hero");
const { logoSvg } = require("./lib/logo");
const lineage = require("./_data/lineage");
const site = require("./_data/site");

// While previewing (npm start) pages marked status: "review" are shown, with a DRAFT ribbon.
// A normal build (npm run build, and Netlify) only includes published pages.
const reviewMode = process.env.ELEVENTY_RUN_MODE === "serve" || process.env.RTL_REVIEW === "1";

function visibleEntries() {
  return lineage.entries.filter((e) => e.status === "published" || (reviewMode && e.status === "review"));
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  // Photos ship with the site only while the media bucket is off; once it's on they load from Cloudflare.
  if (!site.media.useBucket) eleventyConfig.addPassthroughCopy("media");

  // {{ "img/roots-web.jpg" | media }} gives the right address for a file in media/, wherever it's served from.
  eleventyConfig.addFilter("media", (file) =>
    site.media.useBucket ? `${site.media.base}/${file}` : `/media/${file}`
  );
  eleventyConfig.addWatchTarget("lib/");

  eleventyConfig.addGlobalData("reviewMode", reviewMode);
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

  return {
    dir: { input: ".", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
  };
};
