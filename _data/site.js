// Site-wide settings: name, contact details and the main menu.
// Add a menu item here and it appears on every page (desktop bar, phone menu and home menu panel).

module.exports = {
  name: "Red Thread Labs",
  url: "https://red-thread-labs.com",
  tagline: "Find the habit loops shaping your life. Choose what you weave next.",
  email: "contact@red-thread-labs.com",
  mailingAddress: "P.O. Box 266, Draper, UT 84020",

  // Photos and other large files live in the media/ folder of this project. Once the Cloudflare R2
  // bucket "red-thread-labs-media" is live at media.red-thread-labs.com and the files are uploaded
  // (npm run media:upload), set useBucket to true and every page loads them from there instead.
  media: {
    base: "https://media.red-thread-labs.com",
    useBucket: true,
  },

  // The photo behind an inner page's header, unless the page or its lineage cluster sets its own.
  // position = which part of the photo stays in view; zoom = how far it's enlarged (1 = not at all).
  defaultHeader: { image: "img/roots-web.jpg", position: "75% 0%", zoom: 1.25 },

  // Ways to reach Red Thread Labs. These fill the icon rail on the right of the home page and the footer.
  // Leave a value empty ("") and its icon is simply left out.
  phone: "", // TODO: business phone, e.g. "+1 801 555 0100"
  bookingUrl: "https://calendly.com/jdcarlston/preliminary-consult",
  contactUrl: "/contact/", // the contact form, which emails the address above
  linkedin: "https://www.linkedin.com/in/jdcarlston",
  instagram: "https://www.instagram.com/red.thread.labs/",
  facebook: "", // TODO: Facebook page URL

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
    { label: "Events", href: "#" },
    { label: "Level-Up", href: "#" },
    {
      label: "Lineage",
      href: "/lineage/",
      // Cluster links are built from _data/lineage.js, so only clusters with published pages show.
      fromLineage: true,
    },
    { label: "Blog", href: "#" },
    {
      label: "About",
      href: "#",
      children: [
        { label: "JD Carlston", href: "#" },
        { label: "Contact", href: "/contact/" },
      ],
    },
  ],
};
