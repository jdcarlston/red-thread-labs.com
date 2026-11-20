// Research Roots: the lineage behind Practice Labs.
//
// The content lives in research-roots/:
//   research-roots/clusters.js   the clusters, in the order they appear on /lineage/
//   research-roots/<slug>.js     one file per entry; each becomes a page at /lineage/<slug>/
//   research-roots/_template.js  the layout new entries start from
//
// Add an entry:   npm run new:lineage -- <slug> <cluster>
// Publish one:    change its status from "review" to "published"
//
// This file just gathers the entry files and sorts them by cluster, then by `order`.

const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "research-roots");

// Load a file fresh every time, so edits show up in the preview without restarting it.
function load(file) {
  const full = path.join(dir, file);
  delete require.cache[require.resolve(full)];
  return require(full);
}

const clusters = load("clusters.js");
const clusterRank = Object.fromEntries(clusters.map((c, i) => [c.id, i]));

const entries = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".js") && !f.startsWith("_") && f !== "clusters.js")
  .map(load)
  .sort((a, b) => (clusterRank[a.cluster] ?? 99) - (clusterRank[b.cluster] ?? 99) || (a.order ?? 0) - (b.order ?? 0));

// Catch typos early: every entry needs a known cluster and a slug matching its file name.
for (const e of entries) {
  if (!(e.cluster in clusterRank)) throw new Error(`Research Roots: "${e.slug}" has an unknown cluster "${e.cluster}"`);
}

module.exports = { clusters, entries };
