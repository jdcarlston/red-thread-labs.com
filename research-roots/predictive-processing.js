// Research Roots: Predictive Processing
// See research-roots/_template.js for what each field does.

module.exports = {
  slug: "predictive-processing",
  status: "review",
  cluster: "perception",
  order: 10,
  title: "Predictive Processing",
  people: "Karl Friston · Andy Clark · Anil Seth · Jakob Hohwy",
  field: "Computational neuroscience · Philosophy of mind",
  tagline: "You see your best guess about the world, corrected where it’s wrong.",

  who: [
    "Predictive processing is now one of the leading accounts of how brains work. The brain runs a model of the world and the body, predicts what its senses will report, and mostly passes forward only the errors. Karl Friston formalized it as the <a href=\"https://doi.org/10.1038/nrn2787\" target=\"_blank\" rel=\"noopener\">free-energy principle</a>.",
    "Andy Clark <a href=\"https://doi.org/10.1017/S0140525X12000477\" target=\"_blank\" rel=\"noopener\">made the idea accessible</a> in philosophy and in <em>Surfing Uncertainty</em> (2016). Anil Seth, in <em>Being You</em> (2021), calls perception a “controlled hallucination”: the brain’s best guess, kept in check by the senses. The roots go back to Hermann von Helmholtz’s idea of unconscious inference in the 1860s."
  ],

  concepts: [
    {
      term: "Prediction first",
      def: "The brain guesses what’s coming, then checks."
    },
    {
      term: "Prediction error",
      def: "The gap between guess and reality is what drives learning."
    },
    {
      term: "Priors",
      def: "Strong expectations shape what we perceive, sometimes more than the data."
    },
    {
      term: "Active inference",
      def: "We also act to make the world match our predictions."
    }
  ],

  context: "Predictive processing is the scientific frame under much of the labs’ language about maps. A relationship pattern is, in part, a prediction: “people leave,” “I’ll be criticized.” The brain tends to see what it expects. New experience that doesn’t fit, noticed on purpose, is how the prediction gets updated.",

  exercise: {
    title: "Predict, then check",
    time: "Five minutes before and after an event, for a week",
    steps: [
      "Before a social situation this week, write down what you expect: how people will act, how you’ll feel, how it will end.",
      "Go, and pay attention.",
      "Afterward, write what actually happened.",
      "Circle where your prediction was wrong, in either direction.",
      "At the end of the week, look for patterns. Which predictions keep missing?"
    ],
    why: "Predictive processing says learning happens through prediction error. Writing predictions down makes the errors visible, which helps your brain update expectations it would otherwise quietly confirm."
  },

  sources: [
    {
      cite: "Karl Friston (2010), “The free-energy principle: A unified brain theory?” <em>Nature Reviews Neuroscience</em> 11(2), 127–138.",
      url: "https://doi.org/10.1038/nrn2787",
      label: "Read the study"
    },
    {
      cite: "Andy Clark (2013), “Whatever next? Predictive brains, situated agents, and the future of cognitive science,” <em>Behavioral and Brain Sciences</em> 36(3), 181–204.",
      url: "https://doi.org/10.1017/S0140525X12000477",
      label: "Read the study"
    },
    {
      cite: "Anil Seth (2021), <em>Being You: A New Science of Consciousness</em>. Dutton.",
      url: "https://search.worldcat.org/search?q=Being+You+Anil+Seth",
      label: "Find the book"
    }
  ],

  related: ["lisa-feldman-barrett", "william-powers", "default-mode-network"],
  heartLine: "Loosen the prediction and more of the world gets through.",
};
