// Research Roots: Cybernetics
// See research-roots/_template.js for what each field does.

module.exports = {
  slug: "cybernetics",
  status: "review",
  cluster: "systems",
  order: 80,
  title: "Cybernetics",
  people: "Norbert Wiener · Warren McCulloch &amp; Walter Pitts · Roger Conant &amp; W. Ross Ashby",
  field: "Cybernetics · Systems",
  tagline: "Information is the pattern that steers.",

  who: [
    "Norbert Wiener founded cybernetics in 1948 as the science of “control and communication in the animal and the machine,” and insisted that information is its own category, “neither matter nor energy.” Earlier, <a href=\"https://doi.org/10.1007/BF02478259\" target=\"_blank\" rel=\"noopener\">Warren McCulloch and Walter Pitts (1943)</a> showed that simple model neurons could compute logic, launching the computational view of mind.",
    "Later, <a href=\"https://doi.org/10.1080/00207727008920220\" target=\"_blank\" rel=\"noopener\">Roger Conant and W. Ross Ashby (1970)</a> proved that every good regulator of a system must contain a model of that system. This tradition, carried through the Macy Conferences, is where Gregory Bateson found many of his ideas."
  ],

  concepts: [
    {
      term: "Feedback",
      def: "Systems steer by comparing results to goals and adjusting."
    },
    {
      term: "Information",
      def: "A pattern that guides, separate from the matter that carries it."
    },
    {
      term: "The good regulator",
      def: "To regulate something well, you need a model of it."
    },
    {
      term: "Circular causality",
      def: "A causes B, which causes more A. Loops, not lines."
    }
  ],

  context: "Cybernetics is the engineering pole of the labs. Relationships run on feedback loops. When you can see the loop, you can change your part of it, and regulation learned on purpose is the beginning of freedom.",

  exercise: {
    title: "Draw the loop",
    time: "About 15 minutes",
    steps: [
      "Pick a recurring pattern with someone. Write: “When I do ___, they do ___.”",
      "Continue: “When they do that, I do ___.” Keep going until it circles back.",
      "Draw it as a circle with arrows.",
      "Mark the point in the loop where you have the most choice.",
      "Write one different move you could make there."
    ],
    why: "Cybernetics describes systems as feedback loops rather than one-way causes. Drawing the loop shows that neither person is the sole cause, and that changing one link changes the whole circle."
  },

  sources: [
    {
      cite: "Norbert Wiener (1948), <em>Cybernetics: Or Control and Communication in the Animal and the Machine</em>. MIT Press.",
      url: "https://search.worldcat.org/search?q=Cybernetics+Norbert+Wiener+1948",
      label: "Find the book"
    },
    {
      cite: "Warren S. McCulloch &amp; Walter Pitts (1943), “A logical calculus of the ideas immanent in nervous activity,” <em>Bulletin of Mathematical Biophysics</em> 5, 115–133.",
      url: "https://doi.org/10.1007/BF02478259",
      label: "Read the study"
    },
    {
      cite: "Roger C. Conant &amp; W. Ross Ashby (1970), “Every good regulator of a system must be a model of that system,” <em>International Journal of Systems Science</em> 1(2), 89–97.",
      url: "https://doi.org/10.1080/00207727008920220",
      label: "Read the study"
    }
  ],

  related: ["gregory-bateson", "william-powers", "marvin-minsky"],
  heartLine: "See the loop, and you can change your part of it.",
};
