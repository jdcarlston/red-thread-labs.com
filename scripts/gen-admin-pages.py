"""Writes the "Pages" collection of admin/config.yml (the site editor) from the field lists below.
Run from the project folder:  python3 scripts/gen-admin-pages.py
It replaces everything from the "Pages:" marker line to the end of admin/config.yml, so keep the
Pages collection last in that file. Block types match _includes/partials/rows.njk."""
import yaml

CONFIG = "admin/config.yml"
MARKER = "  # ---------- Pages"

s = open(CONFIG).read()
base = s[: s.index(MARKER)]


def F(name, label, widget="string", **kw):
    d = {"name": name, "label": label, "widget": widget}
    d.update(kw)
    return d


MD = "Markdown: *italic*, **bold**, [link](https://...). Links can be @booking or @email."


def paras(name, label):
    return F(name, label, "list", field=F("p", "Paragraph", "text"), required=False)


buttons = F("buttons", "Buttons", "list", required=False, summary="{{fields.text}}", fields=[
    F("text", "Text"),
    F("link", "Link", hint="A page like /contact/, a full address, #join, @booking or @email"),
    F("style", "Style", "select", options=["primary", "ghost"], default="primary"),
])

common = [
    F("id", "Section address (id)", required=False, hint="Lets a link jump here, like /about/#values. Keep it if a menu uses it."),
    F("bare", "No box around it", "boolean", required=False, hint="Used in the colored bands; leave as it is."),
    F("center", "Centered", "boolean", required=False),
    F("wide", "Full-width text", "boolean", required=False, hint="Text runs the full width of the page."),
    F("label", "Small label", required=False),
    F("statement", "Big italic statement", "text", required=False, hint=MD),
    F("heading", "Heading", required=False),
    F("rule", "Red line under a statement", "boolean", required=False, hint="A heading always gets the red line."),
    F("lede", "Lead paragraph", "text", required=False, hint=MD),
    paras("paragraphs", "Paragraphs (softer text)"),
    paras("plain", "Paragraphs (regular text)"),
    paras("prose", "Paragraphs (reading width)"),
]
ending = [paras("after", "Paragraphs after the list"), buttons, F("note", "Small note at the end", "text", required=False)]


def T(name, label, extra):
    return {"name": name, "label": label, "widget": "object", "fields": common + extra + ending}


