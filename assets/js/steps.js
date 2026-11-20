// A long form split into pages. Used by the Love Ability Lab application.
//
// Markup: <form data-steps> containing <fieldset data-step> pages, buttons with data-back,
// data-next and data-submit, a .stepped__progress bar, a .stepped__count line and a
// .stepped__error line. A field wrapped in data-show-when="name=value1,value2" only appears
// when that radio button is chosen. The finished form is sent to Netlify Forms, then the
// .stepped__done section is shown in its place.

(function () {
  "use strict";

  document.querySelectorAll("form[data-steps]").forEach(function (form) {
    var pages = Array.prototype.slice.call(form.querySelectorAll("[data-step]"));
    var back = form.querySelector("[data-back]");
    var next = form.querySelector("[data-next]");
    var submit = form.querySelector("[data-submit]");
    var bar = form.querySelector(".stepped__progress span");
    var count = form.querySelector(".stepped__count");
    var error = form.querySelector(".stepped__error");
    var done = document.querySelector(".stepped__done");
    var current = 0;

    function show(i, scroll) {
      current = i;
      pages.forEach(function (p, n) { p.hidden = n !== i; });
      back.hidden = i === 0;
      next.hidden = i === pages.length - 1;
      submit.hidden = i !== pages.length - 1;
      bar.style.width = ((i + 1) / pages.length) * 100 + "%";
      count.textContent = "Page " + (i + 1) + " of " + pages.length;
      error.textContent = "";
      if (scroll) form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Checks the required fields on one page; returns true if they're all filled in.
    function pageIsComplete(page) {
      var fields = page.querySelectorAll("input, select, textarea");
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        if (f.closest("[hidden]") && f.closest("[hidden]") !== page) continue;
        if (!f.checkValidity()) {
          error.textContent = f.type === "email" && f.value
            ? "That email doesn’t look quite right."
            : "Please answer the required questions on this page.";
          f.focus();
          return false;
        }
      }
      return true;
    }

    // Fields that only appear for certain answers.
    form.querySelectorAll("[data-show-when]").forEach(function (block) {
      var rule = block.getAttribute("data-show-when").split("=");
      var name = rule[0], values = rule[1].split(",");
      form.querySelectorAll('[name="' + name + '"]').forEach(function (input) {
        input.addEventListener("change", function () { block.hidden = values.indexOf(input.value) === -1; });
      });
    });

    next.addEventListener("click", function () { if (pageIsComplete(pages[current])) show(current + 1, true); });
    back.addEventListener("click", function () { show(current - 1, true); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!pageIsComplete(pages[current])) return;
      submit.disabled = true;
      submit.textContent = "Sending…";
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString(),
      }).then(function (res) {
        if (!res.ok) throw new Error("not sent");
        form.hidden = true;
        done.hidden = false;
        done.focus();
        done.scrollIntoView({ behavior: "smooth", block: "start" });
      }).catch(function () {
        error.innerHTML = "That didn’t go through. Try again in a moment, or email <a href=\"mailto:contact@red-thread-labs.com\">contact@red-thread-labs.com</a>.";
        submit.disabled = false;
        submit.textContent = "Submit Application →";
      });
    });

    show(0);
  });
})();
