# StanleyCrawler notes

Scratch file for tracking real-time state. Not the public README.

## Assignment checklist (FlyRank Backend Track A9)

Core requirements:
[x] One documented command processes exactly the first 3 catalogue pages and discovers 60 unique book URLs
[x] Every detail page produces the 8 raw fields, plus a numeric price_gbp
[x] Records are schema validated before storage, failing records land in errors.json with a reason
[x] output/data.json holds exactly 60 unique records after the first run and after a rerun
[x] Every real request sends an identifying user agent, has a timeout, waits at least 500ms between requests, and checks the status code, development reads from cache
[x] Target classification and robots check documented (see below)
[x] One deliberately broken URL is logged and skipped, run finishes, good records survive
[x] output/run-report.json reports counts, failures, cache hits, and duration
[x] Public GitHub repo with 7+ meaningful commits, README a stranger can run in under 5 minutes

Stretch, optional, not required:
[ ] Browser cost comparison (quotes.toscrape.com/js, fetch vs Playwright)
[ ] Parser unit tests (5+)
[ ] AI rematch bonus stage
[x] Retry backoff upgrade (exponential backoff, jitter, Retry After header, structured logs) done

## Target classification

Site: https://books.toscrape.com
Why: the site states it is a sandbox built for people to practice scraping on
Scope: first 3 catalogue pages, and the 60 book detail pages linked from them
robots.txt: returned a 404, no robots file found
I will not reuse this code on another site without checking its rules and terms first

## Real run report

started_at: 2026-09-03T06:04:18.231605+00:00
duration_seconds: 1.627059
catalogue_pages_fetched: 3
detail_pages_attempted: 60
cache_hits: 63
valid_records: 60
invalid_records: 0
failed_pages: 0

## Setup reminders

scraper-service needs its venv reactivated every new terminal:
cd scraper-service
source venv/Scripts/activate
uvicorn src.main:app --reload --port 8000

All three services must run at once for the dashboard to work:
scraper-service on port 8000
backend on port 3000
frontend on port 3001

Each service needs its own .env.local, copy from .env.example in that folder.
backend and scraper-service must share the same INTERNAL_API_KEY value.