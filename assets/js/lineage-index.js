// Searching the Library Index on /library/a-z/.
// Each entry carries its searchable words in data-search (its name, and its page or topic).
// Typing hides the entries that don't match every word, then hides any letter, list or
// letter link that has nothing left in it.
(function () {
  const search = document.getElementById("index-search");
  const count = document.getElementById("index-count");
  const empty = document.getElementById("index-empty");
  if (!search) return;
  const items = [...document.querySelectorAll(".lib-index__group li")];

  function apply() {
    const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown = 0;
    items.forEach((li) => {
      const hit = words.every((w) => li.dataset.search.includes(w));
      li.hidden = !hit;
      if (hit) shown++;
    });
    // A letter group with no entries left is hidden, and so is its letter link.
    document.querySelectorAll(".lib-index__group").forEach((g) => {
      g.hidden = ![...g.querySelectorAll("li")].some((li) => !li.hidden);
      const link = document.querySelector(`.lib-index__letters a[href="#${g.id}"]`);
      if (link) link.hidden = g.hidden;
    });
    // So is a whole part (Pages or Ideas) when nothing in it matches.
    document.querySelectorAll(".lib-index__part").forEach((part) => {
      part.hidden = ![...part.querySelectorAll(".lib-index__group")].some((g) => !g.hidden);
    });
    count.textContent = words.length ? `${shown} ${shown === 1 ? "match" : "matches"}` : "";
    empty.hidden = !(words.length && shown === 0);
  }

  search.addEventListener("input", apply);
  search.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") { search.value = ""; apply(); }
  });
})();
