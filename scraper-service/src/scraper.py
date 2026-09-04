import json
import time
from dataclasses import dataclass
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime, timezone
from pydantic import BaseModel, ValidationError
from .polite_fetch import fetch_and_cache

WRITE_MODE = "w"

@dataclass
class ScrapeTargetConfig:
    start_url: str
    max_pages: int
    book_link_selector: str
    next_page_selector: str
    product_area_selector: str
    title_selector: str
    price_selector: str
    availability_selector: str
    rating_selector: str
    description_selector: str

TARGET_CONFIGS = {
    "books-to-scrape": ScrapeTargetConfig(
        start_url="https://books.toscrape.com/catalogue/page-1.html",
        max_pages=3,
        book_link_selector="article.product_pod h3 a",
        next_page_selector="li.next a",
        product_area_selector="div.product_main",
        title_selector="h1",
        price_selector="p.price_color",
        availability_selector="p.availability",
        rating_selector="p.star-rating",
        description_selector="#product_description ~ p",
    ),
}

class BookRecord(BaseModel):
    title: str
    product_url: str
    price_text: str
    price_gbp: float
    availability_text: str
    rating_text: str
    description: str | None
    source_page: str
    fetched_at: str

def parse_price_gbp(price_text):
    digits_only = price_text.replace("£", "").strip()
    return float(digits_only)

def extract_book_record(book_url, source_page, cache_path, config):
    html, was_fetched = fetch_and_cache(book_url, cache_path)
    if was_fetched:
        time.sleep(0.5)

    parsed_page = BeautifulSoup(html, "lxml")
    product_area = parsed_page.select_one(config.product_area_selector)

    title = product_area.select_one(config.title_selector).get_text(strip=True)

    price_text = product_area.select_one(config.price_selector).get_text(strip=True)
    availability_text = product_area.select_one(config.availability_selector).get_text(strip=True)

    rating_element = product_area.select_one(config.rating_selector)
    rating_classes = rating_element["class"]
    rating_text = [word for word in rating_classes if word != "star-rating"][0]

    description_element = parsed_page.select_one(config.description_selector)
    description = description_element.get_text(strip=True) if description_element else None

    fetched_at = datetime.now(timezone.utc).isoformat()

    record = {
        "title": title,
        "product_url": book_url,
        "price_text": price_text,
        "price_gbp": parse_price_gbp(price_text),
        "availability_text": availability_text,
        "rating_text": rating_text,
        "description": description,
        "source_page": source_page,
        "fetched_at": fetched_at,
    }
    return record, was_fetched

def discover_book_urls(config):
    catalogue_pages_visited = 0
    catalogue_cache_hits = 0
    discovered_book_urls = []
    book_source_pages = {}
    current_url = config.start_url

    while current_url is not None and catalogue_pages_visited < config.max_pages:
        catalogue_pages_visited += 1
        cache_path = f"cache/catalogue-page-{catalogue_pages_visited}.html"

        html, was_fetched = fetch_and_cache(current_url, cache_path)
        if was_fetched:
            time.sleep(0.5)
        else:
            catalogue_cache_hits += 1

        parsed_page = BeautifulSoup(html, "lxml")

        book_links = parsed_page.select(config.book_link_selector)
        for link in book_links:
            relative_href = link["href"]
            absolute_url = urljoin(current_url, relative_href)
            discovered_book_urls.append(absolute_url)
            book_source_pages[absolute_url] = current_url

        if catalogue_pages_visited < config.max_pages:
            next_link = parsed_page.select_one(config.next_page_selector)
            current_url = urljoin(current_url, next_link["href"]) if next_link else None
        else:
            current_url = None

    unique_book_urls = list(set(discovered_book_urls))
    return unique_book_urls, book_source_pages, catalogue_pages_visited, catalogue_cache_hits

def run_scrape(config):
    run_started_at = datetime.now(timezone.utc)

    unique_book_urls, book_source_pages, catalogue_pages_visited, catalogue_cache_hits = discover_book_urls(config)

    valid_records = []
    invalid_records = []
    failed_pages = []
    detail_cache_hits = 0

    for index, book_url in enumerate(unique_book_urls):
        detail_cache_path = f"cache/book-{index}.html"

        try:
            source_page = book_source_pages.get(book_url)
            raw_record, was_fetched = extract_book_record(book_url, source_page, detail_cache_path, config)
            if not was_fetched:
                detail_cache_hits += 1
        except Exception as page_error:
            failed_pages.append({
                "url": book_url,
                "reason": str(page_error),
            })
            continue

        try:
            validated_record = BookRecord(**raw_record)
            valid_records.append(validated_record.model_dump())
        except ValidationError as validation_error:
            invalid_records.append({
                "record": raw_record,
                "reason": str(validation_error),
            })

    with open("output/data.json", WRITE_MODE, encoding="utf-8") as books_file:
        json.dump(valid_records, books_file, indent=2)

    with open("output/errors.json", WRITE_MODE, encoding="utf-8") as errors_file:
        json.dump(invalid_records, errors_file, indent=2)

    run_finished_at = datetime.now(timezone.utc)
    duration_seconds = (run_finished_at - run_started_at).total_seconds()

    run_report = {
        "started_at": run_started_at.isoformat(),
        "duration_seconds": duration_seconds,
        "catalogue_pages_fetched": catalogue_pages_visited,
        "detail_pages_attempted": len(unique_book_urls),
        "cache_hits": catalogue_cache_hits + detail_cache_hits,
        "valid_records": len(valid_records),
        "invalid_records": len(invalid_records),
        "failed_pages": len(failed_pages),
        "failed_page_details": failed_pages,
    }

    with open("output/run-report.json", WRITE_MODE, encoding="utf-8") as report_file:
        json.dump(run_report, report_file, indent=2)

    print(f"valid_records={len(valid_records)}")
    print(f"invalid_records={len(invalid_records)}")
    print(f"failed_pages={len(failed_pages)}")
    print(f"cache_hits={catalogue_cache_hits + detail_cache_hits}")

if __name__ == "__main__":
    run_scrape(TARGET_CONFIGS["books-to-scrape"])