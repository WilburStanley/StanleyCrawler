import os
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime, timezone

USER_AGENT = "StanleyCrawler"
READ = "r"
WRITE = "w"
MAX_CATALOGUE_PAGES = 3


def fetch_and_cache(url, cache_path):
    if os.path.exists(cache_path):
        print(f"CACHE HIT: {cache_path}")
        with open(cache_path, READ, encoding="utf-8") as cache_file:
            return cache_file.read(), False

    print(f"FETCH: {url}")
    response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=5)
    html = response.text
    with open(cache_path, WRITE, encoding="utf-8") as cache_file:
        cache_file.write(html)
    return html, True


def extract_book_record(book_url, source_page, cache_path):
    html, was_fetched = fetch_and_cache(book_url, cache_path)
    if was_fetched:
        time.sleep(0.5)

    parsed_page = BeautifulSoup(html, "lxml")
    product_area = parsed_page.select_one("div.product_main")

    title = product_area.select_one("h1").get_text(strip=True)

    price_text = product_area.select_one("p.price_color").get_text(strip=True)
    availability_text = product_area.select_one("p.availability").get_text(strip=True)

    rating_element = product_area.select_one("p.star-rating")
    rating_classes = rating_element["class"]
    rating_text = [word for word in rating_classes if word != "star-rating"][0]

    description_element = parsed_page.select_one("#product_description ~ p")
    description = description_element.get_text(strip=True) if description_element else None

    fetched_at = datetime.now(timezone.utc).isoformat()

    return {
        "title": title,
        "product_url": book_url,
        "price_text": price_text,
        "availability_text": availability_text,
        "rating_text": rating_text,
        "description": description,
        "source_page": source_page,
        "fetched_at": fetched_at,
    }


catalogue_pages_visited = 0
discovered_book_urls = []
book_source_pages = {}
current_url = "https://books.toscrape.com/catalogue/page-1.html"

while current_url is not None and catalogue_pages_visited < MAX_CATALOGUE_PAGES:
    catalogue_pages_visited += 1
    cache_path = f"cache/catalogue-page-{catalogue_pages_visited}.html"

    html, was_fetched = fetch_and_cache(current_url, cache_path)
    if was_fetched:
        time.sleep(0.5)

    parsed_page = BeautifulSoup(html, "lxml")

    book_links = parsed_page.select("article.product_pod h3 a")
    for link in book_links:
        relative_href = link["href"]
        absolute_url = urljoin(current_url, relative_href)
        discovered_book_urls.append(absolute_url)
        book_source_pages[absolute_url] = current_url

    if catalogue_pages_visited < MAX_CATALOGUE_PAGES:
        next_link = parsed_page.select_one("li.next a")
        current_url = urljoin(current_url, next_link["href"]) if next_link else None
    else:
        current_url = None

unique_book_urls = list(set(discovered_book_urls))

book_records = []
for index, book_url in enumerate(unique_book_urls):
    detail_cache_path = f"cache/book-{index}.html"
    source_page = book_source_pages[book_url]
    record = extract_book_record(book_url, source_page, detail_cache_path)
    book_records.append(record)

print(book_records[0])
print(f"detail_pages={len(book_records)}")