# red-thread-labs.com

The Red Thread Labs website, built with [Eleventy](https://www.11ty.dev/).

## Preview on your computer

```
npm install      # first time only: downloads Eleventy into node_modules/
npm start        # builds the site and serves it at http://localhost:8080, rebuilding as you save
```

Stop the preview with `Ctrl + C`.

While previewing, lineage pages marked `status: "review"` are shown with a dashed **Draft · in review** border.
They are left out of the real build (`npm run build`), so nothing goes live until you publish it.

## Reviewing and publishing a Research Roots page

Every lineage page is one entry in `_data/lineage.js`. To review one:

1. Run `npm start` and open `http://localhost:8080/lineage/`.
2. Edit the entry's text in `_data/lineage.js`. The page updates when you save.
3. Check every source has a `url` (a DOI link where one exists), so the research is linked.
4. When it's ready, change `status: "review"` to `status: "published"`.

The Esoteric & spiritual cluster is held back from this site for now.

## Where things live

| Path | What it is |
| --- | --- |
| `index.njk` | Home page (the hero) |
| `lineage/index.njk` | Research Roots index |
| `lineage/entry.njk` | Template for every lineage page |
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
