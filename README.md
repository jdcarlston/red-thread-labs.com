# red-thread-labs.com

The Red Thread Labs website, built with [Eleventy](https://www.11ty.dev/).

## Preview on your computer

```
npm install      # first time only: downloads Eleventy into node_modules/
npm start        # builds the site and serves it at http://localhost:8080, rebuilding as you save
```

Stop the preview with `Ctrl + C`.

Every Research Library page has a status:

- `published`: you've reviewed it. Live, no marker.
- `review`: not reviewed yet. Live, with a small **Draft** marker that only shows in your preview.
- `hidden`: kept off the live site. Shows only in your preview, with a dashed **Hidden** border.

## Reviewing and publishing a Research Library page

Every Research Library page is one file in `research-roots/` (or edit it at `/admin`). To review one:

1. Run `npm start` and open `http://localhost:8080/library/`.
2. Edit its file in `research-roots/`. The page updates when you save.
3. Check every source has a `url` (a DOI link where one exists), so the research is linked.
4. When it's ready, change `status: "review"` to `status: "published"`. The Draft marker goes away.

The Esoteric & spiritual cluster is held back from this site for now.

## Where things live

| Path | What it is |
| --- | --- |
| `index.njk` | Home page (the hero) |
| `library/index.njk` | Research Library index |
| `library/entry.njk` | Template for every lineage page |
| `_data/site.js` | Site name, contact details, booking link and the menu |
| `_data/lineage.js` | Lineage clusters and pages |
| `_includes/` | Page layout, header, menu and footer |
| `lib/` | Draws the logo, the red threads and the hero artwork as SVG |
| `assets/css/site.css` | All styles (colours are at the top) |
| `assets/` | Styles, script and the logo file (always served with the site) |
| `media/` | Photos and other large files (served from the Cloudflare bucket once it's on) |
| `contact/` | Contact form and its thank-you page |

## Photos and the media bucket

Photos live in `media/`. Until the Cloudflare R2 bucket is ready they're served with the site.
When `media.red-thread-labs.com` is live:

1. `npm run media:upload` copies everything in `media/` to the `red-thread-labs-media` bucket
   (rclone `copy` only adds and updates files; `--progress` shows each file as it uploads).
2. In `_data/site.js`, set `media.useBucket` to `true`. Every page then loads photos from the bucket.

To give a lineage page its own header photo, put the file in `media/img/` and add
`header: { image: "img/<file>.jpg", position: "50% 50%", zoom: 1 }` to its entry in `_data/lineage.js`.

## Contact form

The form on `/contact/` uses Netlify Forms. After the site is on Netlify, turn on
**Site configuration → Forms → Form notifications → Email notification** and send it to
`contact@red-thread-labs.com`, so every message lands in that inbox.

## Before connecting Netlify

The live site still runs from the old files in the shared drive (`!Red Thread Labs/04 Website`).
Don't link this repo to Netlify until the pages that need to stay live (blog posts such as
`blog/essay-agape.html`, events, offers) have been moved over, or they'll disappear.

## Pages moved from the old site

| Address | File | Notes |
|---|---|---|
| `/level-up/` | `level-up/index.njk` | The old home page (Level-Up Sessions) |
| `/love/` | `love/index.njk` | The Love Lab event page |
| `/blog/`, `/blog/essay-agape.html` | `blog/index.njk`, `blog/posts/agape.njk` | Add a post: copy `agape.njk` in `blog/posts/` and change the front matter |
| `/date-ability-lab-application-form.html` | `date-ability-lab-application-form.njk` | Now sends to the Netlify form `love-ability-application` |

**Private pages** live in `private/`, which git never sends to GitHub. They build in your
preview on your Mac, but they are not on the live site. Share them another way when needed.

**Shared pieces:** `partials/signup.njk` (mailing-list form, saved to Netlify and Kit), `partials/booking.njk`
(consult / Level-Up / mail-list cards, links in `_data/booking.js`), `partials/blog-cta.njk`.

**Server functions** live in `netlify/functions/` (checkout, seats, Square webhook, subscribe) and answer at `/api/...`.
Their keys are environment variables in Netlify, never in this repo. The reminder scripts are in `netlify/scripts/`.

**Old addresses kept alive:** `legacy/` is copied to the top of the site, so `legacy/img/rtl-email-logo.png`
is still at `/img/rtl-email-logo.png` for emails already sent. Redirects are in `netlify.toml`.

**New photos:** put them in `media/img/`, then run `npm run media:upload`. While previewing (`npm start`)
photos load from your Mac, so you can see them before uploading.

## Research Library (the lineage pages)

Each entry is its own plain-text file in `research-roots/`, like `research-roots/attachment-theory.md`:
labeled fields between the `---` lines at the top. Text uses Markdown: `*italic*`, `**bold**`,
`[link text](https://doi.org/...)`.

- **Edit in the site editor:** while previewing, open http://localhost:8080/admin/ in Chrome or Edge,
  choose "Work with Local Repository" and pick this folder. Save, then commit and push as usual.
- **Or edit the file** in any text editor.
- **Add an entry:** "New Research Library page" in the editor, or `npm run new:lineage -- <slug> <cluster>`,
  for example `npm run new:lineage -- sue-johnson attachment`. That copies
  `scripts/research-roots-template.md` to `research-roots/sue-johnson.md` with the slug, cluster and
  order filled in; every field is explained in the template.
- **Clusters** (and their order on `/library/`) are in `research-roots/clusters.yml`.
- **Order within a cluster:** the `order` number, lowest first (10, 20, 30...).
- **Publish:** change `status: review` to `status: published`. Review entries only show
  while previewing, with a DRAFT ribbon.
- Edits to these files show up in the preview without restarting it.
