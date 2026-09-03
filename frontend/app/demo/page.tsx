"use client";

import { useState } from "react";
import JsonViewer from "@/components/JsonViewer";

type ScrapeResult = {
  data: unknown[];
  errors: unknown[];
  run_report: {
    valid_records: number;
    invalid_records: number;
    failed_pages: number;
    cache_hits: number;
  };
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

const DemoPage = () => {
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runScrape = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${backendUrl}/scrape`, { method: "POST" });

      if (!response.ok) {
        setErrorMessage("The scrape request failed. Check that both services are running.");
        return;
      }

      const result: ScrapeResult = await response.json();
      setScrapeResult(result);
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
          <h1 className="text-xl font-medium">Assignment demo</h1>
          <p className="text-sm text-muted mt-1">
            Fixed target: books.toscrape.com — proves the polite scraping
            pipeline end to end.
          </p>
        </div>

        <button
          onClick={runScrape}
          disabled={isLoading}
          className="px-4 py-2 bg-accent text-bg text-sm font-medium rounded-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Scraping..." : "Run scrape"}
        </button>

        {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

        {scrapeResult && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="bg-surface text-text px-2.5 py-1 rounded-full">
                {scrapeResult.run_report.valid_records} valid
              </span>
              <span className="bg-surface text-muted px-2.5 py-1 rounded-full">
                {scrapeResult.run_report.invalid_records} invalid
              </span>
              <span className="bg-surface text-muted px-2.5 py-1 rounded-full">
                {scrapeResult.run_report.failed_pages} failed
              </span>
              <span className="bg-surface text-muted px-2.5 py-1 rounded-full">
                {scrapeResult.run_report.cache_hits} cached
              </span>
            </div>

            <JsonViewer data={scrapeResult.data} downloadFilename="data.json" />
          </div>
        )}

      </div>
    </main>
  );
};

export default DemoPage;