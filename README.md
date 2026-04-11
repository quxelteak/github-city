# GitHub City

> Your repositories rendered as an isometric city. Building height = commits (XP).
> Auto-updates daily via GitHub Actions.

## Quick Setup

### 1\. Create a dedicated repo

```
your-username/github-city
```

### 2\. Copy these files into it

```
github-city/
├── .github/
│   └── workflows/
│       └── update-city.yml   ← runs daily, fetches your repos
├── scripts/
│   └── generate-city-data.js ← GitHub GraphQL → city-data.json
└── city.html                 ← the isometric city renderer
```

### 3\. Enable GitHub Pages

Go to **Settings → Pages → Source** and set it to `main` branch, `/ (root)`.

Your city will be live at:

```
https://YOUR-USERNAME.github.io/github-city/city.html
```

### 4\. Add to your profile README

GitHub profile READMEs don't allow `<iframe>` tags — GitHub strips them.
The standard workaround is to embed a **screenshot** that links to the live page,
or use the iframe via a third-party README card service. Here are both options:

\---

#### Option A — Linked screenshot (works everywhere, updates on each Action run)

Add this to your profile README (`YOUR-USERNAME/YOUR-USERNAME/README.md`):

```markdown
## GitHub City — my repos as an isometric city

\[!\[Dev City](https://YOUR-USERNAME.github.io/github-city/preview.png)](https://YOUR-USERNAME.github.io/github-city/city.html)

> Click to explore the interactive version
```

To auto-generate `preview.png` on each Action run, add a Puppeteer screenshot step
to `update-city.yml` (see **Bonus: auto-screenshot** below).

\---

#### Option B — iframe via `readme-typing-svg` / raw HTML hosting

Some README renderers (GitLab, Notion, personal sites) allow iframes:

```html
<iframe
  src="https://YOUR-USERNAME.github.io/github-city/city.html"
  width="100%"
  height="540"
  frameborder="0"
  style="border-radius:12px"
></iframe>
```

\---

#### Option C — Embed in a GitHub Pages portfolio site

If you have a `YOUR-USERNAME.github.io` site, just drop an iframe there:

```html
<iframe
  src="https://YOUR-USERNAME.github.io/github-city/city.html"
  width="860"
  height="540"
  frameborder="0"
></iframe>
```

\---

## Bonus: auto-screenshot on each update

Add `.github/workflows/update-city.yml` **before** the git commit step:

And create `scripts/screenshot.js`:

\---

## Zone classification logic

|Zone|Criteria|
|-|-|
|Skyscraper|≥ 150 commits|
|Industrial|backend/api/ml topics OR ≥ 60 commits|
|Event|hackathon/advent/challenge topics|
|Suburb|everything else|

Active repos (pushed within 3 months) show **lit windows** in the city.

\---

## Customising

Edit the `classifyZone()` function in `scripts/generate-city-data.js` to tune
the zone rules to your own project types. The thresholds and keyword lists are
all in one place near the top of the file.