types = [
    T("text", "Text", []),
    T("checklist", "Checklist", [
        F("listLabel", "Label right above the list", required=False),
        F("ordered", "Numbered list", "boolean", required=False),
        F("items", "Items", "list", field=F("i", "Item", "text")),
    ]),
    T("steps", "Steps", [F("items", "Steps", "list", summary="{{fields.num}} {{fields.title}}", fields=[
        F("num", "Number", required=False), F("title", "Title", required=False), F("text", "Text", "text")])]),
    T("cards", "Cards", [F("columns", "Cards per row", "select", options=[{"label": "Two (half width)", "value": 2}, {"label": "As many as fit", "value": 0}], required=False), F("items", "Cards", "list", summary="{{fields.title}}", fields=[
        F("id", "Address (id)", required=False), F("label", "Small label", required=False), F("title", "Title"),
        F("text", "Text", "text"), F("button", "Button text", required=False), F("link", "Button link", required=False)])]),
    T("facts", "Facts", [F("items", "Facts", "list", summary="{{fields.label}}: {{fields.value}}", fields=[
        F("label", "Label"), F("value", "Value"), F("note", "Note", required=False)])]),
    T("values", "Values list", [F("items", "Values", "list", summary="{{fields.name}}", fields=[
        F("name", "Name"), F("text", "Text", "text")])]),
    T("offers", "Ways to work together", [F("items", "Rows", "list", summary="{{fields.title}}", fields=[
        F("title", "Title"), F("text", "Text", "text"), F("linkText", "Link text", required=False), F("link", "Link", required=False)])]),
    T("faq", "Questions", [F("items", "Questions", "list", summary="{{fields.q}}", fields=[
        F("q", "Question"), F("a", "Answer", "text")])]),
    T("about", "Photo beside text", [
        F("image", "Photo (like img/photo.jpg)"), F("alt", "Photo description"),
        F("text", "Paragraphs", "list", field=F("p", "Paragraph", "text"))]),
    T("photos", "Row of photos", [F("images", "Photos", "list", fields=[
        F("image", "Photo (like img/photo.jpg)"), F("alt", "Photo description")])]),
    T("signup", "Mail-list sign-up", [
        F("signupSource", "Where they signed up (shows in Kit)"), F("button", "Button text", required=False),
        F("names", "Ask for names too", "boolean", required=False), F("fine", "Small print", required=False),
        F("formId", "Form id", required=False, hint="Leave as it is.")]),
    T("heart", "Closing heart-lines", [F("lines", "Lines", "list", field=F("l", "Line")), F("anchor", "Last line", required=False)]),
    T("bigdate", "Big date", [F("big", "Big word (the date)"), F("place", "Place", required=False)]),
    {"name": "include", "label": "Built-in section", "widget": "object", "fields": [
        F("name", "Which one", "select", options=["about-jd", "booking", "posts", "contact", "lineage-browse", "lineage-map", "lineage-radar"],
          hint="The words of about-jd are under Pages → Shared blocks."),
        F("signupSource", "Booking: where they signed up", required=False),
        F("consultWas", "Booking: consult was", required=False),
        F("price", "Booking: session price", required=False),
        F("priceWas", "Booking: price was", required=False),
        F("rate", "Booking: rate note", required=False),
        F("heading", "Contact: heading", required=False),
        F("topics", "Contact: topics", "list", required=False, field=F("t", "Topic")),
        F("button", "Contact: button text", required=False),
        F("moreText", "Blog: read more text", required=False),
        F("mapTitle", "Research Library: map title", required=False),
        F("mapBlurb", "Research Library: map hint", "text", required=False),
        F("searchPlaceholder", "Research Library: search hint", required=False),
        F("radarTitle", "Research Radar: title", required=False),
        F("radarBlurb", "Research Radar: intro", "text", required=False),
        F("emptyText", "Research Library: nothing found text", required=False),
    ]},
]

rows = F("rows", "Sections (top to bottom)", "list", summary="{{fields.style}} {{fields.id}}", fields=[
    F("style", "Background", "select", options=["band", "band-alt", "band-center", "reading", "reading-dark", "photo"], default="band",
      hint="band = darkest, band-alt = a little lighter, reading = the reading background, photo = a photo behind it"),
    F("main", "Main content", "boolean", required=False, hint="On for the section the skip link jumps to (one per page)."),
    F("id", "Address (id)", required=False),
    F("label", "Name for screen readers", required=False),
    F("inner", "Extra class", required=False, hint="Leave as it is."),
    F("image", "Photo (photo style only)", required=False),
    F("include", "Built-in band", required=False, hint="blog-cta adds the mail-list band; leave the rest empty."),
    F("blocks", "Blocks", "list", required=False, typeKey="type", types=types),
])

header = F("header", "Header photo", "object", required=False, collapsed=True, fields=[
    F("image", "Photo (like img/photo.jpg)"), F("position", "Position", default="50% 50%"),
    F("zoom", "Zoom", "number", value_type="float", default=1), F("color", "Keep full color", "boolean", required=False)])
head = [
    F("title", "Page title (browser tab)"),
    F("description", "Description (search results and shares)", "text", required=False),
    F("kicker", "Small label above the heading", required=False),
    F("heading", "Heading", required=False),
    F("subtitle", "Subtitle", required=False),
    header,
]


def page(name, label, extra=(), desc=None):
    d = {"name": name, "label": label, "file": f"_data/pages/{name}.yml", "fields": head + list(extra) + [rows]}
    if desc:
        d["description"] = desc
    return d


hero = F("hero", "Photo at the top (event hero)", "object", fields=[
    F("image", "Photo"), F("position", "Position"), F("kicker", "Small label"), F("tagline", "Tagline", "text"),
    F("date", "Big date"), F("place", "Place"), F("cta", "Button text"), F("note", "Note under the button", "text")])

