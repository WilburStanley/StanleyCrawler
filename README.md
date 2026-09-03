# StanleyCrawler

A full-stack, polite web scraping pipeline — built as part of the FlyRank
Backend Track internship (Assignment A9), and being extended into a
personal portfolio project.

**Current status:** the scraping pipeline (`scraper-service/`) is fully
built and working, covering all 7 required assignment stages below.
`backend/` and `frontend/` are scaffolded but not yet wired to the
scraper's output — that integration is in progress.

StanleyCrawler is split into three independent services:

- **`scraper-service/`** — Python + FastAPI. Runs the actual scraping
  pipeline: fetches pages politely, extracts structured data, validates
  it, and reports honestly on what happened during each run. **This
  part is complete.**
- **`backend/`** — Next.js (TypeScript) API routes, scaffolded, not yet
  connected to the scraper's output.
- **`frontend/`** — Next.js (TypeScript, Tailwind CSS), scaffolded, not
  yet built out.