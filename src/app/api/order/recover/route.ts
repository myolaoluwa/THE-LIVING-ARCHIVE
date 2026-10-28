import { after } from "next/server";
import { deliverEmailBatch } from "@/lib/commerce/deliver-email";
import { createHmac } from "node:crypto";
import { z } from "zod";
import {
  commerceServices,
  privateHeaders,
  rateLimit,
  reply,
  sameOrigin,
} from "@/lib/commerce/server";
export const runtime = "nodejs";
const generic = () =>
  Response.json(
    {
      message:
        "If this email has an eligible purchase, an access link will be sent. Check your inbox and spam folder.",
    },
    { status: 202, headers: privateHeaders },
  );
export async function POST(request: Request) {
  const s = commerceServices();
  if (
    !s ||
    process.env.TRANSACTIONAL_EMAIL_ENABLED !== "true" ||
    !process.env.BREVO_API_KEY ||
    !process.env.EMAIL_FROM_ADDRESS
  )
    return reply(
      "Email recovery is not available yet. Please contact the author with your order reference.",
      503,
    );
  if (!sameOrigin(request, s.config)) return reply("Request not allowed.", 403);
  if (!(await rateLimit(request, "recovery", s, 10, 3600))) return generic();
  let input: unknown;
  try {
    const text = await request.text();
    if (text.length > 1024) return generic();
    input = JSON.parse(text);
  } catch {
    return generic();
  }
  const data = z
    .object({
      email: z
        .email()
        .max(254)
        .transform((value) => value.toLowerCase()),
    })
    .safeParse(input);
  if (!data.success) return generic();
  const key = createHmac("sha256", s.config.rateSecret)
    .update(`recovery-email:${data.data.email}`)
    .digest("hex");
  const limit = await s.db.rpc("commerce_rate_limit", {
    p_key: key,
    p_limit: 5,
    p_seconds: 3600,
  });
  if (!limit.error && limit.data === true)
    await s.db.rpc("commerce_request_recovery", { p_email: data.data.email });
  after(async () => {
    try {
      await deliverEmailBatch();
    } catch {
      /* Retry through the durable queue worker. */
    }
  });
  return generic();
}
