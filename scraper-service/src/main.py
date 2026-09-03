import json
from fastapi import FastAPI
from pydantic import BaseModel
from .scraper import run_scrape, TARGET_CONFIGS
from .auto_scrape import auto_scrape

app = FastAPI()

class AutoScrapeRequest(BaseModel):
    url: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/scrape")
def scrape():
    run_scrape(TARGET_CONFIGS["books-to-scrape"])

    with open("output/data.json", "r", encoding="utf-8") as data_file:
        scraped_data = json.load(data_file)

    with open("output/errors.json", "r", encoding="utf-8") as errors_file:
        scrape_errors = json.load(errors_file)

    with open("output/run-report.json", "r", encoding="utf-8") as report_file:
        run_report = json.load(report_file)

    return {
        "data": scraped_data,
        "errors": scrape_errors,
        "run_report": run_report,
    }

@app.post("/auto-scrape")
def auto_scrape_endpoint(request: AutoScrapeRequest):
    result = auto_scrape(request.url)
    return result