import os
import time
import random
import socket
import ipaddress
import requests
from urllib.parse import urlparse, urlunparse
from forcediphttpsadapter.adapters import ForcedIPHTTPSAdapter

USER_AGENT = "StanleyCrawler"
READ = "r"
WRITE = "w"
MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 1
NO_RETRY_STATUS_CODES = {404, 403}
MAX_RESPONSE_BYTES = 20 * 1024 * 1024  # 20 MB

def is_ip_unsafe(ip_address):
    return (
        ip_address.is_private
        or ip_address.is_loopback
        or ip_address.is_link_local
        or ip_address.is_reserved
        or ip_address.is_multicast
        or ip_address.is_unspecified
    )

def resolve_safe_ip(hostname):
    try:
        address_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise ValueError("Could not resolve hostname")

    resolved_ips = []
    for entry in address_info:
        raw_ip = entry[4][0]
        ip_address = ipaddress.ip_address(raw_ip)
        if ip_address.version == 6 and ip_address.ipv4_mapped is not None:
            ip_address = ip_address.ipv4_mapped
        resolved_ips.append(ip_address)

    for ip_address in resolved_ips:
        if is_ip_unsafe(ip_address):
            raise ValueError("Requests to private or internal addresses are not allowed")
    for ip_address in resolved_ips:
        if ip_address.version == 4:
            return str(ip_address)
    return str(resolved_ips[0])

def read_response_with_size_limit(response):
    content_length = response.headers.get("Content-Length")
    if content_length is not None and int(content_length) > MAX_RESPONSE_BYTES:
        raise ValueError(f"Response too large ({content_length} bytes)")

    downloaded_bytes = 0
    chunks = []
    for chunk in response.iter_content(chunk_size=8192):
        downloaded_bytes += len(chunk)
        if downloaded_bytes > MAX_RESPONSE_BYTES:
            raise ValueError(f"Response exceeded {MAX_RESPONSE_BYTES} bytes")
        chunks.append(chunk)

    response._content = b"".join(chunks)
    return response

def make_pinned_request(url, timeout):
    parsed_url = urlparse(url)

    if parsed_url.scheme not in ("http", "https"):
        raise ValueError("Only http and https URLs are allowed")
    hostname = parsed_url.hostname
    if not hostname:
        raise ValueError("URL must include a hostname")
    pinned_ip = resolve_safe_ip(hostname)
    headers = {"User-Agent": USER_AGENT}

    if parsed_url.scheme == "https":
        session = requests.Session()
        session.mount("https://", ForcedIPHTTPSAdapter(dest_ip=pinned_ip))
        response = session.get(url, headers=headers, timeout=timeout, stream=True)
    else:
        netloc = pinned_ip if not parsed_url.port else f"{pinned_ip}:{parsed_url.port}"
        pinned_url = urlunparse(parsed_url._replace(netloc=netloc))
        headers["Host"] = hostname
        response = requests.get(pinned_url, headers=headers, timeout=timeout, stream=True)

    return read_response_with_size_limit(response)

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
            response = make_pinned_request(url, timeout=5)
        except ValueError:
            raise
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