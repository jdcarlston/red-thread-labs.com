// Research Library: the lineage behind Practice Labs.
//
// The content lives in research-roots/:
//   research-roots/clusters.yml   the clusters, in the order they appear on /library/
//   research-roots/<slug>.md      one file per entry; each becomes a page at /library/<slug>/
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

// An entry's text fields as HTML, ready for library/entry.njk.
// The page title and the concept names stay plain text: the templates escape those themselves.
// A paragraph that holds a colon followed by a space (like "Family Therapy: Concepts") can be read
// as a label instead of text unless it's in quotes. Catch that here and say how to fix it.
function mustBeText(list, field, slug) {
  (list || []).forEach((item, i) => {
    if (typeof item !== "string") {
      throw new Error(`Research Library: ${slug}.md, "${field}" item ${i + 1} isn't plain text. ` +
        `It probably has a colon followed by a space; put the whole item in "double quotes".`);
    }
  });
}

function toHtml(e) {
  mustBeText(e.who, "who", e.slug);
  mustBeText(e.exercise && e.exercise.steps, "exercise steps", e.slug);
  const out = { ...e };
  for (const k of ["people", "tagline", "context", "heartLine"]) out[k] = inline(e[k]);
  out.who = (e.who || []).map(inline);
  out.concepts = (e.concepts || []).map((c) => ({ term: c.term, def: inline(c.def) }));
  // The core framework (optional): a named, numbered set, like Terry Real's Five Losing Strategies.
  if (e.framework) out.framework = { ...e.framework, intro: inline(e.framework.intro), items: (e.framework.items || []).map((i) => ({ name: i.name, def: inline(i.def) })) };
  if (e.exercise) out.exercise = { ...e.exercise, title: inline(e.exercise.title), steps: (e.exercise.steps || []).map(inline), why: inline(e.exercise.why) };
  out.sources = (e.sources || []).map((s) => ({ ...s, cite: inline(s.cite) }));
  out.related = e.related || [];
  return out;
}

// Research Radar values. A page with no ring isn't on the radar yet.
const RINGS = ["core", "practice", "exploring", "hold"];
const QUADRANTS = ["i", "it", "we", "its"];
const EVIDENCE = ["research", "practice", "tradition"];

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
    // Research Radar: the page's ring, and its quadrant and evidence (from its cluster unless the page sets its own).
    const cluster = clusters[clusterRank[e.cluster]];
    e.quadrant = e.quadrant || cluster.quadrant;
    e.evidence = e.evidence || cluster.evidence;
    for (const [k, ok] of [["ring", RINGS], ["quadrant", QUADRANTS], ["evidence", EVIDENCE]]) {
      if (e[k] && !ok.includes(e[k])) throw new Error(`Research Library: ${f} has ${k} "${e[k]}" (it should be one of: ${ok.join(", ")})`);
    }
    return toHtml(e);
  })
  .sort((a, b) => clusterRank[a.cluster] - clusterRank[b.cluster] || (a.order ?? 0) - (b.order ?? 0));

module.exports = { clusters, entries, RINGS, QUADRANTS, EVIDENCE };
