import json
import hashlib
from datetime import datetime, timezone
from bs4 import BeautifulSoup
import trafilatura
from .polite_fetch import fetch_and_cache


def build_cache_path(url):
    url_hash = hashlib.md5(url.encode("utf-8")).hexdigest()
    return f"cache/auto-{url_hash}.html"


def extract_json_ld(parsed_page):
    script_tags = parsed_page.find_all("script", type="application/ld+json")

    for script_tag in script_tags:
        try:
            parsed_json = json.loads(script_tag.string or "")
        except (json.JSONDecodeError, TypeError):
            continue

        candidates = parsed_json if isinstance(parsed_json, list) else [parsed_json]
        for candidate in candidates:
            if isinstance(candidate, dict) and "@type" in candidate:
                return candidate

    return None


def extract_open_graph(parsed_page):
    def is_og_property(value):
        return value is not None and value.startswith("og:")

    og_tags = parsed_page.find_all("meta", property=is_og_property)
    if not og_tags:
        return None

    open_graph_data = {}
    for tag in og_tags:
        property_name = tag.get("property", "").replace("og:", "")
        content_value = tag.get("content")
        if property_name and content_value:
            open_graph_data[property_name] = content_value

    return open_graph_data if open_graph_data else None


def extract_readability_fallback(html):
    extracted_text = trafilatura.extract(html)

    parsed_page = BeautifulSoup(html, "lxml")
    title_tag = parsed_page.select_one("title")
    title_text = title_tag.get_text(strip=True) if title_tag else None

    return {
        "title": title_text,
        "main_text": extracted_text,
        "warning": "No structured metadata found — extraction quality may be limited",
    }


def auto_scrape(url):
    cache_path = build_cache_path(url)
    html, _ = fetch_and_cache(url, cache_path)
    parsed_page = BeautifulSoup(html, "lxml")
    fetched_at = datetime.now(timezone.utc).isoformat()

    json_ld_data = extract_json_ld(parsed_page)
    if json_ld_data is not None:
        return {
            "source_url": url,
            "content_type": json_ld_data.get("@type", "unknown"),
            "extraction_method": "json-ld",
            "fetched_at": fetched_at,
            "data": json_ld_data,
        }

    open_graph_data = extract_open_graph(parsed_page)
    if open_graph_data is not None:
        return {
            "source_url": url,
            "content_type": open_graph_data.get("type", "unknown"),
            "extraction_method": "open-graph",
            "fetched_at": fetched_at,
            "data": open_graph_data,
        }

    return {
        "source_url": url,
        "content_type": "unknown",
        "extraction_method": "readability-fallback",
        "fetched_at": fetched_at,
        "data": extract_readability_fallback(html),
    }