# StanleyCrawler

## About

Built as part of the FlyRank AI Backend AI Engineering Internship, Assignment A9, "The polite scraper." Started as a graded assignment, extended into a personal portfolio project with a general purpose scraping engine.

## Context

StanleyCrawler is split into three independent services:

* **`scraper-service/`**: Python and FastAPI. Runs two pipelines: a fixed, config driven pipeline for the assignment target, books.toscrape.com, and a general purpose auto scrape engine that accepts any URL and extracts whatever structured data that page publishes. **This part is complete.**
* **`backend/`**: Next.js (TypeScript) API routes. Calls scraper-service, validates every response with Zod, serves the result onward. **Complete.**
* **`frontend/`**: Next.js (TypeScript, Tailwind CSS). A dashboard showing service health, a fixed demo page proving the assignment pipeline end to end, and an open input page for auto scrape. **Complete.**

## Target classification, assignment pipeline

Site: https://books.toscrape.com

- Why: it explicitly states it is a sandbox built for scraping practice, not a live commercial site.
- Scope: only the first 3 catalogue pages, and the 60 book detail pages linked from them.
- robots.txt: returned a 404. No robots file exists. A missing file is not permission on its own, the justification comes from the site's own stated purpose above.

I will not reuse this code on another site without checking its rules and terms first.

## Setup

- Each service needs its own .env file, copied from that folder's .env.example.
- backend and scraper-service must share the exact same INTERNAL_API_KEY value. Generate one with:

```
python -c "import secrets; print(secrets.token_hex(32))"
```

All three services must run at the same time. scraper-service on port 8000, backend on port 3000, frontend on whichever port Next.js assigns, usually 3001.

Run the assignment pipeline directly, standalone, no server required:

```
python -m src.scraper
```

Run scraper-service as a live server:

```
cd scraper-service
source venv/Scripts/activate
uvicorn src.main:app --reload --port 8000
```

## Record schema, assignment pipeline

```
{
  "title": "string",
  "product_url": "string, absolute URL",
  "price_text": "string, for example, £51.77",
  "price_gbp": "number, for example, 51.77",
  "availability_text": "string",
  "rating_text": "string, for example, Three",
  "description": "string or null",
  "source_page": "string, absolute URL of the catalogue page it came from",
  "fetched_at": "string, ISO 8601 UTC timestamp"
}
```

Records that fail this schema are written to output/errors.json instead, each with the reason they failed. They never silently enter data.json.

## Politeness rules

User agent identifies the bot by name. Timeout gives up after 5 seconds. Delay waits at least 500 milliseconds between real requests during the assignment pipeline, cached pages read instantly. Status check treats only 200 as success. 404 and 403 are never retried. Timeouts and 5xx errors retry with exponential backoff, jitter, and respect for a server's Retry After header. Every fetched page is cached locally, so a rerun never re hits a live site.

## The auto scrape feature

Given any URL, tries JSON LD first, then Open Graph and Twitter Card meta tags, then a readability style extraction as a last resort, and merges the results field by field rather than stopping at the first method that returns something. The raw HTML is also scanned directly for every image and linked downloadable file. Every field in the output is tagged with exactly which method supplied it.

## Security

The auto scrape feature accepts an arbitrary URL from any caller, so the following protections apply.

**`Server side request forgery protection, CWE 918.`** The requested hostname is resolved to its real IP, every resolved address is checked against private, loopback, link local, reserved, and multicast ranges, and the actual connection is pinned to that exact validated address rather than resolving the hostname again. This closes both simple SSRF and DNS rebinding.

**`Internal service authentication, CWE 306 and CWE 208.`** scraper-service only accepts scrape and auto scrape requests carrying a shared secret header matching its own key, compared using a constant time function to avoid timing leaks.

**`Rate limiting, CWE 770.`** Both backend and scraper-service track request counts per visitor and reject excess requests.

**`Input validation, CWE 20.`** Submitted URLs are checked for a valid format and allowed scheme before any request is attempted.

**`No internal error leakage, CWE 209.`** Failures return a short, generic message, never a stack trace or file path.

**`Cross origin restrictions.`** backend only accepts browser requests from its own configured frontend origin.

**`Response size limits, CWE 770.`** A very large or misbehaving response is capped during download.

**`Known limitation.`** The rate limiter on both services is kept in memory, resets on restart, and would not be shared correctly across multiple parallel instances. A production hardened version would back this with a shared store such as Redis. This is a deliberate, documented tradeoff for a project at this scale.

## Why no browser was needed for the assignment pipeline

books.toscrape.com is fully server rendered, the data needed is already in the raw HTML. A headless browser is only necessary when a site relies on client side JavaScript to render content after load, which is not the case here.

## Sample run report

```
{
  "started_at": "2026-09-03T06:04:18.231605+00:00",
  "duration_seconds": 1.627059,
  "catalogue_pages_fetched": 3,
  "detail_pages_attempted": 60,
  "cache_hits": 63,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0,
  "failed_page_details": []
}
```

## Ethics note

The assignment pipeline only targets a site explicitly built for scraping practice. This codebase should not be pointed at another site without first checking that site's robots.txt and terms of service. Where an official API exists, that should be used instead of scraping. Logins, paywalls, and access controls are never bypassed, and only the data actually needed is collected.

## Known limitations

Retries give up after 3 attempts per request. The in memory rate limiter is not shared across multiple server instances. The auto scrape engine can only see content present in a page's raw HTML, a page that renders through client side JavaScript after load will not be fully captured.