import { cookies } from "next/headers";
import { z } from "zod";
import {
  commerceServices,
  cookieName,
  privateHeaders,
  rateLimit,
  reply,
  sameOrigin,
  tokenHash,
} from "@/lib/commerce/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const services = commerceServices();
  if (!services) return reply("Downloads are not available yet.", 503);
  if (!sameOrigin(request, services.config))
    return reply("Request not allowed.", 403);
  if (!(await rateLimit(request, "download", services, 60, 60)))
    return reply("Please wait before requesting another download.", 429);
  if (Number(request.headers.get("content-length") || 0) > 2048)
    return reply("Invalid request.", 400);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply("Invalid request.", 400);
  }
  const input = z
    .object({ orderId: z.uuid(), entitlementId: z.uuid() })
    .safeParse(Object.fromEntries(form));
  if (!input.success) return reply("Download unavailable.", 404);
  const { orderId, entitlementId } = input.data;
  const token = (await cookies()).get(cookieName(orderId))?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    return reply("Download unavailable.", 404);
  const result = await services.db.rpc("commerce_claim_download", {
    p_id: orderId,
    p_hash: tokenHash(token),
    p_entitlement: entitlementId,
  });
  const asset = z
    .object({ path: z.string().min(1), format: z.enum(["pdf", "epub"]) })
    .safeParse(result.data);
  if (result.error || !asset.success)
    return reply(
      "Download unavailable, or the download limit was reached. Try again later.",
      403,
    );
  const signed = await services.db.storage
    .from("private-ebooks")
    .createSignedUrl(asset.data.path, 45, {
      download: `ebook.${asset.data.format}`,
    });
  if (signed.error)
    return reply(
      "The file could not be retrieved. Please retry or contact the author.",
      503,
    );
  return new Response(null, {
    status: 303,
    headers: { ...privateHeaders, Location: signed.data.signedUrl },
  });
}
