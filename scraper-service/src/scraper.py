import os
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

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


catalogue_pages_visited = 0
discovered_book_urls = []
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

    if catalogue_pages_visited < MAX_CATALOGUE_PAGES:
        next_link = parsed_page.select_one("li.next a")
        current_url = urljoin(current_url, next_link["href"]) if next_link else None
    else:
        current_url = None

unique_book_urls = list(set(discovered_book_urls))

print(f"catalogue_pages={catalogue_pages_visited}")
print(f"discovered={len(discovered_book_urls)}")
print(f"unique_urls={len(unique_book_urls)}")