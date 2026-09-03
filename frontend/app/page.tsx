"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type HealthStatus = {
  backend: { status: string };
  scraper_service: { status: string; latency_ms: number };
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

const StatusDot = ({ isHealthy }: { isHealthy: boolean }) => (
  <span
    className={`inline-block w-2 h-2 rounded-full ${isHealthy ? "bg-success" : "bg-danger"}`}
  />
);

const HomePage = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${backendUrl}/health`);
        const result: HealthStatus = await response.json();
        setHealth(result);
      } catch {
        setHealth(null);
      }
    };

    checkHealth();
  }, []);

  return (
    <main className="min-h-screen bg-bg text-text p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl font-medium">StanleyCrawler</h1>
          <p className="text-sm text-muted mt-1">Polite scraping, two ways.</p>
        </div>

        <div className="border border-border rounded-sm divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <div className="flex items-center gap-2 font-mono">
              <StatusDot isHealthy={health?.backend.status === "ok"} />
              backend
            </div>
            <span className="text-muted font-mono text-xs">
              {health ? "ok" : "checking..."}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <div className="flex items-center gap-2 font-mono">
              <StatusDot isHealthy={health?.scraper_service.status === "ok"} />
              scraper-service
            </div>
            <span className="text-muted font-mono text-xs">
              {health ? `${health.scraper_service.status} · ${health.scraper_service.latency_ms}ms` : "checking..."}
            </span>
          </div>
        </div>

        <div className="border border-border rounded-sm divide-y divide-border">
          <Link
            href="/demo"
            className="flex items-center justify-between px-4 py-3 hover:bg-surface"
          >
            <div>
              <p className="text-sm">Assignment demo</p>
              <p className="text-xs text-muted mt-0.5">books.toscrape.com, all 7 stages</p>
            </div>
            <ChevronRight size={16} className="text-muted" />
          </Link>
          <Link
            href="/auto-scrape"
            className="flex items-center justify-between px-4 py-3 hover:bg-surface"
          >
            <div>
              <p className="text-sm">Auto-scrape</p>
              <p className="text-xs text-muted mt-0.5">Paste any URL, detect structure automatically</p>
            </div>
            <ChevronRight size={16} className="text-muted" />
          </Link>
        </div>
      </div>
    </main>
  );
};

export default HomePage;