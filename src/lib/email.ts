import "server-only";

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/** Sends via Resend's HTTP API (works on Cloudflare Workers — plain fetch). */
export async function sendEmail(opts: { to: string; subject: string; text: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Dev fallback: print so you can click the link without an email provider.
    console.log(`\n[email:dev] To: ${opts.to}\n[email:dev] Subject: ${opts.subject}\n${opts.text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "MARVEL.WTF <no-reply@marvel.wtf>",
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    }),
  });
  if (!res.ok) console.error("[email] Resend error", res.status, await res.text().catch(() => ""));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function actionEmail(heading: string, body: string, cta: string, url: string) {
  const html = `<div style="background:#0a0a0f;padding:32px;font-family:Arial,sans-serif;color:#f4f4f5">
  <div style="max-width:480px;margin:auto;border:3px solid #ffd400;padding:28px;background:#14141c">
  <h1 style="margin:0 0 12px;font-size:22px;letter-spacing:2px">${esc(heading)}</h1>
  <p style="color:#a1a1aa;line-height:1.5">${esc(body)}</p>
  <p><a href="${esc(url)}" style="display:inline-block;background:#e11d2e;color:#fff;padding:12px 20px;text-decoration:none;font-weight:bold">${esc(cta)}</a></p>
  <p style="color:#71717a;font-size:12px">If you didn't request this, ignore this email.</p></div></div>`;
  return { html, text: `${heading}\n\n${body}\n\n${cta}: ${url}\n` };
}
