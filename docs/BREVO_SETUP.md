# Automatic ebook delivery with Brevo

After Stripe confirms payment, the database queues one purchase email. The webhook immediately starts the email worker. The buyer receives a branded receipt containing the purchased titles and a **Download your ebooks** button. That button restores private download access; PDFs remain in private storage. No Brevo automation or contact-list subscription is needed.

The email includes a 30-minute, single-use access link and a permanent link to request fresh access with the purchase email. Download access is still checked against the paid order, including refunds and disputes. Emails do not contain public PDF URLs or attachments.

## What you need to do

**Hosted audit finding:** checkout is installed, but `commerce_email_jobs` is missing from the connected project (REST returned `PGRST205`). Before configuring Brevo, open `supabase/email_setup.sql`, copy its entire contents into Supabase → SQL Editor → New query and click Run once. This installs the existing email/recovery migration only. Do not rerun `checkout_setup.sql`, because the checkout tables already exist. No secret values or sample customers are in the setup file.

1. Create or sign into the author's Brevo account and enable transactional email.
2. Add and verify the sending domain/address in Brevo. Publish the DNS authentication records Brevo provides. Use that verified address for `EMAIL_FROM_ADDRESS`.
3. Create a Brevo **API key**, not an SMTP password. Add it privately to `.env.local`:

```dotenv
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM_ADDRESS=your_verified_sender_address
EMAIL_FROM_NAME=Edmund Spencer Katso
TRANSACTIONAL_EMAIL_ENABLED=false
```

Replace the placeholder values. Never paste the API key into chat. The integration sends its own HTML and plain-text email, so you do not need to build a template in Brevo.

4. Once the key and sender are ready, the same values must be set in Vercel Production. Enable `TRANSACTIONAL_EMAIL_ENABLED=true` and redeploy after verification. Keep Stripe in test mode until the full purchase/download/email flow has passed.
5. Complete a Stripe test purchase using the configured test buyer. Check the inbox, spam folder and Brevo transactional logs. Confirm the ebook titles, receipt amount, download button, fresh-link recovery and direct website downloads. Test a failed send and the retry worker before live sales.

## Delivery and retries

The worker records a send only after Brevo returns a message ID. This means Brevo accepted the message; it does not prove inbox delivery. Monitor bounces and delivery status in Brevo. Replies go to the website contact address when configured.

The durable queue retries failures with backoff, up to five attempts. Each invocation claims up to three jobs. `vercel.json` installs a daily backup job at 08:00 UTC; Vercel authenticates it with the existing `CRON_SECRET`. It runs only after deployment. This daily job is a safety net, not the immediate delivery mechanism. If delivery fails, a daily-only retry may be delayed until the next day.

For prompt retry independently of site traffic, configure an authorized scheduler every five minutes (or use a Vercel plan supporting that frequency):

```text
GET https://www.edmundspencerkatso.com/api/internal/commerce-email
Authorization: Bearer <the existing CRON_SECRET>
```

Keep the secret out of URLs and chat. No scheduler credentials are committed. Repeated Stripe events do not create another receipt job. A process crash after provider acceptance but before recording success can still produce a duplicate email; delivery remains at least once.

No messages have been sent as part of this setup work. Actual Brevo acceptance, inbox delivery and domain authentication need the author's account configuration and a controlled test purchase.

Official references: [Brevo transactional email API](https://developers.brevo.com/reference/send-transac-email), [Vercel cron authentication](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Vercel scheduling limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).
