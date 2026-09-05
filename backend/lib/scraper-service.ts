import { NextResponse } from "next/server";

export const scraperServiceUrl = process.env.SCRAPER_SERVICE_URL ?? "http://localhost:8000";
export const internalApiKey = process.env.INTERNAL_API_KEY ?? "";

export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.FRONTEND_URL ?? "http://localhost:3001",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const handleCorsPreflight = async () => {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
};

const requestTimestampsByIp = new Map<string, number[]>();

export const isRateLimited = (ipAddress: string, maxRequests: number, windowMs: number) => {
  const now = Date.now();
  const existingTimestamps = requestTimestampsByIp.get(ipAddress) ?? [];
  const recentTimestamps = existingTimestamps.filter((timestamp) => now - timestamp < windowMs);

  if (recentTimestamps.length >= maxRequests) {
    return true;
  }

  recentTimestamps.push(now);
  requestTimestampsByIp.set(ipAddress, recentTimestamps);
  return false;
};

export const getClientIp = (request: Request) => {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
};