import { NextResponse } from "next/server";
import { z } from "zod";
import {
  scraperServiceUrl,
  internalApiKey,
  corsHeaders,
  handleCorsPreflight,
  isRateLimited,
  getClientIp,
} from "@/lib/scraper-service";

const autoScrapeRequestSchema = z.object({
  url: z.url(),
});

const autoScrapeResponseSchema = z.object({
  source_url: z.string(),
  fetched_at: z.string(),
  fields: z.record(z.string(), z.any()),
  field_sources: z.record(z.string(), z.string()),
  raw: z.object({
    json_ld: z.record(z.string(), z.any()).nullable(),
    open_graph: z.record(z.string(), z.any()).nullable(),
    readability: z.record(z.string(), z.any()).nullable(),
  }),
});

export const OPTIONS = handleCorsPreflight;

export const POST = async (request: Request) => {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 10, 60_000)) {
    return NextResponse.json(
      { message: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: corsHeaders },
    );
  }

  const rawRequestBody = await request.json();
  const parsedRequestBody = autoScrapeRequestSchema.safeParse(rawRequestBody);

  if (!parsedRequestBody.success) {
    return NextResponse.json(
      { message: "A valid URL is required." },
      { status: 400, headers: corsHeaders },
    );
  }

  const scraperResponse = await fetch(`${scraperServiceUrl}/auto-scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": internalApiKey,
    },
    body: JSON.stringify({ url: parsedRequestBody.data.url }),
  });

  if (!scraperResponse.ok) {
    return NextResponse.json(
      { message: "The scraper service failed to complete the auto-scrape." },
      { status: 502, headers: corsHeaders },
    );
  }

  const rawScrapeResult = await scraperResponse.json();
  const parsedScrapeResult = autoScrapeResponseSchema.safeParse(rawScrapeResult);

  if (!parsedScrapeResult.success) {
    return NextResponse.json(
      { message: "The scraper service returned data that failed validation." },
      { status: 502, headers: corsHeaders },
    );
  }

  return NextResponse.json(parsedScrapeResult.data, { headers: corsHeaders });
};