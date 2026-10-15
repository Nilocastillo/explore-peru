import type { APIRoute } from "astro";
import { consultationCopy } from "@/i18n/consultation";

export const prerender = false;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const asText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function getRuntimeEnv(locals: unknown) {
  return ((locals as unknown as { runtime?: { env?: Record<string, string> } }).runtime?.env ?? {}) as Record<string, string>;
}

export const POST: APIRoute = async ({ request, locals }) => {
  let body: Record<string, unknown>;
  const preferredLocale = request.headers.get("Accept-Language")?.startsWith("en") ? "en" : "es";

  try {
    body = await request.json();
  } catch {
    return json({ message: consultationCopy[preferredLocale].invalidRequest }, 400);
  }

  const locale = body.locale === "en" || (!body.locale && preferredLocale === "en") ? "en" : "es";
  const copy = consultationCopy[locale];

  if (asText(body.company)) {
    return json({ ok: true });
  }

  const name = asText(body.name);
  const phone = asText(body.phone);
  const email = asText(body.email);
  const tour = asText(body.tour) || copy.generalInquiry;
  const duration = asText(body.duration);
  const departure = asText(body.departure);
  const date = asText(body.date);
  const travelers = asText(body.travelers);
  const message = asText(body.message);

  if (!name || !phone) {
    return json({ message: copy.missingRequired }, 400);
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ message: copy.invalidEmail }, 400);
  }

  const env = { ...import.meta.env, ...getRuntimeEnv(locals) };
  const resendApiKey = env.RESEND_API_KEY;
  const to = env.RESEND_TO_EMAIL ?? env.CONTACT_TO_EMAIL ?? "info@exploreperu.com";
  const from = env.RESEND_FROM_EMAIL ?? "XPLORE PERÚ <onboarding@resend.dev>";

  if (!resendApiKey) {
    return json({ message: copy.notConfigured }, 500);
  }

  const details = [
    ["Tour", tour],
    [copy.name, name],
    ["WhatsApp", phone],
    ["Email", email],
    [copy.date, date],
    [copy.travelers, travelers],
    [copy.duration, duration],
    [copy.departures, departure],
    [copy.message, message],
  ].filter(([, value]) => value);

  const htmlRows = details
    .map(([label, value]) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:700;color:#0f172a;">${label}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#334155;">${escapeHtml(String(value))}</td>
      </tr>
    `)
    .join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: email || undefined,
      subject: `${copy.newInquiry}: ${tour}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;">
          <h1 style="font-size:24px;margin-bottom:8px;">${copy.webInquiry}</h1>
          <p style="color:#475569;margin-top:0;">${copy.emailIntro}</p>
          <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            ${htmlRows}
          </table>
        </div>
      `,
      text: details.map(([label, value]) => `${label}: ${value}`).join("\n"),
    }),
  });

  if (!response.ok) {
    return json({ message: copy.error }, 502);
  }

  return json({ ok: true });
};
