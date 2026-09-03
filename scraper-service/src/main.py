import json
from fastapi import FastAPI
from .scraper import run_scrape, TARGET_CONFIGS

app = FastAPI()


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