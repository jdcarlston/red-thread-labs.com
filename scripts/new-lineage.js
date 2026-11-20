#!/usr/bin/env node
// Start a new Research Roots entry from the template.
//
//   npm run new:lineage -- <slug> <cluster>
//   npm run new:lineage -- sue-johnson attachment
//
// Creates research-roots/<slug>.md with the slug, cluster and status ("review") filled in,
// and an order that puts it after the cluster's existing entries. Then open the file (or use the
// site editor at /admin) and replace the placeholder text. It shows up in the preview (npm start)
// with a DRAFT ribbon.

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const matter = require("gray-matter");

const dir = path.join(__dirname, "..", "research-roots");
const [slug, cluster] = process.argv.slice(2);

function stop(message) {
  console.error(message);
  process.exit(1);
}

const clusters = yaml.load(fs.readFileSync(path.join(dir, "clusters.yml"), "utf8"));
const clusterIds = clusters.map((c) => c.id);

if (!slug || !cluster) stop(`Usage: npm run new:lineage -- <slug> <cluster>\nClusters: ${clusterIds.join(", ")}`);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) stop(`"${slug}" isn't a good slug. Use lowercase words joined by hyphens, like sue-johnson.`);
if (!clusterIds.includes(cluster)) stop(`Unknown cluster "${cluster}". Choose one of: ${clusterIds.join(", ")}`);

const target = path.join(dir, `${slug}.md`);
if (fs.existsSync(target)) stop(`research-roots/${slug}.md already exists.`);

// Order: 10 after the highest order already in this cluster.
const orders = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
  .map((f) => matter(fs.readFileSync(path.join(dir, f), "utf8")).data)
  .filter((e) => e.cluster === cluster)
  .map((e) => e.order || 0);
const order = (orders.length ? Math.max(...orders) : 0) + 10;

// Copy the template, dropping its opening notes (the comment lines before `slug:`).
const template = fs.readFileSync(path.join(__dirname, "research-roots-template.md"), "utf8");
const body = template.slice(template.indexOf("slug: SLUG"));
const file =
  "---\n" +
  body
    .replace(/^slug: SLUG .*$/m, `slug: ${slug}`)
    .replace(/^cluster: CLUSTER .*$/m, `cluster: ${cluster}`)
    .replace(/^order: 0 .*$/m, `order: ${order}`);

fs.writeFileSync(target, file);
console.log(`Created research-roots/${slug}.md (cluster "${cluster}", order ${order}).`);
console.log(`Fill it in, then preview it at http://localhost:8080/lineage/${slug}/`);
