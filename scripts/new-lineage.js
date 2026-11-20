#!/usr/bin/env node
// Start a new Research Roots entry from the template.
//
//   npm run new:lineage -- <slug> <cluster>
//   npm run new:lineage -- sue-johnson attachment
//
// Creates research-roots/<slug>.js with the slug, cluster and status ("review") filled in,
// and an order that puts it after the cluster's existing entries. Then open the file and
// replace the placeholder text. It shows up in the preview (npm start) with a DRAFT ribbon.

const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "research-roots");
const [slug, cluster] = process.argv.slice(2);

function stop(message) {
  console.error(message);
  process.exit(1);
}

const clusters = require(path.join(dir, "clusters.js"));
const clusterIds = clusters.map((c) => c.id);

if (!slug || !cluster) stop(`Usage: npm run new:lineage -- <slug> <cluster>\nClusters: ${clusterIds.join(", ")}`);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) stop(`"${slug}" isn't a good slug. Use lowercase words joined by hyphens, like sue-johnson.`);
if (!clusterIds.includes(cluster)) stop(`Unknown cluster "${cluster}". Choose one of: ${clusterIds.join(", ")}`);

const target = path.join(dir, `${slug}.js`);
if (fs.existsSync(target)) stop(`research-roots/${slug}.js already exists.`);

// Order: 10 after the highest order already in this cluster.
const orders = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".js") && !f.startsWith("_") && f !== "clusters.js")
  .map((f) => require(path.join(dir, f)))
  .filter((e) => e.cluster === cluster)
  .map((e) => e.order || 0);
const order = (orders.length ? Math.max(...orders) : 0) + 10;

const template = fs.readFileSync(path.join(dir, "_template.js"), "utf8");
const body = template.slice(template.indexOf("module.exports")); // drop the template's own notes
const file =
  `// Research Roots: ${slug}\n// See research-roots/_template.js for what each field does.\n\n` +
  body
    .replace('slug: "SLUG",', `slug: "${slug}",`)
    .replace("/lineage/SLUG/", `/lineage/${slug}/`)
    .replace('cluster: "CLUSTER",', `cluster: "${cluster}",`)
    .replace("order: 0,", `order: ${order},`);

fs.writeFileSync(target, file);
console.log(`Created research-roots/${slug}.js (cluster "${cluster}", order ${order}).`);
console.log(`Fill it in, then preview it at http://localhost:8080/lineage/${slug}/`);
