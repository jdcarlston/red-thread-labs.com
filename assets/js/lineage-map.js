// The Research Library map on /library/, in two views so every label stays readable:
//
//   1. Overview: Lab Sources at the centre and one bubble per cluster around it.
//      Bubble size = how many pages the cluster has; a line between two clusters
//      means pages in them link to each other (thicker = more links).
//   2. Close-up: pick a cluster and its pages circle it, with lines between pages
//      that link to each other. Pick a page to see what it connects to, in this
//      cluster and in others.
//
// The data is a JSON <script id="lineage-map-data"> written by eleventy.config.js (lineageMapData),
// so a new entry in research-roots/ shows up here with no change to this file.
(function () {
  const dataEl = document.getElementById("lineage-map-data");
  const svg = document.getElementById("lineage-map");
  const panel = document.getElementById("lineage-map-panel");
  const back = document.getElementById("lineage-map-back");
  if (!dataEl || !svg || !panel) return;
  const data = JSON.parse(dataEl.textContent);

  const SIZE = 1000, C = SIZE / 2;
  const NS = "http://www.w3.org/2000/svg";
  svg.setAttribute("viewBox", `0 0 ${SIZE} ${SIZE}`);

  // ---------- helpers ----------
  const el = (tag, attrs = {}, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  };
  const polar = (r, deg) => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const small = () => window.matchMedia("(max-width: 700px)").matches;

  // Break a label into lines of at most `max` characters.
  function wrap(text, max) {
    const lines = [];
    let line = "";
    text.split(" ").forEach((w) => {
      if ((line + " " + w).trim().length > max && line) { lines.push(line); line = w; }
      else line = (line + " " + w).trim();
    });
    if (line) lines.push(line);
    return lines;
  }
  // A <text> with one <tspan> per line, centred vertically on (x, y).
  function label(x, y, lines, attrs) {
    const t = el("text", { x, y, ...attrs });
    lines.forEach((l, i) => t.append(el("tspan", { x, dy: i === 0 ? `${0.35 - (lines.length - 1) * 0.6}em` : "1.2em" }, l)));
    return t;
  }

  // ---------- the data, indexed ----------
  const bySlug = Object.fromEntries(data.entries.map((e) => [e.slug, e]));
  const byCluster = Object.fromEntries(data.clusters.map((c) => [c.id, c]));
  const members = (id) => data.entries.filter((e) => e.cluster === id);

  // Links go both ways: if A lists B as related, B is connected to A too.
  const neighbours = {};
  data.entries.forEach((e) => (neighbours[e.slug] = new Set()));
  data.entries.forEach((e) => e.related.forEach((r) => {
    if (!bySlug[r]) return;
    neighbours[e.slug].add(r);
    neighbours[r].add(e.slug);
  }));

  // How many page-to-page links join each pair of clusters.
  const clusterLinks = {};
  const seen = new Set();
  data.entries.forEach((e) => neighbours[e.slug].forEach((r) => {
    const key = [e.slug, r].sort().join("|");
    if (seen.has(key)) return;
    seen.add(key);
    const a = e.cluster, b = bySlug[r].cluster;
    if (a === b) return;
    const k = [a, b].sort().join("|");
    clusterLinks[k] = (clusterLinks[k] || 0) + 1;
  }));

  // ---------- view 1: the overview ----------
  function drawOverview() {
    svg.replaceChildren();
    back.hidden = true;
    if (small()) { drawOverviewColumn(); return; }
    svg.setAttribute("viewBox", `0 0 ${SIZE} ${SIZE}`);
    const R = 300;
    const pos = {};
    // The clusters go clockwise in clusters.yml order, with TOP_CLUSTER at 12 o'clock.
    const TOP_CLUSTER = "relationships";
    const top = Math.max(0, data.clusters.findIndex((c) => c.id === TOP_CLUSTER));
    data.clusters.forEach((cl, i) => {
      const a = -90 + (360 / data.clusters.length) * (i - top);
      const [x, y] = polar(R, a);
      pos[cl.id] = { x, y, a, r: 26 + members(cl.id).length * 1.6 };
    });

    const lines = el("g", { class: "lm-lines" });
    for (const k in clusterLinks) {
      const [a, b] = k.split("|");
      const p = pos[a], q = pos[b];
      if (!p || !q) continue;
      const mx = ((p.x + q.x) / 2 + C) / 2, my = ((p.y + q.y) / 2 + C) / 2;   // bow gently toward the centre
      lines.append(el("path", {
        d: `M${p.x},${p.y} Q${mx},${my} ${q.x},${q.y}`, class: "lm-xlink",
        "stroke-width": 1 + clusterLinks[k] * 1.2, "data-a": a, "data-b": b,
      }));
    }
    data.clusters.forEach((cl) => lines.append(el("line", { x1: C, y1: C, x2: pos[cl.id].x, y2: pos[cl.id].y, class: "lm-spoke" })));
    svg.append(lines);

    const hub = el("g", { class: "lm-hub" });
    hub.append(el("circle", { cx: C, cy: C, r: 72 }));
    hub.append(label(C, C, ["LAB", "SOURCES"], { "text-anchor": "middle" }));
    svg.append(hub);

    const fs = small() ? 32 : 22;
    data.clusters.forEach((cl) => {
      const p = pos[cl.id];
      const g = el("g", { class: "lm-bubble", tabindex: "0", role: "button", "data-cluster": cl.id,
        "aria-label": `${cl.title}, ${members(cl.id).length} pages` });
      g.append(el("circle", { cx: p.x, cy: p.y, r: p.r }));
      g.append(el("text", { x: p.x, y: p.y, dy: "0.35em", "text-anchor": "middle", class: "lm-bubble__count" }, members(cl.id).length));
      // label centred under the bubble (above it for the top one), so it never runs off the side
      const lines2 = wrap(cl.short || cl.title, small() ? 10 : 14);
      const above = p.a < -60 && p.a > -120;
      const ly = above ? p.y - p.r - 12 - (lines2.length - 1) * fs * 1.2 - fs * 0.35 : p.y + p.r + 14 + fs * 0.6;
      const t = el("text", { x: p.x, y: ly, "text-anchor": "middle", class: "lm-bubble__label", "font-size": fs });
      lines2.forEach((l, i) => t.append(el("tspan", { x: p.x, dy: i === 0 ? "0.35em" : "1.2em" }, l)));
      g.append(t);
      svg.append(g);
    });

    showOverviewPanel();
  }


  function showOverviewPanel() {
    panel.innerHTML = `
      <p class="lm-panel__kicker">The map</p>
      <h3>Research Roots</h3>
      <p>Each bubble is a cluster of research; the number is how many pages it holds. Lines show where pages in different clusters link to each other, and thicker lines mean more links.</p>
      <p>Pick a cluster to open it.</p>
      <ul class="lm-panel__links">${data.clusters.map((c) =>
        `<li><button type="button" data-open="${c.id}">${esc(c.title)}</button> <span class="lm-panel__n">${members(c.id).length}</span></li>`).join("")}</ul>`;
  }

  // On a phone the overview is a column too: one row per cluster, the bubble sized by its page count.
  function drawOverviewColumn() {
    const ROW = 110, TOP = 70;
    svg.setAttribute("viewBox", `0 0 ${SIZE} ${TOP + data.clusters.length * ROW}`);
    data.clusters.forEach((cl, i) => {
      const y = TOP + i * ROW, n = members(cl.id).length;
      const g = el("g", { class: "lm-bubble", tabindex: "0", role: "button", "data-cluster": cl.id,
        "aria-label": `${cl.title}, ${n} pages` });
      g.append(el("rect", { x: 0, y: y - ROW / 2 + 6, width: SIZE, height: ROW - 12, class: "lm-node__hit" }));
      g.append(el("circle", { cx: 110, cy: y, r: 22 + n * 1.5 }));
      g.append(el("text", { x: 110, y, dy: "0.35em", "text-anchor": "middle", class: "lm-bubble__count" }, n));
      g.append(el("text", { x: 200, y, dy: "0.35em", "font-size": 42, class: "lm-bubble__label" }, cl.short || cl.title));
      g.append(el("text", { x: SIZE - 40, y, dy: "0.35em", "font-size": 46, "text-anchor": "end", class: "lm-column__arrow" }, "›"));
      svg.append(g);
    });
    showOverviewPanel();
  }

  // ---------- view 2: one cluster up close ----------
  let current = null;
  function drawCluster(id, selected) {
    current = id;
    svg.replaceChildren();
    back.hidden = false;
    if (small()) { drawClusterColumn(id); if (selected) showEntry(selected); else showClusterPanel(id); return; }
    svg.setAttribute("viewBox", `0 0 ${SIZE} ${SIZE}`);
    const cl = byCluster[id];
    const list = members(id);
    const n = list.length;
    const R = n > 12 ? 300 : 270;
    const fs = small() ? 27 : 19;
    const maxChars = small() ? 13 : 18;
    const pos = {};
    // In a big cluster (more than 16 pages), near the top and bottom of the ring, where labels sit side
    // by side, every other label sits a little further out so neighbours don't run into each other.
    const zigzag = n > 16;
    list.forEach((e, i) => {
      const a = -90 + (360 / n) * i;
      const [x, y] = polar(R, a);
      const nearTopOrBottom = Math.abs(Math.sin((a * Math.PI) / 180)) > 0.55;
      pos[e.slug] = { x, y, a, far: zigzag && i % 2 === 1 && nearTopOrBottom };
    });

    // links between pages in this cluster
    const lines = el("g", { class: "lm-lines" });
    list.forEach((e) => lines.append(el("line", { x1: C, y1: C, x2: pos[e.slug].x, y2: pos[e.slug].y, class: "lm-spoke lm-spoke--thin" })));
    const done = new Set();
    list.forEach((e) => neighbours[e.slug].forEach((r) => {
      const key = [e.slug, r].sort().join("|");
      if (!pos[r] || done.has(key)) return;
      done.add(key);
      const a = pos[e.slug], b = pos[r];
      lines.append(el("path", { d: `M${a.x},${a.y} Q${C},${C} ${b.x},${b.y}`, class: "lm-rel", "data-a": e.slug, "data-b": r }));
    }));
    svg.append(lines);

    const centre = el("g", { class: "lm-hub lm-hub--cluster" });
    centre.append(el("circle", { cx: C, cy: C, r: 96 }));
    centre.append(label(C, C, wrap((cl.short || cl.title).toUpperCase(), 12), { "text-anchor": "middle" }));
    svg.append(centre);

    list.forEach((e) => {
      const p = pos[e.slug];
      const others = [...neighbours[e.slug]].filter((r) => bySlug[r].cluster !== id).length;
      const g = el("g", { class: "lm-node" + (e.draft ? " is-draft" : ""), tabindex: "0", role: "button",
        "data-slug": e.slug, "aria-label": e.title });
      g.append(el("circle", { cx: p.x, cy: p.y, r: 12 + Math.min(neighbours[e.slug].size, 10) * 1.2 }));
      if (others) g.append(el("circle", { cx: p.x, cy: p.y, r: 5, class: "lm-node__out" }));
      const cos = Math.cos((p.a * Math.PI) / 180), sin = Math.sin((p.a * Math.PI) / 180);
      const off = 28 + Math.min(neighbours[e.slug].size, 10) * 1.2 + (p.far ? 44 : 0);
      const lx = p.x + off * cos, ly = p.y + off * sin;
      const anchor = cos > 0.12 ? "start" : cos < -0.12 ? "end" : "middle";
      const lines2 = wrap(e.title, anchor === "middle" ? 14 : maxChars);
      const shiftY = anchor === "middle" ? (sin < 0 ? -1 : 1) * (lines2.length * fs * 0.55) : 0;
      g.append(label(lx, ly + shiftY, lines2, { "text-anchor": anchor, "font-size": fs }));
      svg.append(g);
    });

    if (selected) showEntry(selected); else showClusterPanel(id);
  }


  // On a phone the circle is too cramped, so a cluster is drawn as a column: one page per row,
  // with arcs down the left side joining pages that link to each other.
  function drawClusterColumn(id) {
    const list = members(id);
    const ROW = 96, TOP = 150, X = 220;
    const H = TOP + list.length * ROW + 30;
    svg.setAttribute("viewBox", `0 0 ${SIZE} ${H}`);
    const pos = {};
    list.forEach((e, i) => (pos[e.slug] = { x: X, y: TOP + i * ROW }));

    const cl = byCluster[id];
    svg.append(el("text", { x: 40, y: 80, class: "lm-column__title" }, (cl.short || cl.title).toUpperCase()));

    const lines = el("g", { class: "lm-lines" });
    const done = new Set();
    list.forEach((e) => neighbours[e.slug].forEach((r) => {
      const key = [e.slug, r].sort().join("|");
      if (!pos[r] || done.has(key)) return;
      done.add(key);
      const a = pos[e.slug], b = pos[r];
      const bow = Math.min(Math.abs(b.y - a.y) / 2, X - 30);   // farther apart = wider arc
      lines.append(el("path", { d: `M${a.x},${a.y} C${a.x - bow},${a.y} ${b.x - bow},${b.y} ${b.x},${b.y}`,
        class: "lm-rel", "data-a": e.slug, "data-b": r }));
    }));
    svg.append(lines);

    list.forEach((e) => {
      const p = pos[e.slug];
      const others = [...neighbours[e.slug]].some((r) => bySlug[r].cluster !== id);
      const g = el("g", { class: "lm-node" + (e.draft ? " is-draft" : ""), tabindex: "0", role: "button",
        "data-slug": e.slug, "aria-label": e.title });
      g.append(el("rect", { x: X - 20, y: p.y - ROW / 2 + 6, width: SIZE - X, height: ROW - 12, class: "lm-node__hit" }));
      g.append(el("circle", { cx: p.x, cy: p.y, r: 20 }));
      if (others) g.append(el("circle", { cx: p.x, cy: p.y, r: 8, class: "lm-node__out" }));
      g.append(el("text", { x: X + 44, y: p.y, dy: "0.35em", "font-size": 37 }, e.title));
      svg.append(g);
    });
  }

  function showClusterPanel(id) {
    clearFocus();
    const cl = byCluster[id];
    const list = members(id);
    panel.innerHTML = `
      <p class="lm-panel__kicker">Cluster · ${list.length} pages</p>
      <h3>${esc(cl.title)}</h3>
      <p>${esc(cl.blurb || "")}</p>
      <p class="lm-panel__label">Pages</p>
      <ul class="lm-panel__links">${list.map((e) => `<li><button type="button" data-go="${e.slug}">${esc(e.title)}</button></li>`).join("")}</ul>
      <p class="lm-panel__hint">A dot with a red centre also links to pages in other clusters.</p>`;
  }

  function clearFocus() {
    svg.classList.remove("is-focused");
    svg.querySelectorAll(".is-on").forEach((n) => n.classList.remove("is-on"));
  }

  function showEntry(slug) {
    const e = bySlug[slug];
    if (e.cluster !== current) { drawCluster(e.cluster, slug); return; }
    clearFocus();
    svg.classList.add("is-focused");
    svg.querySelector(`.lm-node[data-slug="${slug}"]`)?.classList.add("is-on");
    svg.querySelectorAll(".lm-rel").forEach((p) => {
      if (p.dataset.a === slug || p.dataset.b === slug) {
        p.classList.add("is-on");
        svg.querySelector(`.lm-node[data-slug="${p.dataset.a === slug ? p.dataset.b : p.dataset.a}"]`)?.classList.add("is-on");
      }
    });
    const near = [...neighbours[slug]].map((r) => bySlug[r]);
    const here = near.filter((r) => r.cluster === e.cluster);
    const away = near.filter((r) => r.cluster !== e.cluster);
    const item = (r) => `<li><button type="button" data-go="${r.slug}">${esc(r.title)}</button>${
      r.cluster !== e.cluster ? ` <span class="lm-panel__n">${esc(byCluster[r.cluster].short || byCluster[r.cluster].title)}</span>` : ""}</li>`;
    panel.innerHTML = `
      <p class="lm-panel__kicker">${esc(byCluster[e.cluster].title)}${e.draft ? " · Draft" : ""}</p>
      <h3>${esc(e.title)}</h3>
      <p class="lm-panel__people">${esc(e.people)}</p>
      <p class="lm-panel__tagline">${esc(e.tagline)}</p>
      <a class="lm-panel__read" href="/library/${e.slug}/">Read the page →</a>
      ${here.length ? `<p class="lm-panel__label">Linked in this cluster</p><ul class="lm-panel__links">${here.map(item).join("")}</ul>` : ""}
      ${away.length ? `<p class="lm-panel__label">Linked in other clusters</p><ul class="lm-panel__links">${away.map(item).join("")}</ul>` : ""}`;
  }

  // ---------- interaction ----------
  function activate(target) {
    const bubble = target.closest(".lm-bubble");
    const node = target.closest(".lm-node");
    if (bubble) drawCluster(bubble.dataset.cluster);
    else if (node) showEntry(node.dataset.slug);
    else if (target.closest(".lm-hub--cluster")) showClusterPanel(current);
  }
  svg.addEventListener("click", (ev) => activate(ev.target));
  svg.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); activate(ev.target); }
  });
  panel.addEventListener("click", (ev) => {
    const go = ev.target.closest("[data-go]");
    const open = ev.target.closest("[data-open]");
    if (go) showEntry(go.dataset.go);
    if (open) drawCluster(open.dataset.open);
  });
  back.addEventListener("click", () => { current = null; drawOverview(); });

  // Hovering a cluster in the overview lights up its links to other clusters.
  svg.addEventListener("mouseover", (ev) => {
    const b = ev.target.closest(".lm-bubble");
    if (!b || current) return;
    svg.querySelectorAll(".lm-xlink").forEach((p) =>
      p.classList.toggle("is-on", p.dataset.a === b.dataset.cluster || p.dataset.b === b.dataset.cluster));
  });
  svg.addEventListener("mouseout", (ev) => {
    if (ev.target.closest(".lm-bubble")) svg.querySelectorAll(".lm-xlink.is-on").forEach((p) => p.classList.remove("is-on"));
  });

  // Redraw when the screen size crosses the phone/desktop line (label sizes differ).
  let wasSmall = small();
  window.addEventListener("resize", () => {
    if (small() === wasSmall) return;
    wasSmall = small();
    current ? drawCluster(current) : drawOverview();
  });

  // Open the map at a place named in the address: /library/map/#<page-slug> opens that page's
  // cluster with the page selected (the "View Map" button on each page links this way), and
  // /library/map/#<cluster-id> opens a cluster. No #, or one that matches nothing, shows the whole map.
  function openFromAddress() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (bySlug[id]) showEntry(id);
    else if (byCluster[id]) drawCluster(id);
    else { current = null; drawOverview(); return; }
    svg.closest(".lineage-map").scrollIntoView({ block: "start" });
  }
  window.addEventListener("hashchange", openFromAddress);

  // Search: the same searchable words as the Library page (built by the searchText filter in
  // eleventy.config.js). Matching clusters come first, then pages. Picking one changes the
  // address to #<cluster> or #<page>, and openFromAddress above opens it on the map.
  const searchBox = document.getElementById("map-search");
  const results = document.getElementById("map-search-results");
  if (searchBox && results) {
    const MAX = 8;
    const showResults = () => {
      const words = searchBox.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (!words.length) { results.hidden = true; results.replaceChildren(); return; }
      const clusterHits = data.clusters.filter((c) =>
        words.every((w) => `${c.title} ${c.short}`.toLowerCase().includes(w)));
      const pageHits = data.entries.filter((e) => words.every((w) => e.search.includes(w)));
      const items = [
        ...clusterHits.map((c) => ({ id: c.id, name: c.title, where: "Cluster" })),
        ...pageHits.map((e) => ({ id: e.slug, name: e.title, where: byCluster[e.cluster].short })),
      ];
      results.innerHTML = items.length
        ? items.slice(0, MAX).map((i) =>
            `<li><a href="#${i.id}"><span>${esc(i.name)}</span> <span class="map-search__where">${esc(i.where)}</span></a></li>`).join("") +
          (items.length > MAX ? `<li class="map-search__more">${items.length - MAX} more. Add a word to narrow it down.</li>` : "")
        : `<li class="map-search__more">Nothing matches that yet. Try another word.</li>`;
      results.hidden = false;
    };
    searchBox.addEventListener("input", showResults);
    // Picking a result: close the list (the link itself changes the address).
    results.addEventListener("click", (ev) => {
      if (!ev.target.closest("a")) return;
      results.hidden = true;
      searchBox.value = "";
      // Picking the page that's already in the address wouldn't fire hashchange, so open it here.
      const id = ev.target.closest("a").getAttribute("href").slice(1);
      if (decodeURIComponent(location.hash.slice(1)) === id) { ev.preventDefault(); openFromAddress(); }
    });
    searchBox.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") { searchBox.value = ""; showResults(); }
      if (ev.key === "Enter") { ev.preventDefault(); results.querySelector("a")?.click(); }
    });
  }
  openFromAddress();
})();
