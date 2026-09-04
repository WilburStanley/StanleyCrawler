"use client";

import { useState } from "react";
import JsonViewer from "@/components/JsonViewer";

type AutoScrapeResult = {
  source_url: string;
  fetched_at: string;
  fields: Record<string, unknown>;
  field_sources: Record<string, string>;
  raw: {
    json_ld: Record<string, unknown> | null;
    open_graph: Record<string, unknown> | null;
    readability: Record<string, unknown> | null;
  };
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

const AutoScrapePage = () => {
  const [urlInput, setUrlInput] = useState("");
  const [result, setResult] = useState<AutoScrapeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runAutoScrape = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await fetch(`${backendUrl}/auto-scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        setErrorMessage(errorBody.message ?? "The scrape request failed.");
        return;
      }

      const scrapeResult: AutoScrapeResult = await response.json();
      setResult(scrapeResult);
    } catch {
      setErrorMessage("Could not reach the backend service.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg text-text p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-medium">Auto-scrape</h1>
          <p className="text-sm text-muted mt-1">
            Paste any URL — it detects structured data automatically, no
            site-specific setup required.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-surface border border-border rounded-sm px-3 py-2 text-sm font-mono outline-none focus:border-accent"
          />
          <button
            onClick={runAutoScrape}
            disabled={isLoading || urlInput.length === 0}
            className="px-4 py-2 bg-accent text-bg text-sm font-medium rounded-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Scraping..." : "Scrape"}
          </button>
        </div>

        {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

        {result && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              {Object.entries(result.field_sources).map(([fieldName, source]) => (
                <span key={fieldName} className="bg-surface text-muted px-2.5 py-1 rounded-full">
                  {fieldName} <span className="text-text">· {source}</span>
                </span>
              ))}
            </div>

            <JsonViewer data={result.fields} downloadFilename="data.json" />
          </div>
        )}
      </div>
    </main>
  );
};

export default AutoScrapePage;