// Every file in blog/posts/ is a blog post: it uses the post layout and is listed on /blog/.
// Posts can be .njk (HTML) or .md (Markdown). A post can set its own `header:` photo.
module.exports = {
  layout: "layouts/post.njk",
  tags: ["post"],
  eleventyComputed: {
    // The search-result and link-preview summary falls back to the one-line dek.
    description: (data) => data.description || data.dek,
  },
  header: { image: "img/pomegranate-table.jpg", position: "50% 55%", zoom: 1 },
};
