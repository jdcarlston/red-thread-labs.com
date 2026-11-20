// Research Roots: Wisecrowding
// See research-roots/_template.js for what each field does.

module.exports = {
  slug: "wisecrowding",
  status: "review",
  cluster: "facilitation",
  order: 30,
  title: "Wisecrowding",
  people: "JD Carlston · original work",
  field: "Organizational methodology · Collective intelligence",
  tagline: "We can be one by embracing the power and individuality of many.",

  who: [
    "Wisecrowding is JD Carlston’s original method for group decision-making, developed over her engineering leadership career. It draws on James Surowiecki’s <em>The Wisdom of Crowds</em> (2004), Scott Page’s work on <a href=\"https://doi.org/10.1073/pnas.0403723101\" target=\"_blank\" rel=\"noopener\">diverse problem solvers</a> and the diversity prediction theorem, research on <a href=\"https://doi.org/10.1126/science.1193147\" target=\"_blank\" rel=\"noopener\">collective intelligence</a>, and ensemble methods from machine learning.",
    "The idea: a diverse group, under the right conditions, can be wiser than its most expert member. Those conditions are diversity of perspective, independent thinking before discussion, no single person dominating, and a fair way to combine views. Some of the underlying math, especially how far Page’s results generalize, is still debated."
  ],

  concepts: [
    {
      term: "Diversity prediction theorem",
      def: "A crowd’s error equals average individual error minus the diversity of their guesses."
    },
    {
      term: "Four conditions",
      def: "Diversity, independence, decentralization, aggregation."
    },
    {
      term: "Cognitive diversity",
      def: "Different ways of seeing a problem."
    },
    {
      term: "People first",
      def: "Organizations exist to serve human lives, not the reverse."
    }
  ],

  context: "Wisecrowding connects JD’s engineering work to the labs: the same principles that make a diverse team smarter make a diverse room of learners wiser. It’s one reason the labs are structure-agnostic: people in many kinds of relationships see things others miss.",

  exercise: {
    title: "Think alone, then together",
    time: "About 30 minutes, with a group",
    steps: [
      "Pick a real question your group needs to answer.",
      "Have everyone write their answer privately first, without discussion.",
      "Share all answers before anyone argues for theirs.",
      "Notice where people differ, and ask what each person sees that others might not.",
      "Combine the answers deliberately, and compare the result with what the loudest voice would have chosen."
    ],
    why: "Research on group judgment shows that independent thinking before discussion protects a group’s diversity, which is what makes its combined judgment better. Writing privately first is one of the simplest ways to keep it."
  },

  sources: [
    {
      cite: "James Surowiecki (2004), <em>The Wisdom of Crowds</em>. Doubleday.",
      url: "https://search.worldcat.org/search?q=The+Wisdom+of+Crowds+Surowiecki",
      label: "Find the book"
    },
    {
      cite: "Lu Hong &amp; Scott E. Page (2004), “Groups of diverse problem solvers can outperform groups of high-ability problem solvers,” <em>Proceedings of the National Academy of Sciences</em> 101(46), 16385–16389.",
      url: "https://doi.org/10.1073/pnas.0403723101",
      label: "Read the study"
    },
    {
      cite: "Anita Williams Woolley, Christopher F. Chabris, Alex Pentland, Nada Hashmi &amp; Thomas W. Malone (2010), “Evidence for a collective intelligence factor in the performance of human groups,” <em>Science</em> 330(6004), 686–688.",
      url: "https://doi.org/10.1126/science.1193147",
      label: "Read the study"
    },
    {
      cite: "Scott E. Page (2017), <em>The Diversity Bonus</em>. Princeton University Press.",
      url: "https://search.worldcat.org/search?q=The+Diversity+Bonus+Scott+Page",
      label: "Find the book"
    }
  ],

  related: ["simon-wardley", "brave-spaces", "priya-parker"],
  heartLine: "Build the crowd, then let it be wiser than any one of you.",
};
