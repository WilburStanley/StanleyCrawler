"use client";

import { useState } from "react";
import { AlertCircle, Loader2, RotateCw } from "lucide-react";
import JsonViewer from "@/components/JsonViewer";
import Toast from "@/components/Toast";

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

const skeletonRows = [0, 1, 2, 3];

const formatSource = (source: string) => source.replace(/-/g, " ");

const AutoScrapePage = () => {
  const [urlInput, setUrlInput] = useState("");
  const [result, setResult] = useState<AutoScrapeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !isLoading && urlInput.length > 0) {
      runAutoScrape();
    }
  };

  return (
    <main className="min-h-screen bg-bg text-text p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-medium">Auto scrape</h1>
          <p className="text-sm text-muted mt-1">
            Paste any URL, it detects structured data automatically, no site
            specific setup required.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com"
            disabled={isLoading}
            className="flex-1 bg-surface border border-border rounded-sm px-3 py-2 text-sm font-mono outline-none focus:border-accent disabled:opacity-50"
          />
          <button
            onClick={runAutoScrape}
            disabled={isLoading || urlInput.length === 0}
            className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-accent text-bg text-sm font-medium rounded-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {isLoading ? "Scraping" : "Scrape"}
          </button>
        </div>

        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {skeletonRows.map((row) => (
                <div key={row} className="h-8 bg-surface rounded-sm sm:rounded-full sm:w-20" />
              ))}
            </div>
            <div className="border border-border rounded-sm p-4 space-y-2">
              {skeletonRows.map((row) => (
                <div
                  key={row}
                  className="h-4 bg-surface rounded-sm"
                  style={{ width: `${80 - row * 12}%` }}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="flex items-start gap-3 border border-danger/30 bg-danger/10 rounded-sm p-4">
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-danger">{errorMessage}</p>
              <button
                onClick={runAutoScrape}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-text"
              >
                <RotateCw size={12} />
                Try again
              </button>
            </div>
          </div>
        )}

        {!isLoading && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 text-xs font-mono">
              {Object.entries(result.field_sources).map(([fieldName, source]) => (
                <span
                  key={fieldName}
                  className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 bg-surface text-muted px-2.5 py-1.5 rounded-sm sm:rounded-full truncate"
                >
                  <span className="truncate">{fieldName}</span>
                  <span className="text-text text-[10px] sm:text-xs">
                    {formatSource(source)}
                  </span>
                </span>
              ))}
            </div>

            <div className="overflow-x-auto">
              <JsonViewer
                data={result.fields}
                downloadFilename="data.json"
                onCopy={() => setToastMessage("Copied to clipboard")}
                onDownload={() => setToastMessage("Download started")}
              />
            </div>
          </div>
        )}
      </div>

      <Toast message={toastMessage} onClear={() => setToastMessage(null)} />
    </main>
  );
};

export default AutoScrapePage;