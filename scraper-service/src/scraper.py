import os
import requests

CACHE_PATH = "cache/catalogue-page-1.html"
READ = "r"
WRITE = "w"

if os.path.exists(CACHE_PATH):
  print("CACHE HIT")
  with open(CACHE_PATH, READ) as cache_file:
    html = cache_file.read()
else:
  print("FETCH")
  response = requests.get(
      "https://books.toscrape.com/catalogue/page-1.html",
      headers={"User-Agent": "StanleyCrawler)"},
      timeout=5,
  )
  html = response.text
  with open(CACHE_PATH, WRITE) as cache_file:
      cache_file.write(html)
      
print(len(html))