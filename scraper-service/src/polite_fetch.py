import os
import time
import random
import requests

USER_AGENT = "StanleyCrawler"
READ = "r"
WRITE = "w"
MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 1
NO_RETRY_STATUS_CODES = {404, 403}


def log_attempt(url, status, attempt):
    print(f"structured_log url={url} status={status} attempt={attempt}")


def calculate_backoff_seconds(attempt, retry_after_header):
    if retry_after_header is not None:
        try:
            return float(retry_after_header)
        except ValueError:
            pass

    exponential_wait = BASE_BACKOFF_SECONDS * (2 ** attempt)
    jitter = random.uniform(0, 1)
    return exponential_wait + jitter


def fetch_with_retry(url):
    attempt = 0
    while True:
        try:
            response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=5)
        except requests.exceptions.RequestException:
            log_attempt(url, "connection_error", attempt)
            if attempt >= MAX_RETRIES:
                raise
            wait_seconds = calculate_backoff_seconds(attempt, None)
            time.sleep(wait_seconds)
            attempt += 1
            continue

        log_attempt(url, response.status_code, attempt)

        if response.status_code == 200:
            return response

        if response.status_code in NO_RETRY_STATUS_CODES:
            raise ValueError(f"Non-retryable status {response.status_code} for {url}")

        if attempt >= MAX_RETRIES:
            raise ValueError(f"Failed after {MAX_RETRIES} retries, status {response.status_code} for {url}")

        retry_after_header = response.headers.get("Retry-After")
        wait_seconds = calculate_backoff_seconds(attempt, retry_after_header)
        time.sleep(wait_seconds)
        attempt += 1


def fetch_and_cache(url, cache_path):
    if os.path.exists(cache_path):
        print(f"CACHE HIT: {cache_path}")
        with open(cache_path, READ, encoding="utf-8") as cache_file:
            return cache_file.read(), False

    print(f"FETCH: {url}")
    response = fetch_with_retry(url)
    response.encoding = "utf-8"
    html = response.text
    with open(cache_path, WRITE, encoding="utf-8") as cache_file:
        cache_file.write(html)
    return html, True