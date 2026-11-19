// Research Roots: the lineage behind Practice Labs.
//
// Each entry becomes its own page at /lineage/<slug>/. To review and publish:
//   status: "review"    -> shows only on your computer while previewing (npm start), with a DRAFT ribbon
//   status: "published" -> shows on the live site
//
// Header photo: give an entry (or a whole cluster) its own photo with
//   header: { image: "img/<file>.jpg", position: "50% 50%", zoom: 1 }
// The file goes in media/img/. Without one, the page uses the default roots photo.
//
// Every page needs its research linked: give each source a `url` (a DOI link where one exists).
// Text fields may contain simple HTML (<em>, <strong>, <a>).
// Held back for now: the Esoteric & spiritual cluster (not on red-thread-labs.com).

const clusters = [
  {
    id: "attachment",
    title: "Attachment & relationships",
    blurb: "How early bonds shape the way we reach for each other, and the research showing those patterns can change.",
  },
  {
    id: "change-work",
    title: "NLP & change work",
    blurb: "The practitioners who mapped how people change, and how to make change last.",
  },
  {
    id: "therapy",
    title: "Therapy & humanistic psychology",
    blurb: "The clinicians and researchers whose work on the whole person runs through every lab.",
  },
];

const entries = [
  {
    slug: "attachment-theory",
    status: "published",
    cluster: "attachment",
    title: "Attachment Theory",
    people: "John Bowlby (1907–1990) & Mary Ainsworth (1913–1999)",
    field: "Developmental psychology",
    tagline: "We are shaped by who was there when we reached out.",
    who: [
      "Bowlby showed that the bond between child and caregiver isn’t learned dependency. It’s an evolved survival system, as basic as feeding. Ainsworth’s “Strange Situation” studies identified secure, anxious-ambivalent and avoidant patterns in how infants use a caregiver as a safe base and a haven. Mary Main later added the disorganized pattern.",
      "Their work is the backbone of adult attachment research, Emotionally Focused Therapy, and our whole picture of how early safety, or its absence, organizes a life.",
    ],
    concepts: [
      { term: "Safe base & haven", def: "A secure figure is both a base to explore from and a haven to return to. Feeling safe is what lets a person venture out." },
      { term: "The four patterns", def: "Secure, anxious-ambivalent, avoidant and (Main) disorganized: strategies for staying connected to an imperfect caregiver." },
      { term: "Internal working models", def: "Early bonds lay down quiet expectations about the self (“am I worth care?”) and others (“will they come?”) that carry into adulthood." },
      { term: "The Strange Situation", def: "Ainsworth’s observational method: a short separation and reunion reveal the strategy a child uses under stress." },
    ],
    inPractice:
      "The urge to <em>reach toward</em> and the urge to <em>withdraw from</em> that people bring into a lab are these patterns, grown up. Early expectations of “am I worth care?” and “will they come?” run quietly underneath. The work doesn’t relabel anyone. It helps people build an <em>earned</em> security where a given one was missing.",
    sources: [
      { cite: "John Bowlby, <em>Attachment and Loss</em>, 3 vols. (1969–1980)." },
      {
        cite: "Mary D. S. Ainsworth &amp; Silvia M. Bell (1970), “Attachment, exploration, and separation: Illustrated by the behavior of one-year-olds in a strange situation,” <em>Child Development</em> 41(1), 49–67.",
        url: "https://doi.org/10.2307/1127388",
        label: "Read the study",
      },
      {
        cite: "Mary D. S. Ainsworth, Mary C. Blehar, Everett Waters &amp; Sally Wall (1978), <em>Patterns of Attachment: A Psychological Study of the Strange Situation</em>.",
        url: "https://doi.org/10.4324/9780203758045",
        label: "View the book",
      },
    ],
    related: ["earned-secure-attachment"],
    heartLine: "Security isn’t something you were given or denied for good. It can be earned.",
  },
  {
    slug: "earned-secure-attachment",
    status: "review",
    cluster: "attachment",
    title: "Earned Secure Attachment",
    people: "Pearson, Cohn, Cowan &amp; Cowan (1994) · Roisman, Padrón, Sroufe &amp; Egeland (2002)",
    field: "Developmental psychology",
    tagline: "A hard start is not a life sentence.",
    who: [
      "Pearson and colleagues named <em>earned security</em>: adults who describe a genuinely difficult childhood yet make sense of it coherently, and who parent as warmly as people who had good-enough beginnings, though the old pain can still weigh on their mood.",
      "Roisman and colleagues tested the idea against a study that followed people from birth into their twenties, and refined it. Coherent security can be reached despite adversity.",
    ],
    concepts: [
      { term: "Earned security", def: "A coherent, secure stance reached despite a painful history." },
      { term: "Coherence over history", def: "What predicts adult security is how you make sense of your story, not how good it was." },
      { term: "The Adult Attachment Interview", def: "Mary Main’s method, in which security shows up as a coherent story told under pressure." },
      { term: "Reorganization is real", def: "Attachment patterns can change across a life." },
    ],
    inPractice:
      "This is the research behind “the map can change.” The patterns that feel like <em>who you are</em> can be re-mapped and re-trained. To be honest about the evidence: it supports reaching coherent security, but the simple “insecure as a baby, secure as an adult” story is still debated and the measures are imperfect. The labs stay on the ground the research supports: security can be <em>earned</em>.",
    sources: [
      {
        cite: "Jane L. Pearson, Deborah A. Cohn, Philip A. Cowan &amp; Carolyn Pape Cowan (1994), “Earned- and continuous-security in adult attachment: Relation to depressive symptomatology and parenting style,” <em>Development and Psychopathology</em> 6(2), 359–373.",
        url: "https://doi.org/10.1017/S0954579400004636",
        label: "Read the study",
      },
      {
        cite: "Glenn I. Roisman, Elena Padrón, L. Alan Sroufe &amp; Byron Egeland (2002), “Earned-secure attachment status in retrospect and prospect,” <em>Child Development</em> 73(4), 1204–1219.",
        url: "https://doi.org/10.1111/1467-8624.00467",
        label: "Read the study",
      },
    ],
    related: ["attachment-theory"],
    heartLine: "You don’t need to have started secure to become it.",
  },
];

module.exports = { clusters, entries };
