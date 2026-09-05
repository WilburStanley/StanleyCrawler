"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type HealthStatus = {
  backend: { status: string };
  scraper_service: { status: string; latency_ms: number };
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

const navLinks = [
  {
    href: "/demo",
    title: "Assignment demo",
    description: "books.toscrape.com, all 7 stages",
  },
  {
    href: "/auto-scrape",
    title: "Auto scrape",
    description: "Paste any URL, detect structure automatically",
  },
];

const usageNotes = [
  "Works best on server rendered pages, where the content is already present in the page's HTML.",
  "Tries structured data first (JSON LD, Open Graph, Twitter Card tags), then falls back to a readability style extraction of the main text.",
  "Also scans the raw HTML directly for images and linked downloadable files.",
  "Every field in the result is tagged with exactly which method found it.",
];

const limitationNotes = [
  "Cannot see content that a page renders client side, after JavaScript runs. Plain client rendered single page apps (for example, a Create React App style site with no server rendering) will return little to no data.",
  "Framework based sites that render on the server, such as Next.js by default, are not affected by this limitation.",
  "Result quality depends entirely on what the source page actually publishes. A page with no structured data and little readable text will return a thin result, not an error.",
];

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
    <main className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
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
              scraper service
            </div>
            <span className="text-muted font-mono text-xs">
              {health ? `${health.scraper_service.status} · ${health.scraper_service.latency_ms}ms` : "checking..."}
            </span>
          </div>
        </div>

        <div className="border border-border rounded-sm divide-y divide-border">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between px-4 py-3 hover:bg-surface"
            >
              <div>
                <p className="text-sm">{link.title}</p>
                <p className="text-xs text-muted mt-0.5">{link.description}</p>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </Link>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium">Usage</h2>
            <ul className="mt-2 space-y-1.5 text-xs text-muted list-disc pl-4">
              {usageNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-medium">Limitations</h2>
            <ul className="mt-2 space-y-1.5 text-xs text-muted list-disc pl-4">
              {limitationNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default HomePage;