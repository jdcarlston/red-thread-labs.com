// Site-wide settings: name, contact details and the main menu.
// Add a menu item here and it appears on every page (desktop bar, phone menu and home menu panel).

module.exports = {
  name: "Red Thread Labs",
  url: "https://www.red-thread-labs.com",
  tagline: "Practice Labs to shift the habit loops shaping your life. Choose what you weave next.",
  email: "contact@red-thread-labs.com",
  mailingAddress: "P.O. Box 266, Draper, UT 84020",

  // Photos and other large files live in the media/ folder of this project. Once the Cloudflare R2
  // bucket "red-thread-labs-media" is live at media.red-thread-labs.com and the files are uploaded
  // (npm run media:upload), set useBucket to true and every page loads them from there instead.
  media: {
    base: "https://media.red-thread-labs.com",
    useBucket: true,
  },

  // The photo behind an inner page's header, unless the page sets its own with `header:` in its front matter.
  // position = which part of the photo stays in view; zoom = how far it's enlarged (1 = not at all).
  defaultHeader: { image: "img/love-lab-table.jpg", position: "50% 55%", zoom: 1 },
  // The roots photo is only for the Research Roots (lineage) pages, unless an entry or cluster sets its own.
  lineageHeader: { image: "img/roots-web.jpg", position: "75% 0%", zoom: 1.25 },

  // Ways to reach Red Thread Labs. These fill the icon rail on the right of the home page and the footer.
  // Leave a value empty ("") and its icon is simply left out.
  phone: "801-477-0497",
  bookingUrl: "https://calendly.com/jdcarlston/preliminary-consult",
  contactUrl: "/contact/", // the contact form, which emails the address above
  linkedin: "", // TODO: Red Thread Labs company page on LinkedIn, e.g. "https://www.linkedin.com/company/red-thread-labs"
  linkedinPersonal: "https://www.linkedin.com/in/jdcarlston", // JD's own profile, used until the company page is set
  instagram: "https://www.instagram.com/red.thread.labs/",
  instagramPersonal: "https://www.instagram.com/jaidy.93/",
  facebook: "", // TODO: Facebook page URL

  // JD's other sites, linked from the About pages.
  maddercraft: "https://maddercraft.com",
  jdcarlston: "https://jdcarlston.com",

  nav: [
    {
      label: "Practice Labs",
      href: "#",
      children: [
        { label: "How it works", href: "#" },
        { label: "Labs & workshops", href: "#" },
        { label: "Coaching", href: "#" },
        { label: "Retreats & gatherings", href: "#" },
        { label: "For teams", href: "#" },
      ],
    },
    {
      label: "Events",
      href: "/love/",
      children: [{ label: "The Love Lab", href: "/love/" }],
    },
    { label: "Level-Up", href: "/level-up/" },
    {
      label: "Lineage",
      href: "/lineage/",
      // Cluster links are built from _data/lineage.js, so only clusters with published pages show.
      fromLineage: true,
    },
    { label: "Blog", href: "/blog/" },
    {
      label: "About",
      href: "/about/",
      children: [
        { label: "Red Thread Labs", href: "/about/" },
        { label: "JD Carlston", href: "/about/jd/" },
        { label: "Contact", href: "/contact/" },
      ],
    },
  ],
};
