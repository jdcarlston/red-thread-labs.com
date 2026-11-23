---
# Research Library entry template, laid out like the Attachment Theory page.
#
# Don't edit this file to add an entry. Either use "New Research Library page" in the site editor
# (/admin while previewing), or run:
#     npm run new:lineage -- <slug> <cluster>
# e.g. npm run new:lineage -- sue-johnson attachment
# That copies this file to research-roots/<slug>.md with the slug, cluster and order filled in.
#
# Text uses Markdown: *italic*, **bold**, [link text](https://doi.org/...).
# Every claim should be backed by a source below, and every source should have a link
# (a DOI link, https://doi.org/..., where one exists). Where the text mentions a study or book,
# link it right there too: [the 1987 study](https://doi.org/...)
# Put text in "double quotes" if it contains a colon followed by a space.

slug: SLUG                  # the page address: /lineage/SLUG/ (must match the file name)
status: review              # review = only visible while previewing; published = live
cluster: CLUSTER            # a cluster id from research-roots/clusters.yml
order: 0                    # position within the cluster: lower comes first (10, 20, 30...)
title: Title of the idea    # what the page is called, e.g. Attachment Theory
people: Person Name (born–died) & Person Name     # shown under the title
field: Field of study
tagline: One line, in plain words, of what this research means for a person.

# Optional: a header photo just for this page (the file goes in media/img/).
# header:
#   image: img/FILE.jpg
#   position: 50% 50%
#   zoom: 1

# Who they were: two short paragraphs. What they found, and why it matters.
who:
  - "Paragraph one: who they were and what they found."
  - "Paragraph two: what their work led to, and why it matters now."

# Key concepts: four short cards. Bold the names of things with **double stars**.
concepts:
  - term: Concept one
    def: One or two sentences.
  - term: Concept two
    def: One or two sentences.
  - term: Concept three
    def: One or two sentences.
  - term: Concept four
    def: One or two sentences.

# Context (the oxblood panel): how this research connects to the work. Be honest about
# the strength of the evidence and where it's debated.
context: How this shows up in what people bring to a lab, and what the research does and doesn't support.

# In the Practice Labs: a practical exercise adapted from the research's own methods.
exercise:
  title: Name of the exercise
  time: About 15 minutes
  steps:
    - Step one.
    - Step two.
    - Step three.
    - Step four.
  why: Which finding or method this comes from, and why it helps. That source belongs in the sources list.

# Sources: the full citation, with a link. label is the link text.
sources:
  - cite: "Author Name & Author Name (Year), “Title of the study,” *Journal Name* volume(issue), pages."
    url: https://doi.org/...
    label: Read the study       # or View the book, Find the book

# Slugs of other Research Library pages to link to under the heart-line.
related: []

# The closing line, shown large and italic at the bottom of the page.
heartLine: A closing line in plain words.
---
