// Browsing the Research Library on /library/browse/: cluster filter chips, a search box,
// and the ‹ › buttons that scroll each side-scrolling row of cards.
// Each card carries its searchable text in data-search (written by _includes/partials/lineage-browse.njk).
(function () {
  const chips = [...document.querySelectorAll(".browse__chips .chip")];
  const search = document.getElementById("browse-search");
  const count = document.getElementById("browse-count");
  const empty = document.getElementById("browse-empty");
  const clusters = [...document.querySelectorAll(".browse .cluster")];
  if (!search || !clusters.length) return;

  let filter = "all";

  function apply() {
    const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown = 0;
    clusters.forEach((cl) => {
      const inFilter = filter === "all" || cl.dataset.cluster === filter;
      let inCluster = 0;
      cl.querySelectorAll(".entry-card").forEach((card) => {
        const hit = inFilter && words.every((w) => card.dataset.search.includes(w));
        card.hidden = !hit;
        if (hit) inCluster++;
      });
      cl.hidden = inCluster === 0;
      shown += inCluster;
      const row = cl.querySelector(".entry-cards--row");
      if (row) row.scrollLeft = 0;
      updateButtons(cl);
    });
    const total = document.querySelectorAll(".browse .entry-card").length;
    count.textContent = shown === total ? `${total} pages` : `Showing ${shown} of ${total} pages`;
    empty.hidden = shown !== 0;
  }

  function setFilter(id) {
    filter = id;
    chips.forEach((c) => {
      const on = c.dataset.filter === id;
      c.classList.toggle("is-on", on);
      c.setAttribute("aria-pressed", on);
    });
    apply();
  }

  chips.forEach((c) => c.addEventListener("click", () => setFilter(c.dataset.filter)));
  search.addEventListener("input", apply);
  document.getElementById("browse-clear")?.addEventListener("click", () => { search.value = ""; setFilter("all"); search.focus(); });

  // ‹ › buttons scroll a row by most of its width; they fade out at either end.
  function updateButtons(cl) {
    const row = cl.querySelector(".entry-cards--row");
    const [prev, next] = cl.querySelectorAll(".row-nav__btn");
    if (!row || !prev) return;
    prev.disabled = row.scrollLeft < 4;
    next.disabled = row.scrollLeft + row.clientWidth > row.scrollWidth - 4;
    cl.querySelector(".row-nav").hidden = prev.disabled && next.disabled;
  }
  clusters.forEach((cl) => {
    const row = cl.querySelector(".entry-cards--row");
    cl.querySelectorAll(".row-nav__btn").forEach((b) =>
      b.addEventListener("click", () => row.scrollBy({ left: b.dataset.dir * row.clientWidth * 0.85, behavior: "smooth" }))
    );
    row.addEventListener("scroll", () => updateButtons(cl), { passive: true });
  });
  window.addEventListener("resize", () => clusters.forEach(updateButtons));

  // A link to #cluster-id (like the map's "Jump to a cluster") shows that cluster if it was filtered out.
  function showHash() {
    const id = location.hash.slice(1);
    const target = clusters.find((cl) => cl.id === id);
    if (target && target.hidden) { search.value = ""; setFilter("all"); target.scrollIntoView(); }
  }
  window.addEventListener("hashchange", showHash);

  apply();
  showHash();
})();
