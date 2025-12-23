import { redis } from "@/app/lib/redis";
import { NextResponse } from "next/server";
export const runtime = 'edge';
export async function GET() {
  const start = Date.now();
  
  // Test a write and a read
  await redis.set("test_connection", "success");
  const data = await redis.get("test_connection");
  
  const end = Date.now();
  
  return NextResponse.json({
    status: data,
    latency: `${end - start}ms`,
  });
}