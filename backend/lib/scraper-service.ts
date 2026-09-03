import { NextResponse } from "next/server";

export const scraperServiceUrl = process.env.SCRAPER_SERVICE_URL ?? "http://localhost:8000";

export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.FRONTEND_URL ?? "http://localhost:3001",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const handleCorsPreflight = async () => {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
};