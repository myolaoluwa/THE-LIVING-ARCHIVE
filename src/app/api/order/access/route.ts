import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  commerceServices,
  privateHeaders,
  rateLimit,
  rememberOrder,
  reply,
  sameOrigin,
  tokenHash,
} from "@/lib/commerce/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const s = commerceServices();
  if (!s) return reply("Purchase recovery is not available yet.", 503);
  if (!sameOrigin(request, s.config)) return reply("Request not allowed.", 403);
  if (!(await rateLimit(request, "access", s, 10, 60)))
    return reply("Please wait before trying again.", 429);
  let input: unknown;
  try {
    const text = await request.text();
    if (text.length > 1024) return reply("Invalid recovery link.", 400);
    input = JSON.parse(text);
  } catch {
    return reply("Invalid recovery link.", 400);
  }
  const parsed = z
    .object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
    .safeParse(input);
  if (!parsed.success) return reply("Invalid recovery link.", 400);
  const token = randomBytes(32).toString("hex");
  const result = await s.db.rpc("commerce_recover_access", {
    p_hash: tokenHash(parsed.data.token),
    p_access_hash: tokenHash(token),
  });
  const data = z
    .object({
      order_id: z.uuid(),
      session_id: z.string().regex(/^cs_(test_)?[A-Za-z0-9_]+$/),
    })
    .safeParse(result.data);
  if (result.error || !data.success)
    return reply(
      "This recovery link is expired, already used or unavailable. Request a fresh link.",
      404,
    );
  await rememberOrder(data.data.order_id, token);
  return Response.json(
    {
      url: `/checkout/success?session_id=${encodeURIComponent(data.data.session_id)}`,
    },
    { headers: privateHeaders },
  );
}
