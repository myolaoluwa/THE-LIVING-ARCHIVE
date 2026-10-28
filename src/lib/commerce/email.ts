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
  const text = `${heading}\n\n${intro}\nOrder: ${input.reference}\n${input.titles.join("\n")}\n\nOpen your books: ${input.accessUrl}\n\nThis private access link expires in 30 minutes and can be used once. Do not forward it. Save your downloaded files.\nHelp: ${input.support}`;
  const html = `<div style="background:#f5f0e6;padding:32px;font:16px/1.7 Georgia,serif;color:#172a25"><p style="letter-spacing:3px;font:12px Arial,sans-serif">THE LIVING ARCHIVE</p><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(intro)}</p><p>Order: ${escapeHtml(input.reference)}</p><ul>${input.titles.map((title) => `<li>${escapeHtml(title)}</li>`).join("")}</ul><p><a href="${escapeHtml(input.accessUrl)}" style="display:inline-block;padding:14px 22px;background:#244736;color:white;text-decoration:none">Open your books →</a></p><p>This private access link expires in 30 minutes and can be used once. Do not forward it. Save your downloaded files.</p><p>Help: ${escapeHtml(input.support)}</p></div>`;
  return { subject, text, html };
}
