export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function purchaseEmail(input: {
  reference: string;
  titles: string[];
  amount: string;
  accessUrl: string;
  recoveryUrl: string;
  support: string;
  receipt: boolean;
  testMode: boolean;
}) {
  const heading = input.receipt
    ? "Your next chapter is ready."
    : "Return to your books.";
  const prefix = input.testMode ? "[TEST] " : "";
  const subject =
    prefix +
    (input.receipt ? "Your ebook purchase — " : "Your ebook access link — ") +
    input.reference;
  const intro = input.receipt
    ? `Payment confirmed. Your digital books are ready. Total: ${input.amount}.`
    : "You requested access to your ebook purchase.";
  const expiry = "This private access link expires in 30 minutes and can be used once. Do not forward it. Save your downloaded files.";
  const text = `${heading}\n\n${intro}\nOrder: ${input.reference}\n${input.titles.join("\n")}\n\nDownload your ebooks: ${input.accessUrl}\n\n${expiry}\n\nLink expired or already used? Request a fresh link using your purchase email: ${input.recoveryUrl}\n\nHelp: ${input.support}`;
  const html = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;background:#f5f0e6;color:#172a25;font:16px/1.7 Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fffdf7;border:1px solid #d4ccbb"><tr><td style="padding:30px 24px">
<p style="letter-spacing:3px;font-size:11px;color:#59634f">THE LIVING ARCHIVE${input.testMode ? " · TEST PURCHASE" : ""}</p>
<h1 style="font:normal 36px/1.15 Georgia,serif;margin:24px 0">${escapeHtml(heading)}</h1>
<p>${escapeHtml(intro)}</p><p style="font-size:13px;overflow-wrap:anywhere">Order: <strong>${escapeHtml(input.reference)}</strong></p>
<div style="background:#eef0e5;padding:18px;margin:24px 0"><strong>Your ebooks</strong><ul style="padding-left:20px">${input.titles.map((title) => `<li style="margin:10px 0">${escapeHtml(title)}</li>`).join("")}</ul></div>
<p><a href="${escapeHtml(input.accessUrl)}" style="display:inline-block;padding:15px 22px;background:#244736;color:#ffffff;text-decoration:none;border-radius:3px;font-weight:bold">Download your ebooks →</a></p>
<p style="font-size:13px;color:#555e4c">${expiry}</p>
<p style="font-size:14px;border-top:1px solid #d4ccbb;padding-top:20px"><strong>Opening this email later?</strong><br>Request a <a href="${escapeHtml(input.recoveryUrl)}" style="color:#244736;text-decoration:underline">fresh download access link</a> using the email address from your purchase.</p>
<p style="font-size:13px">Need help? ${escapeHtml(input.support)}</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}
