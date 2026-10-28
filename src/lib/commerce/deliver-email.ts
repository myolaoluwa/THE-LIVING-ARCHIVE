import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { env } from "@/config/env";
import { commerceServices, tokenHash } from "./server";
import { purchaseEmail } from "./email";
const jobSchema = z.object({
  job_id: z.uuid(),
  kind: z.enum(["receipt", "recovery"]),
  order_id: z.uuid(),
  email: z.email(),
  reference: z.string(),
  currency: z.string().length(3),
  total_minor: z.number().int().nonnegative(),
  items: z.array(z.string()),
});
export async function deliverEmailBatch() {
  const s = commerceServices();
  if (
    !s ||
    process.env.TRANSACTIONAL_EMAIL_ENABLED !== "true" ||
    !process.env.BREVO_API_KEY ||
    !process.env.EMAIL_FROM_ADDRESS
  )
    return { sent: 0, failed: 0, configured: false };
  const jobs = await s.db.rpc("commerce_claim_email_jobs");
  const parsed = z.array(jobSchema.nullable()).safeParse(jobs.data);
  if (jobs.error || !parsed.success)
    throw new Error("The delivery queue could not be read");
  let sent = 0,
    failed = 0;
  for (const job of parsed.data) {
    if (!job) continue;
    let success = false;
    try {
      const token = randomBytes(32).toString("hex");
      const issued = await s.db.rpc("commerce_issue_recovery", {
        p_job: job.job_id,
        p_hash: tokenHash(token),
      });
      if (issued.error) throw new Error("Recovery access unavailable");
      const message = purchaseEmail({
        reference: job.reference,
        titles: job.items,
        amount: `${new Intl.NumberFormat("en-US", { style: "currency", currency: job.currency }).format(job.total_minor / 100)} ${job.currency}`,
        accessUrl: `${s.config.origin}/order/recover#token=${token}`,
        support: env.contactEmail,
        receipt: job.kind === "receipt",
        testMode: !s.config.live,
      });
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            email: process.env.EMAIL_FROM_ADDRESS,
            name: process.env.EMAIL_FROM_NAME || "Edmund Spencer Katso",
          },
          to: [{ email: job.email }],
          subject: message.subject,
          htmlContent: message.html,
          textContent: message.text,
        }),
        signal: AbortSignal.timeout(15000),
      });
      success = response.ok;
    } catch {}
    const finished = await s.db.rpc("commerce_finish_email", {
      p_job: job.job_id,
      p_success: success,
    });
    if (success && !finished.error) sent++;
    else failed++;
  }
  return { sent, failed, configured: true };
}
