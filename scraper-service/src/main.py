import os
import json
import secrets
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, Header, Depends
from pydantic import BaseModel, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .scraper import run_scrape, TARGET_CONFIGS
from .auto_scrape import auto_scrape

load_dotenv()

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class AutoScrapeRequest(BaseModel):
    url: str
    @field_validator("url")
    @classmethod
    def url_must_be_http_or_https(cls, value):
        if not value.startswith("http://") and not value.startswith("https://"):
            raise ValueError("URL must start with http:// or https://")
        return value

def verify_internal_request(x_internal_key: str = Header(default="")):
    is_valid = secrets.compare_digest(x_internal_key, INTERNAL_API_KEY)
    if not INTERNAL_API_KEY or not is_valid:
        raise HTTPException(status_code=403, detail="Forbidden")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/scrape", dependencies=[Depends(verify_internal_request)])
@limiter.limit("5/minute")
def scrape(request: Request):
    try:
        run_scrape(TARGET_CONFIGS["books-to-scrape"])
    except Exception:
        raise HTTPException(status_code=502, detail="The scrape could not be completed")

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

@app.post("/auto-scrape", dependencies=[Depends(verify_internal_request)])
@limiter.limit("10/minute")
def auto_scrape_endpoint(request: Request, body: AutoScrapeRequest):
    try:
        result = auto_scrape(body.url)
    except ValueError as validation_error:
        raise HTTPException(status_code=400, detail=str(validation_error))
    except Exception:
        raise HTTPException(status_code=502, detail="The auto-scrape could not be completed")

    return result