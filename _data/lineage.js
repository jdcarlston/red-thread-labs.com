// Research Library: the lineage behind Practice Labs.
//
// The content lives in research-roots/:
//   research-roots/clusters.yml   the clusters, in the order they appear on /lineage/
//   research-roots/<slug>.md      one file per entry; each becomes a page at /lineage/<slug>/
//   scripts/research-roots-template.md   the layout new entries start from
//
// Each entry is plain text: labeled fields between the --- lines at the top of the file.
// Edit them in any text editor, or in the site editor at /admin while previewing.
// Text fields use Markdown: *italic*, **bold**, [link text](https://...).
//
// Add an entry:   npm run new:lineage -- <slug> <cluster>   (or "New Research Library page" in /admin)
// Publish one:    change its status from "review" to "published"
//
// This file reads the entries, turns their Markdown into HTML for the page templates,
// and sorts them by cluster, then by `order`.

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const matter = require("gray-matter");
const markdownIt = require("markdown-it");

const dir = path.join(__dirname, "..", "research-roots");

// Markdown for one line of text (no surrounding <p>). Raw HTML such as <br> is allowed.
// Links to other sites open in a new tab, like the rest of the site.
const md = markdownIt({ html: true });
const defaultLink = md.renderer.rules.link_open || ((tokens, i, opts, env, self) => self.renderToken(tokens, i, opts));
md.renderer.rules.link_open = (tokens, i, opts, env, self) => {
  if (/^https?:/.test(tokens[i].attrGet("href"))) {
    tokens[i].attrSet("target", "_blank");
    tokens[i].attrSet("rel", "noopener");
  }
  return defaultLink(tokens, i, opts, env, self);
};
const inline = (text) => (typeof text === "string" ? md.renderInline(text) : text);

// An entry's text fields as HTML, ready for lineage/entry.njk.
// The page title and the concept names stay plain text: the templates escape those themselves.
function toHtml(e) {
  const out = { ...e };
  for (const k of ["people", "tagline", "context", "heartLine"]) out[k] = inline(e[k]);
  out.who = (e.who || []).map(inline);
  out.concepts = (e.concepts || []).map((c) => ({ term: c.term, def: inline(c.def) }));
  if (e.exercise) out.exercise = { ...e.exercise, title: inline(e.exercise.title), steps: (e.exercise.steps || []).map(inline), why: inline(e.exercise.why) };
  out.sources = (e.sources || []).map((s) => ({ ...s, cite: inline(s.cite) }));
  out.related = e.related || [];
  return out;
}

const clusters = yaml.load(fs.readFileSync(path.join(dir, "clusters.yml"), "utf8"));
const clusterRank = Object.fromEntries(clusters.map((c, i) => [c.id, i]));

const entries = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
  .map((f) => {
    const e = matter(fs.readFileSync(path.join(dir, f), "utf8")).data;
    // Catch typos early: the slug must match the file name, and the cluster must exist.
    const slug = f.replace(/\.md$/, "");
    if (e.slug !== slug) throw new Error(`Research Library: ${f} has slug "${e.slug}" (it should be "${slug}")`);
    if (!(e.cluster in clusterRank)) throw new Error(`Research Library: "${slug}" has an unknown cluster "${e.cluster}"`);
    return toHtml(e);
  })
  .sort((a, b) => clusterRank[a.cluster] - clusterRank[b.cluster] || (a.order ?? 0) - (b.order ?? 0));

module.exports = { clusters, entries };
