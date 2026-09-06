import { NextResponse } from "next/server";
import { scraperServiceUrl, corsHeaders, handleCorsPreflight } from "@/lib/scraper-service";

export const OPTIONS = handleCorsPreflight;

export const GET = async () => {
  const startedAt = Date.now();
  let scraperServiceStatus: "ok" | "down" = "down";

  try {
    const response = await fetch(`${scraperServiceUrl}/health`);
    scraperServiceStatus = response.ok ? "ok" : "down";
  } catch {
    scraperServiceStatus = "down";
  }

  const latencyMs = Date.now() - startedAt;

  return NextResponse.json(
    {
      backend: { status: "ok" },
      scraper_service: { status: scraperServiceStatus, latency_ms: latencyMs },
    },
    { headers: corsHeaders },
  );
};