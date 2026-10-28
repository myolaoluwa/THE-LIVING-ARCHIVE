import { timingSafeEqual } from "node:crypto";
import { deliverEmailBatch } from "@/lib/commerce/deliver-email";
import { privateHeaders, reply } from "@/lib/commerce/server";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";
  const supplied = Buffer.from(authorization);
  const expected = Buffer.from(`Bearer ${secret || ""}`);
  if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
    return reply("Unauthorized.", 401);
  try {
    return Response.json(await deliverEmailBatch(), {
      headers: privateHeaders,
    });
  } catch {
    return reply("Email delivery is temporarily unavailable.", 503);
  }
}
export const POST = GET;
