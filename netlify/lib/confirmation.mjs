/**
 * Red Thread Labs — Love Lab booking confirmation email
 * (shared by the checkout function for free-code bookings and the Square webhook for paid ones)
 *
 * No tickets: guests give their name at the door and we check it against the guest list.
 *
 * Environment variables:
 *   RESEND_API_KEY   — Resend → API keys (sending access, red-thread-labs.com)
 *   EMAIL_FROM       — optional, defaults to "Red Thread Labs <contact@red-thread-labs.com>"
 *   EMAIL_REPLY_TO   — optional, defaults to contact@red-thread-labs.com
 */

export const SITE = 'https://www.red-thread-labs.com';

export const EVENT = {
  title: 'The Love Lab: Cherished + Chosen',
  date: 'Wednesday, November 11',
  time: '6:30–9:30 PM',
  venue: '1603 E Stratford Ave, Salt Lake City',
  phone: '801-477-0497',
  mapUrl: 'https://maps.google.com/?q=1603+E+Stratford+Ave,+Salt+Lake+City,+UT',
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The confirmation + arrival email. */
export function confirmationEmail({ name, seats }) {
  const fullName = String(name || '').trim();
  const firstRaw = fullName.split(/\s+/)[0] || '';
  const first = firstRaw ? firstRaw[0].toUpperCase() + firstRaw.slice(1) : 'there';
  const n = Number(seats) || 1;
  const seatText = n === 1 ? '1 seat' : `${n} seats`;
  const listName = fullName || 'the name on your booking';
  const subject = `You're confirmed for The Love Lab · Wed, Nov 11`;

  const text = `Hi ${first},

You're confirmed for ${EVENT.title}. We can't wait to see you.

YOUR BOOKING
${fullName ? fullName + ' · ' : ''}${seatText}
No ticket needed. Just give us your name at the door.

WHEN AND WHERE
${EVENT.date} · ${EVENT.time}
${EVENT.venue}
Map: ${EVENT.mapUrl}
Plan to arrive a few minutes before 6:30.

PARKING
Park right in front of the building. There are no parking rules or time limits. The lot has limited spaces, so if it's full, street parking nearby is free.

WHEN YOU ARRIVE
Come in through the front door marked "Lark." Walk right in and give us your name${n > 1 ? `. One name covers your whole group` : ''}.

WHAT TO BRING
A journal and pen if you like. Dinner and everything else are provided.

Running late or can't find us? Call or text ${EVENT.phone}.

See you soon,
JD Carlston
Red Thread Labs
`;

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F4F1EC;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EC;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:6px;font-family:Arial,Helvetica,sans-serif;color:#1D1C1A;">
<tr><td align="center" style="padding:28px 28px 8px;"><img src="${SITE}/img/rtl-email-logo.png" width="64" height="64" alt="Red Thread Labs" style="display:block;border:0;"></td></tr>
<tr><td style="padding:8px 32px 0;font-size:16px;line-height:1.55;">
<p style="margin:0 0 14px;">Hi ${esc(first)},</p>
<p style="margin:0 0 20px;">You’re confirmed for <strong>${esc(EVENT.title)}</strong>. We can’t wait to see you.</p>
</td></tr>
<tr><td style="padding:0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #1D1C1A;border-radius:6px;">
<tr><td align="center" style="padding:20px 16px;">
<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#4A4744;">You’re on the list</div>
<div style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#D63838;margin:8px 0 4px;">${esc(listName)}</div>
<div style="font-size:15px;color:#4A4744;">${seatText}</div>
<div style="font-size:14px;color:#4A4744;margin-top:12px;">No ticket needed. Just give us your name at the door.</div>
</td></tr></table>
</td></tr>
<tr><td style="padding:22px 32px 6px;font-size:15px;line-height:1.55;">
<h3 style="margin:0 0 6px;font-family:Georgia,serif;font-size:18px;color:#1D1C1A;">When and where</h3>
<p style="margin:0 0 4px;"><strong>${EVENT.date} · ${EVENT.time}</strong></p>
<p style="margin:0 0 4px;"><a href="${EVENT.mapUrl}" style="color:#2E6B6E;">${esc(EVENT.venue)}</a></p>
<p style="margin:0 0 16px;">Plan to arrive a few minutes before 6:30.</p>
<h3 style="margin:0 0 6px;font-family:Georgia,serif;font-size:18px;">Parking</h3>
<p style="margin:0 0 16px;">Park right in front of the building. There are no parking rules or time limits. The lot has limited spaces, so if it’s full, street parking nearby is free.</p>
<h3 style="margin:0 0 6px;font-family:Georgia,serif;font-size:18px;">When you arrive</h3>
<p style="margin:0 0 16px;">Come in through the front door marked “Lark.” Walk right in and give us your name${n > 1 ? `. One name covers your whole group` : ''}.</p>
<h3 style="margin:0 0 6px;font-family:Georgia,serif;font-size:18px;">What to bring</h3>
<p style="margin:0 0 16px;">A journal and pen if you like. Dinner and everything else are provided.</p>
<p style="margin:0 0 20px;">Running late or can’t find us? Call or text <a href="tel:+18014770497" style="color:#2E6B6E;">${EVENT.phone}</a>.</p>
<p style="margin:0 0 4px;">See you soon,</p>
<p style="margin:0 0 28px;">JD Carlston<br><span style="color:#4A4744;">Red Thread Labs</span></p>
</td></tr>
</table>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#867E77;margin:14px 0 0;">Red Thread Labs · red-thread-labs.com</p>
</td></tr></table></body></html>`;

  return { subject, text, html };
}

/** Send the confirmation through Resend. idempotencyKey stops duplicates if Square retries. */
export async function sendConfirmation({ email, name, seats, idempotencyKey }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const { subject, text, html } = confirmationEmail({ name, seats });
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': String(idempotencyKey).slice(0, 256) } : {}),
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Red Thread Labs <contact@red-thread-labs.com>',
      to: [email],
      reply_to: process.env.EMAIL_REPLY_TO || 'contact@red-thread-labs.com',
      subject,
      text,
      html,
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error('Resend send failed', res.status, body);
    throw new Error('confirmation email failed');
  }
  return JSON.parse(body || '{}');
}
