import json
import hashlib
from datetime import datetime, timezone
from bs4 import BeautifulSoup
import trafilatura
from .polite_fetch import fetch_and_cache
from urllib.parse import urljoin

DOWNLOADABLE_FILE_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".zip", ".rar", ".csv", ".txt", ".mp3", ".mp4", ".mov", ".avi",
}

def extract_all_images(parsed_page, base_url):
    image_tags = parsed_page.find_all("img")
    image_urls = []

    for tag in image_tags:
        src = tag.get("src")
        if not src:
            continue
        absolute_url = urljoin(base_url, src)
        if absolute_url not in image_urls:
            image_urls.append(absolute_url)
    return image_urls

def extract_downloadable_files(parsed_page, base_url):
    link_tags = parsed_page.find_all("a", href=True)
    found_files = []
    seen_urls = set()

    for tag in link_tags:
        href = tag["href"]
        lowercase_href = href.lower()
        matching_extension = None
        for extension in DOWNLOADABLE_FILE_EXTENSIONS:
            if lowercase_href.endswith(extension):
                matching_extension = extension
                break
        if matching_extension is None:
            continue
        absolute_url = urljoin(base_url, href)
        if absolute_url in seen_urls:
            continue
        seen_urls.add(absolute_url)
        found_files.append({"url": absolute_url, "type": matching_extension.lstrip(".")})
    return found_files

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
    def is_relevant_property(value):
        return value is not None and (value.startswith("og:") or value.startswith("article:") or value.startswith("twitter:"))

    meta_tags = parsed_page.find_all("meta", property=is_relevant_property)
    twitter_meta_tags = parsed_page.find_all("meta", attrs={"name": is_relevant_property})

    open_graph_data = {}
    for tag in meta_tags + twitter_meta_tags:
        property_name = tag.get("property") or tag.get("name") or ""
        content_value = tag.get("content")
        if not property_name or not content_value:
            continue
        open_graph_data[property_name] = content_value
    return open_graph_data if open_graph_data else None

def extract_readability_fallback(html):
    extracted_text = trafilatura.extract(html)
    metadata = trafilatura.extract_metadata(html)

    if metadata is None:
        return {"main_text": extracted_text}

    return {
        "title": metadata.title,
        "author": metadata.author,
        "url": metadata.url,
        "hostname": metadata.hostname,
        "description": metadata.description,
        "sitename": metadata.sitename,
        "date": metadata.date,
        "categories": metadata.categories,
        "tags": metadata.tags,
        "language": metadata.language,
        "image": metadata.image,
        "pagetype": metadata.pagetype,
        "license": metadata.license,
        "main_text": extracted_text,
    }

def flatten_json_ld_value(value):
    if isinstance(value, dict):
        return value.get("name") or value.get("url") or json.dumps(value)
    if isinstance(value, list):
        return [flatten_json_ld_value(item) for item in value]
    return value

def normalize_json_ld(json_ld_data):
    if json_ld_data is None:
        return {}

    normalized = {}
    for key, value in json_ld_data.items():
        if key in ("@context",):
            continue
        clean_key = key.lstrip("@")
        if clean_key == "type":
            clean_key = "content_type"
        if clean_key == "name" or clean_key == "headline":
            clean_key = "title"
        normalized[clean_key] = flatten_json_ld_value(value)
    return normalized

def normalize_open_graph(open_graph_data):
    if open_graph_data is None:
        return {}
    normalized = {}
    for key, value in open_graph_data.items():
        clean_key = key.replace("og:", "").replace("article:", "").replace("twitter:", "twitter_")
        if clean_key == "type":
            clean_key = "content_type"
        normalized.setdefault(clean_key, value)
    return normalized

def normalize_readability(readability_data):
    normalized = dict(readability_data)
    if "date" in normalized:
        normalized["date_published"] = normalized.pop("date")
    if "sitename" in normalized:
        normalized["site_name"] = normalized.pop("sitename")
    return normalized

def is_meaningful_value(value):
    if value is None or value == "":
        return False
    if isinstance(value, (list, dict)) and len(value) == 0:
        return False
    return True

def merge_fields(tier_results):
    merged_fields = {}
    field_sources = {}

    for tier_name, normalized in tier_results:
        for field_name, value in normalized.items():
            already_filled = field_name in merged_fields
            if is_meaningful_value(value) and not already_filled:
                merged_fields[field_name] = value
                field_sources[field_name] = tier_name
    return merged_fields, field_sources

def auto_scrape(url):
    cache_path = build_cache_path(url)
    html, _ = fetch_and_cache(url, cache_path)
    parsed_page = BeautifulSoup(html, "lxml")
    fetched_at = datetime.now(timezone.utc).isoformat()

    json_ld_raw = extract_json_ld(parsed_page)
    open_graph_raw = extract_open_graph(parsed_page)
    readability_raw = extract_readability_fallback(html)

    page_scan_fields = {
        "images": extract_all_images(parsed_page, url),
        "files": extract_downloadable_files(parsed_page, url),
    }
    tier_results = [
        ("json-ld", normalize_json_ld(json_ld_raw)),
        ("open-graph", normalize_open_graph(open_graph_raw)),
        ("readability-fallback", normalize_readability(readability_raw)),
        ("page-scan", page_scan_fields),
    ]
    merged_fields, field_sources = merge_fields(tier_results)
    return {
        "source_url": url,
        "fetched_at": fetched_at,
        "fields": merged_fields,
        "field_sources": field_sources,
        "raw": {
            "json_ld": json_ld_raw,
            "open_graph": open_graph_raw,
            "readability": readability_raw,
        },
    }