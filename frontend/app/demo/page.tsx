"use client";

import { useState } from "react";

type ScrapeResult = {
  data: unknown[];
  errors: unknown[];
  run_report: {
    started_at: string;
    duration_seconds: number;
    catalogue_pages_fetched: number;
    detail_pages_attempted: number;
    valid_records: number;
    invalid_records: number;
    failed_pages: number;
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

  const copyToClipboard = async () => {
    if (!scrapeResult) return;
    await navigator.clipboard.writeText(JSON.stringify(scrapeResult.data, null, 2));
  };

  const downloadJson = () => {
    if (!scrapeResult) return;
    const blob = new Blob([JSON.stringify(scrapeResult.data, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = "data.json";
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-medium">Assignment demo</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Fixed target: books.toscrape.com — proves the polite scraping
            pipeline end to end.
          </p>
        </div>

        <button
          onClick={runScrape}
          disabled={isLoading}
          className="px-4 py-2 bg-neutral-100 text-neutral-950 text-sm font-medium rounded-md hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Scraping..." : "Run scrape"}
        </button>

        {errorMessage && (
          <p className="text-sm text-red-400">{errorMessage}</p>
        )}

        {scrapeResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="border border-neutral-800 rounded-md p-3">
                <p className="text-neutral-500">Valid records</p>
                <p className="text-lg">{scrapeResult.run_report.valid_records}</p>
              </div>
              <div className="border border-neutral-800 rounded-md p-3">
                <p className="text-neutral-500">Invalid records</p>
                <p className="text-lg">{scrapeResult.run_report.invalid_records}</p>
              </div>
              <div className="border border-neutral-800 rounded-md p-3">
                <p className="text-neutral-500">Failed pages</p>
                <p className="text-lg">{scrapeResult.run_report.failed_pages}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 text-sm border border-neutral-800 rounded-md hover:bg-neutral-900"
              >
                Copy JSON
              </button>
              <button
                onClick={downloadJson}
                className="px-3 py-1.5 text-sm border border-neutral-800 rounded-md hover:bg-neutral-900"
              >
                Download JSON
              </button>
            </div>

            <pre className="border border-neutral-800 rounded-md p-4 text-xs overflow-auto max-h-125 bg-neutral-900 select-text">
              {JSON.stringify(scrapeResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
};

export default DemoPage;