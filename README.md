# StanleyCrawler

A full-stack, polite web scraping pipeline — built as part of the FlyRank
Backend Track internship (Assignment A9), and extended into a personal
portfolio project.

StanleyCrawler is split into three independent services:

- **`scraper-service/`** — Python + FastAPI. Runs the actual scraping
  pipeline: fetches pages politely, extracts structured data, validates
  it, and reports honestly on what happened during each run.
- **`backend/`** — Next.js (TypeScript) API routes. Reads the scraper's
  output, re-validates it with Zod, and serves it onward.
- **`frontend/`** — Next.js (TypeScript, Tailwind CSS). A dashboard for
  viewing scraped data and run reports.

## Target classification

- **Site:** https://books.toscrape.com
- **Why this site:** it explicitly identifies itself as a sandbox built
  for people to practice web scraping on — not a live commercial site.
- **Scope:** only the first 3 catalogue pages, and the 60 book detail
  pages linked from them. No other pages on the site are touched.
- **robots.txt:** returned a 404 — no robots file exists. A missing
  file isn't permission on its own; the actual justification here comes
  from the site's own stated purpose above.

I will not reuse this code on another site without checking its rules
and terms first.

## Running it

Requires Python 3.10+ and Node.js 20+.

```bash
git clone <your-repo-url>
cd StanleyCrawler/scraper-service

python -m venv venv
source venv/Scripts/activate   # Windows Git Bash
# or: source venv/bin/activate  (Mac/Linux)

pip install -r requirements.txt
python src/scraper.py
```

This produces `output/data.json`, `output/errors.json`, and
`output/run-report.json`.

## Record schema

Each validated record in `output/data.json` looks like:

```json
{
  "title": "string",
  "product_url": "string (absolute URL)",
  "price_text": "string, e.g. '£51.77'",
  "price_gbp": "number, e.g. 51.77",
  "availability_text": "string",
  "rating_text": "string, e.g. 'Three'",
  "description": "string or null",
  "source_page": "string (absolute URL of the catalogue page it was found on)",
  "fetched_at": "string (ISO 8601 UTC timestamp)"
}
```

Records that fail this schema are written to `output/errors.json`
instead, each with the reason they failed — they never silently enter
`data.json`.

## Politeness rules

Every request follows the same set of rules, whether it's a catalogue
page or a book detail page:

- **User-agent:** identifies the bot by name, so a site owner could
  find and contact the operator if needed.
- **Timeout:** every request gives up after 5 seconds rather than
  hanging indefinitely.
- **Delay:** at least 500ms between real requests to the site. Cached
  pages are read instantly, since they never leave the machine.
- **Status check:** only a `200` response is treated as a successful
  fetch. `404`/`403` are never retried (asking again won't help, and
  retrying a `403` is how a polite scraper becomes a nuisance);
  timeouts and `5xx` server errors get one retry before giving up.
- **Caching:** every page fetched is saved locally, so re-running the
  scraper while developing never re-hits the live site for pages
  already seen.

## Why no browser was needed here

`books.toscrape.com` is fully server-rendered — the data this project
needs is already present in the raw HTML the server sends back. A
headless browser only becomes necessary when a site relies on
client-side JavaScript to render its content after the initial page
load (for example, `quotes.toscrape.com/js`, whose raw HTML is
essentially empty until JavaScript runs). Since that's not the case
here, adding a browser to this pipeline would only add cost — slower
runs, more memory, and a much heavier dependency — for no actual
benefit.

## Sample run report

```json
{
  "started_at": "2026-09-03T06:04:18.231605+00:00",
  "duration_seconds": 1.627059,
  "catalogue_pages_fetched": 3,
  "detail_pages_attempted": 60,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0,
  "failed_page_details": []
}
```

## Ethics note

This project only targets a site explicitly built for scraping
practice. In general, this codebase should not be pointed at another
site without first checking that site's `robots.txt` and terms of
service. Where an official API exists for a given site, that should be
used instead of scraping. Logins, paywalls, and access controls are
never bypassed, and only the data actually needed is collected.

## Known limitation

The pipeline currently retries a failed request once before giving up;
it does not yet implement exponential backoff or respect a
`Retry-After` header from the server — both planned as part of a later
iteration of this project.