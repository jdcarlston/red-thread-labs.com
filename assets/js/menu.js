// Opens and closes the site menu panel (the phone menu, and the menu icon on the home page).
(function () {
  const panel = document.getElementById("site-menu");
  const toggles = document.querySelectorAll(".menu-toggle");
  if (!panel || !toggles.length) return;

  function setOpen(open) {
    panel.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    toggles.forEach((t) => t.setAttribute("aria-expanded", String(open)));
  }

  toggles.forEach((t) => t.addEventListener("click", () => setOpen(panel.hidden)));
  panel.addEventListener("click", (e) => {
    if (e.target.closest("a") || e.target.closest(".menu-close")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) setOpen(false); });
})();
