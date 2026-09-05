"use client";

import { useState } from "react";
import { AlertCircle, Loader2, RotateCw } from "lucide-react";
import JsonViewer from "@/components/JsonViewer";
import Toast from "@/components/Toast";

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

const skeletonBadges = [0, 1, 2, 3];
const skeletonLines = [0, 1, 2, 3, 4, 5];

const DemoPage = () => {
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const runScrape = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setScrapeResult(null);

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

  const reportBadges = scrapeResult
    ? [
        { label: "valid", value: scrapeResult.run_report.valid_records, tone: "text-text" },
        { label: "invalid", value: scrapeResult.run_report.invalid_records, tone: "text-muted" },
        { label: "failed", value: scrapeResult.run_report.failed_pages, tone: "text-muted" },
        { label: "cached", value: scrapeResult.run_report.cache_hits, tone: "text-muted" },
      ]
    : [];

  return (
    <main className="min-h-screen bg-bg text-text p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-medium">Assignment demo</h1>
          <p className="text-sm text-muted mt-1">
            Fixed target: books.toscrape.com, proves the polite scraping
            pipeline end to end.
          </p>
        </div>

        <button
          onClick={runScrape}
          disabled={isLoading}
          className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-accent text-bg text-sm font-medium rounded-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          {isLoading ? "Scraping" : "Run scrape"}
        </button>

        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {skeletonBadges.map((badge) => (
                <div key={badge} className="h-7 bg-surface rounded-sm sm:rounded-full sm:w-24" />
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="h-8 w-24 bg-surface rounded-sm" />
                <div className="h-8 w-32 bg-surface rounded-sm" />
              </div>
              <div className="border border-border rounded-sm p-4 space-y-2.5">
                {skeletonLines.map((line) => (
                  <div
                    key={line}
                    className="h-3.5 bg-surface rounded-sm"
                    style={{ width: `${85 - (line % 4) * 15}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="flex items-start gap-3 border border-danger/30 bg-danger/10 rounded-sm p-4">
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-danger">{errorMessage}</p>
              <button
                onClick={runScrape}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-text"
              >
                <RotateCw size={12} />
                Try again
              </button>
            </div>
          </div>
        )}

        {!isLoading && scrapeResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 text-xs font-mono">
              {reportBadges.map((badge) => (
                <span
                  key={badge.label}
                  className={`bg-surface ${badge.tone} px-2.5 py-1.5 rounded-sm sm:rounded-full text-center sm:text-left`}
                >
                  {badge.value} {badge.label}
                </span>
              ))}
            </div>

            <div className="overflow-x-auto">
              <JsonViewer
                data={scrapeResult.data}
                downloadFilename="data.json"
                onCopy={() => setToastMessage("Copied to clipboard")}
                onDownload={() => setToastMessage("Download started")}
                onCopyError={() => setToastMessage("Couldn't copy, try again")}
              />
            </div>
          </div>
        )}
      </div>

      <Toast message={toastMessage} onClear={() => setToastMessage(null)} />
    </main>
  );
};

export default DemoPage;