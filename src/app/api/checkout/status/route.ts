import { cookies } from "next/headers";
import {
  commerceServices,
  cookieName,
  privateHeaders,
  rateLimit,
  reply,
  tokenHash,
} from "@/lib/commerce/server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const services = commerceServices();
  if (!services)
    return reply("Purchase confirmation is not available yet.", 503);
  if (!(await rateLimit(request, "status", services, 120, 60)))
    return reply("Please wait before checking this order again.", 429);
  const session = new URL(request.url).searchParams.get("session_id") || "";
  if (!/^cs_(test_)?[A-Za-z0-9_]{5,250}$/.test(session))
    return reply("Order access unavailable.", 404);
  const order = await services.db
    .from("orders")
    .select("id")
    .eq("stripe_checkout_session_id", session)
    .maybeSingle();
  if (order.error || !order.data)
    return reply("Order access unavailable.", 404);
  const token = (await cookies()).get(cookieName(order.data.id))?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    return reply("Order access unavailable.", 404);
  const result = await services.db.rpc("commerce_order_status", {
    p_id: order.data.id,
    p_hash: tokenHash(token),
    p_session: session,
  });
  if (result.error) return reply("Order access unavailable.", 404);
  return Response.json(result.data, { headers: privateHeaders });
}
