import { NextResponse } from "next/server";
import { z } from "zod";
import { scraperServiceUrl, corsHeaders, handleCorsPreflight } from "@/lib/scraper-service";

const autoScrapeRequestSchema = z.object({
  url: z.url(),
});

const autoScrapeResponseSchema = z.object({
  source_url: z.string(),
  content_type: z.string(),
  extraction_method: z.string(),
  fetched_at: z.string(),
  data: z.record(z.string(), z.any()),
});

export const OPTIONS = handleCorsPreflight;

export const POST = async (request: Request) => {
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
    headers: { "Content-Type": "application/json" },
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