jd = {"name": "jd", "label": "JD's page (/about/jd/)", "file": "_data/jd.yml",
      "description": "Text uses Markdown. Photos are file names in media/img, like img/jd-headshot.jpg.",
      "fields": [
          F("subtitle", "Subtitle under your name"), F("photo", "Photo beside your story"),
          F("photoAlt", "Photo description (for screen readers)"), F("lede", "Opening line"),
          F("story", "Your story (one paragraph each)", "list", field=F("paragraph", "Paragraph", "text")),
          F("practices", "Practices section", "object", fields=[
              F("label", "Small label"), F("heading", "Heading"),
              F("cards", "Cards", "list", summary="{{fields.label}}", fields=[
                  F("label", "Small label"), F("heading", "Heading"), F("text", "Text", "text"),
                  F("button", "Button text", required=False),
                  F("link", "Button link", required=False, hint="A page like /level-up/ or a full address like https://...")])]),
          F("method", "Method section", "object", fields=[F("label", "Small label"), F("heading", "Heading"),
              F("text", "Paragraphs", "list", field=F("paragraph", "Paragraph", "text"))]),
          F("artist", "Artist section", "object", fields=[F("label", "Small label"), F("heading", "Heading"),
              F("text", "Paragraphs", "list", field=F("paragraph", "Paragraph", "text")),
              F("links", "Links", "list", fields=[F("text", "Link text"), F("link", "Address")])]),
          F("partner", "Partner section", "object", fields=[F("label", "Small label"), F("photo", "Photo"),
              F("photoAlt", "Photo description"), F("text", "Text", "text")]),
          F("closing", "Closing invitation", "object", fields=[F("heading", "Heading"), F("text", "Text", "text")]),
      ]}

files = [
    {"name": "home", "label": "Home", "file": "_data/pages/home.yml", "fields": [
        F("tagline", "Tagline", "text"), F("background", "Background photo"),
        F("signup", "Sign-up", "object", fields=[F("button", "Button text"), F("fine", "Small print")])]},
    page("about", "About"),
    jd,
    page("love", "The Love Lab", [F("ogTitle", "Title when shared", required=False), hero]),
    page("level-up", "Level-Up Sessions"),
    page("practice-labs", "Practice Labs (draft)"),
    page("contact", "Contact", desc="The email, phone and social links on this page come from _data/site.js."),
    page("thanks", "Contact: thank you"),
    page("blog", "Blog"),
    page("research-roots", "Research Library", [F("lineageHeader", "Use the Research Library header photo", "boolean", required=False)]),
    page("research-radar", "Research Radar (draft)", [F("lineageHeader", "Use the Research Library header photo", "boolean", required=False)]),
    page("source-map", "Source Map", [F("lineageHeader", "Use the Research Library header photo", "boolean", required=False)]),
    {"name": "shared", "label": "Shared blocks", "file": "_data/pages/shared.yml",
     "description": "Words that appear on more than one page.", "fields": [
         F("aboutJd", "Your guide, JD (Love Lab and Level-Up)", "object", fields=[
             F("heading", "Heading"), F("image", "Photo"), F("alt", "Photo description"),
             F("paragraphs", "Paragraphs", "list", field=F("p", "Paragraph", "text")),
             F("links", "Links", "list", fields=[F("text", "Text"), F("link", "Link")])]),
         F("blogCta", "Blog sign-up band", "object", fields=[
             F("label", "Small label"), F("heading", "Heading"), F("text", "Text", "text"),
             F("button", "Button text"), F("fine", "Small print"), F("after", "Line after the form", "text")])]},
]

col = {"name": "pages", "label": "Pages",
       "description": "The words and photos on each page. Text uses Markdown: *italic*, **bold**, [link text](https://...). "
                      "Links can be @booking (the Calendly link) or @email (the contact address).",
       "files": files}
out = yaml.dump([col], sort_keys=False, allow_unicode=True, width=4096, default_flow_style=False)
out = "\n".join(("  " + line) if line else line for line in out.split("\n")).rstrip() + "\n"
open(CONFIG, "w").write(base + MARKER + ": generated by scripts/gen-admin-pages.py, edit that script instead ----------\n" + out)
print("admin/config.yml: Pages collection written,", len(files), "pages")
