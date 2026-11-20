// Mailing-list sign-up. Works for every <form data-signup> on the page (see partials/signup.njk).
//
// Each sign-up goes two places:
//   1. the Netlify form "mailing-list" - your own copy of every sign-up, in the Netlify dashboard
//   2. Kit, through the /api/subscribe function (netlify/functions/subscribe.mjs)
// It counts as a success if either one works.

(function () {
  "use strict";

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var CONTACT = "contact@red-thread-labs.com";

  function field(form, name) {
    var el = form.elements[name];
    return el ? el.value.trim() : "";
  }

  function post(url, body, type) {
    return fetch(url, { method: "POST", headers: { "Content-Type": type }, body: body })
      .catch(function () { return { ok: false }; });
  }

  document.querySelectorAll("form[data-signup]").forEach(function (form) {
    var button = form.querySelector("button[type=submit]");
    var label = button.textContent;
    var msg = form.querySelector(".signup__msg");
    var asksName = !!form.elements.first_name;

    function say(text) { msg.innerHTML = text; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = field(form, "first_name");
      var email = field(form, "email");

      if (asksName && !first) { say("Please add your first name."); form.elements.first_name.focus(); return; }
      if (!EMAIL.test(email)) { say("That email doesn’t look quite right. Mind checking it?"); form.elements.email.focus(); return; }

      button.disabled = true;
      button.textContent = "Adding you…";
      say("");

      var netlifyCopy = post("/", new URLSearchParams(new FormData(form)).toString(), "application/x-www-form-urlencoded");
      var kit = post("/api/subscribe", JSON.stringify({
        email: email,
        first_name: first,
        last_name: field(form, "last_name"),
        "bot-field": field(form, "bot-field"),
        source: field(form, "source") || window.location.href,
      }), "application/json");

      Promise.all([netlifyCopy, kit]).then(function (results) {
        if (!results[0].ok && !results[1].ok) throw new Error("sign-up failed");
        var name = first ? ", " + first.replace(/[<>&]/g, "") : "";
        say("You’re on the list" + name + ". Check your inbox for a note asking you to confirm. One click and you’re in.");
        form.reset();
        button.textContent = "You’re on the list ✓";
      }).catch(function () {
        say("That didn’t go through. Try again in a moment, or email <a href=\"mailto:" + CONTACT + "\">" + CONTACT + "</a> and JD will add you by hand.");
        button.disabled = false;
        button.textContent = label;
      });
    });
  });
})();
