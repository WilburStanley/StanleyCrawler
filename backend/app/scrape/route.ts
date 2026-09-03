import { NextResponse } from "next/server";
import { z } from "zod";

const bookRecordSchema = z.object({
  title: z.string(),
  product_url: z.url(),
  price_text: z.string(),
  price_gbp: z.number(),
  availability_text: z.string(),
  rating_text: z.string(),
  description: z.string().nullable(),
  source_page: z.url(),
  fetched_at: z.string(),
});

const scrapeErrorSchema = z.object({
  record: z.record(z.string(), z.any()),
  reason: z.string(),
});

const runReportSchema = z.object({
  started_at: z.string(),
  duration_seconds: z.number(),
  catalogue_pages_fetched: z.number(),
  detail_pages_attempted: z.number(),
  valid_records: z.number(),
  invalid_records: z.number(),
  failed_pages: z.number(),
  failed_page_details: z.array(z.record(z.string(), z.any())),
});

const scrapeResponseSchema = z.object({
  data: z.array(bookRecordSchema),
  errors: z.array(scrapeErrorSchema),
  run_report: runReportSchema,
});

const scraperServiceUrl = process.env.SCRAPER_SERVICE_URL ?? "http://localhost:8000";

export const POST = async () => {
  const scraperResponse = await fetch(`${scraperServiceUrl}/scrape`, {
    method: "POST",
  });

  if (!scraperResponse.ok) {
    return NextResponse.json(
      { message: "The scraper service failed to complete the scrape." },
      { status: 502 },
    );
  }

  const rawScrapeResult = await scraperResponse.json();
  const parsedScrapeResult = scrapeResponseSchema.safeParse(rawScrapeResult);

  if (!parsedScrapeResult.success) {
    return NextResponse.json(
      { message: "The scraper service returned data that failed validation." },
      { status: 502 },
    );
  }

  return NextResponse.json(parsedScrapeResult.data);
};