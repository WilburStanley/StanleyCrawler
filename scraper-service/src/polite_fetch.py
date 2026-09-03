import os
import time
import requests

USER_AGENT = "StanleyCrawler"
READ = "r"
WRITE = "w"
MAX_RETRIES = 1
NO_RETRY_STATUS_CODES = {404, 403}

def fetch_with_retry(url):
  attempt = 0
  while True:
    try:
      response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=5)
    except requests.exceptions.RequestException:
      if attempt >= MAX_RETRIES:
        raise
      attempt += 1
      time.sleep(1)
      continue
    
    if response.status_code == 200:
      return response
    
    if response.status_code in NO_RETRY_STATUS_CODES:
      raise ValueError(f"Non-retryable status {response.status_code} for {url}")

    attempt += 1
    time.sleep(1)

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