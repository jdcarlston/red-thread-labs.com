// The Research Radar on /library/radar/.
//
// Every Library page with a ring is a dot. Where it sits says two things:
//   - its quadrant (Ken Wilber's four): I = inner experience, It = body and behavior,
//     We = relationship and culture, Its = systems and structures;
//   - its ring: Core (center), In practice, Exploring, Hold (outer edge).
// The dot's shape says what kind of evidence is behind it: a circle for research studies,
// a diamond for clinical or practitioner work, a star for tradition, philosophy or story.
// Clicking (or tapping) a dot shows the page in the side panel.
// Each dot is also a keyboard stop with its page's name, for screen readers.
//
// The data comes from the radarData filter in eleventy.config.js.
(function () {
  const svg = document.getElementById("radar");
  const panel = document.getElementById("radar-panel");
  const list = document.getElementById("radar-list");
  const dataEl = document.getElementById("radar-data");
  if (!svg || !dataEl) return;
  const all = JSON.parse(dataEl.textContent);

  // ---------- the layout ----------
  const SIZE = 800, C = SIZE / 2, R = 370;
  const QUADRANTS = [
    // Wilber's layout: I upper left, It upper right, We lower left, Its lower right.
    // from/to are angles in degrees (0 = right, going clockwise).
    { id: "i", name: "I", label: "Inner experience", from: 180, to: 270 },
    { id: "it", name: "It", label: "Body and behavior", from: 270, to: 360 },
    { id: "we", name: "We", label: "Relationship and culture", from: 90, to: 180 },
    { id: "its", name: "Its", label: "Systems and structures", from: 0, to: 90 },
  ];
  const RINGS = [
    { id: "core", label: "Core", about: "We teach it and build labs on it.", r0: 0, r1: 0.36 },
    { id: "practice", label: "In practice", about: "We use it in labs and are still testing how it lands.", r0: 0.36, r1: 0.58 },
    { id: "exploring", label: "Exploring", about: "We're reading it, training in it, or watching it.", r0: 0.58, r1: 0.79 },
    { id: "hold", label: "Hold", about: "Useful ideas we use with care, or have moved past.", r0: 0.79, r1: 1 },
  ];
  const EVIDENCE = { research: "Research studies", practice: "Clinical or practitioner work", tradition: "Tradition, philosophy or story" };

  const NS = "http://www.w3.org/2000/svg";
  const el = (name, attrs = {}) => {
    const n = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const polar = (r, deg) => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)];
  const byTitle = (a, b) => a.title.localeCompare(b.title);

  // ---------- number the placed pages: quadrant by quadrant, ring by ring ----------
  const placed = [];
  QUADRANTS.forEach((q) => RINGS.forEach((ring) => {
    all.filter((e) => e.quadrant === q.id && e.ring === ring.id).sort(byTitle).forEach((e) => placed.push(e));
  }));
  placed.forEach((e, i) => (e.n = i + 1));
  const unplaced = all.filter((e) => !e.ring).sort(byTitle);

  // ---------- where each dot goes ----------
  // Each quadrant-and-ring cell is split into rows (arcs). A row holds as many dots as fit along it
  // with `gap` pixels between them; the outer rows fill first. A crowded cell packs tighter, down to
  // MIN_GAP, so its dots don't overlap. Dots stay AXIS pixels clear of the axes.
  const GAP = 30, MIN_GAP = 21, AXIS = 16;
  function rowsFor(inner, outer, gap) {
    const radii = [];
    for (let r = outer - gap / 2; r >= inner + 6; r -= gap * 0.88) radii.push(r);
    if (!radii.length) radii.push((inner + outer) / 2);
    return radii.map((r) => ({ r, cap: Math.max(1, Math.floor(((Math.PI / 2) * r - 2 * AXIS) / gap)), items: [] }));
  }
  function positions() {
    const pos = {};
    QUADRANTS.forEach((q) => RINGS.forEach((ring) => {
      const cell = placed.filter((e) => e.quadrant === q.id && e.ring === ring.id);
      if (!cell.length) return;
      const inner = Math.max(ring.r0 * R, 26), outer = ring.r1 * R;
      let gap = GAP, rows = rowsFor(inner, outer, gap);
      while (gap > MIN_GAP && rows.reduce((n, r) => n + r.cap, 0) < cell.length) rows = rowsFor(inner, outer, --gap);
      let i = 0;
      for (const row of rows) while (row.items.length < row.cap && i < cell.length) row.items.push(cell[i++]);
      while (i < cell.length) rows[i % rows.length].items.push(cell[i++]); // still more than fits: squeeze in
      rows.forEach((row) => {
        const margin = (AXIS / row.r) * (180 / Math.PI);
        const width = q.to - q.from - 2 * margin;
        row.items.forEach((e, k) => {
          const deg = q.from + margin + ((k + 0.5) / row.items.length) * width;
          pos[e.slug] = polar(row.r, deg);
        });
      });
    }));
    return pos;
  }

  function shape(evidence, x, y) {
    const s = 10;
    if (evidence === "practice") return el("path", { d: `M${x} ${y - s * 1.2}L${x + s * 1.2} ${y}L${x} ${y + s * 1.2}L${x - s * 1.2} ${y}Z` });
    if (evidence === "tradition") {
      const pts = [];
      for (let k = 0; k < 10; k++) {
        const rr = k % 2 ? s * 0.62 : s * 1.3, a = (-90 + k * 36) * Math.PI / 180;
        pts.push(`${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`);
      }
      return el("polygon", { points: pts.join(" ") });
    }
    return el("circle", { cx: x, cy: y, r: s });
  }

  // ---------- draw ----------
  function draw() {
    svg.replaceChildren();
    svg.setAttribute("viewBox", `0 0 ${SIZE} ${SIZE}`);

    // The rings, outermost first so the inner ones sit on top.
    [...RINGS].reverse().forEach((ring, i) =>
      svg.append(el("circle", { cx: C, cy: C, r: ring.r1 * R, class: `rd-ring rd-ring--${ring.id}` })));
    // The two axes that split the quadrants.
    svg.append(el("line", { x1: C - R, y1: C, x2: C + R, y2: C, class: "rd-axis" }));
    svg.append(el("line", { x1: C, y1: C - R, x2: C, y2: C + R, class: "rd-axis" }));

    // Quadrant names, in the outer corners.
    QUADRANTS.forEach((q) => {
      const left = q.from === 180 || q.from === 90, top = q.from >= 180;
      const x = left ? 18 : SIZE - 18, y = top ? 34 : SIZE - 40;
      const anchor = left ? "start" : "end";
      const big = el("text", { x, y, "text-anchor": anchor, class: "rd-q-name" });
      big.textContent = q.name;
      const small = el("text", { x, y: y + 22, "text-anchor": anchor, class: "rd-q-label" });
      small.textContent = q.label;
      svg.append(big, small);
    });

    // The dots.
    const pos = positions();
    placed.forEach((e) => {
      const [x, y] = pos[e.slug];
      const g = el("g", { class: "rd-dot" + (e.draft ? " is-draft" : ""), tabindex: "0", role: "button", "data-slug": e.slug, "aria-label": `${e.n}. ${e.title}` });
      g.append(shape(e.evidence, x, y));
      const num = el("text", { x, y: y + 4, "text-anchor": "middle", class: "rd-num" });
      num.textContent = e.n;
      g.append(num);
      svg.append(g);
    });

    // Ring names, along the top axis, drawn last so they sit above the dots.
    RINGS.forEach((ring) => {
      const t = el("text", { x: C + 6, y: C - ((ring.r0 + ring.r1) / 2) * R + 4, class: "rd-ring-label" });
      t.textContent = ring.label;
      svg.append(t);
    });
  }

  // ---------- the side panel ----------
  function showIntro() {
    panel.innerHTML = `
      <p class="lm-panel__kicker">The radar</p>
      <h3>Pick a dot</h3>
      <p class="lm-panel__hint">Each dot is a source. Click one to see it here, or search above the radar.</p>`;
  }
  // Under the radar: what the rings mean.
  function drawRings() {
    const box = document.getElementById("radar-rings");
    if (!box) return;
    box.innerHTML = `
      <h3>How much we rely on it</h3>
      <ul>${RINGS.map((r) => `<li><strong>${r.label}</strong> ${r.about}</li>`).join("")}</ul>`;
  }
  // The page that was clicked (or found by searching) is shown in the panel.
  let selected = null;
  function showEntry(slug) {
    if (!placed.some((p) => p.slug === slug)) return;
    selected = slug;
    svg.querySelectorAll(".rd-dot.is-on").forEach((d) => d.classList.remove("is-on"));
    svg.querySelector(`.rd-dot[data-slug="${slug}"]`)?.classList.add("is-on");
    renderEntry(slug);
  }
  function renderEntry(slug) {
    const e = placed.find((p) => p.slug === slug);
    const q = QUADRANTS.find((x) => x.id === e.quadrant), ring = RINGS.find((x) => x.id === e.ring);
    panel.innerHTML = `
      <p class="lm-panel__kicker">${esc(q.name)} · ${esc(q.label)}</p>
      <h3>${esc(e.title)}</h3>
      <p class="lm-panel__people">${esc(e.people)}</p>
      <p class="lm-panel__tagline">${esc(e.tagline)}</p>
      <p class="rd-panel__facts"><strong>${esc(ring.label)}.</strong> ${esc(ring.about)}<br>${esc(EVIDENCE[e.evidence] || "")} · ${esc(e.cluster)}</p>
      <a class="lm-panel__read" href="/library/${e.slug}/">Read the page →</a>`;
  }

  // ---------- under the radar ----------
  // Only in your preview: pages that don't have a Radar ring yet, as a to-do list.
  // (The pages on the radar are read by pointing at their dots.)
  function drawList() {
    list.innerHTML = unplaced.length
      ? `<section class="radar__unplaced"><h3>Not on the radar yet (${unplaced.length})</h3>
         <p>Only you see this, in your preview. Give a page a Radar ring in /admin to place it.</p>
         <ul>${unplaced.map((e) => `<li><a href="/library/${e.slug}/">${esc(e.title)}</a></li>`).join("")}</ul></section>`
      : "";
  }

  // ---------- wiring ----------
  svg.addEventListener("click", (ev) => {
    const d = ev.target.closest(".rd-dot");
    if (d) showEntry(d.dataset.slug);
  });
  svg.addEventListener("keydown", (ev) => {
    const d = ev.target.closest(".rd-dot");
    if (d && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); showEntry(d.dataset.slug); }
  });

  // Search: the same searchable words as the Library page (the searchText filter in eleventy.config.js).
  // Matching dots stay lit and the rest fade, and the first match is selected and shown in the
  // side panel as you type. Enter steps to the next match. Clearing the box goes back to the rings.
  const searchBox = document.getElementById("radar-search");
  const count = document.getElementById("radar-count");
  function applySearch() {
    const words = searchBox.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const hit = (e) => words.every((w) => e.search.includes(w));
    const hits = placed.filter(hit);
    svg.classList.toggle("is-searching", words.length > 0);
    svg.querySelectorAll(".rd-dot").forEach((d) => {
      const e = placed.find((p) => p.slug === d.dataset.slug);
      d.classList.toggle("is-match", words.length > 0 && hit(e));
    });
    count.textContent = !words.length ? "" : !hits.length ? "Nothing on the radar matches that yet."
      : hits.length === 1 ? "1 match" : `1 of ${hits.length} matches · Enter for the next`;
    return hits;
  }
  if (searchBox) {
    let hitIndex = 0;
    const clearSelection = () => {
      selected = null;
      svg.querySelectorAll(".rd-dot.is-on").forEach((d) => d.classList.remove("is-on"));
      showIntro();
    };
    searchBox.addEventListener("input", () => {
      const hits = applySearch();
      hitIndex = 0;
      if (hits.length) showEntry(hits[0].slug);
      else clearSelection();
    });
    searchBox.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        const hits = applySearch();
        if (!hits.length) return;
        hitIndex = (hitIndex + 1) % hits.length;
        showEntry(hits[hitIndex].slug);
        if (hits.length > 1) count.textContent = `${hitIndex + 1} of ${hits.length} matches · Enter for the next`;
      }
      if (ev.key === "Escape") { searchBox.value = ""; applySearch(); clearSelection(); }
    });
  }

  draw();
  drawRings();
  drawList();
  // /library/radar/#<page-slug> opens with that page selected.
  const fromAddress = decodeURIComponent(location.hash.slice(1));
  if (placed.some((e) => e.slug === fromAddress)) showEntry(fromAddress); else showIntro();
})();
