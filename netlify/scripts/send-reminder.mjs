/**
 * Love Lab — "See you Wednesday" reminder email to everyone who signed up.
 *
 * Run from the website folder (where you run `netlify deploy`):
 *   node netlify/scripts/send-reminder.mjs                 → preview: lists who would get it, sends nothing
 *   node netlify/scripts/send-reminder.mjs --test you@x.com → sends ONE copy to you to check
 *   node netlify/scripts/send-reminder.mjs --send          → sends to everyone on the list
 *
 * It reads signups from Netlify Forms and your Resend key with the netlify CLI,
 * keeps everything in memory, and writes no files (this folder is published).
 */
import { execSync } from 'node:child_process';
import { EVENT, SITE } from '../lib/confirmation.mjs';

const FORM_ID = '6add5489dde296c4f7996399';
// Test bookings to skip (matched on full name, case-insensitive).
const SKIP_NAMES = ['d', 'jd carlston', 'jaidy carlston'];

const args = process.argv.slice(2);
const mode = args.includes('--send') ? 'send' : args.includes('--test') ? 'test' : 'preview';
const testTo = mode === 'test' ? args[args.indexOf('--test') + 1] : null;
if (mode === 'test' && !/@/.test(testTo || '')) { console.error('Usage: --test you@example.com'); process.exit(1); }

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- the email ----------
function reminderEmail({ name, seats, allergies }) {
  const raw = String(name || '').trim().split(/\s+/)[0] || '';
  const first = raw ? raw[0].toUpperCase() + raw.slice(1) : 'there';
  const n = Number(seats) || 1;
  const note = String(allergies || '').trim();
  const subject = 'See you Wednesday at The Love Lab';
  const foodLine = note
    ? `We have your note: "${note}". If anything has changed, just reply to this email.`
    : `If you have a food allergy or dietary need, reply to this email by Tuesday and we'll take care of it.`;
  const groupLine = n > 1 ? ' One name covers your whole group.' : '';

  const text = `Hi ${first},

The Love Lab is this Wednesday, and I'm so glad you're coming. Here's everything you need.

WHEN AND WHERE
${EVENT.date} · ${EVENT.time}
${EVENT.venue}
Map: ${EVENT.mapUrl}
Please arrive a few minutes before 6:30. We start together.

PARKING
Park right in front of the building. There are no parking rules or time limits. If the lot is full, street parking nearby is free.

WHEN YOU ARRIVE
Come in through the front door marked "Lark" and give us your name.${groupLine}

DINNER
A Greek and Mediterranean dinner is included, served family style. ${foodLine}

WHAT TO EXPECT
Good food, a few playful games, and simple practices for staying close to the people you love through the holidays. You can pass on anything, any time. Come as you are.

WHAT TO BRING
Just yourself. A journal if you like.

A few seats are still open. If someone you love should be there too, they can book at ${SITE}/love

Running late or can't find us? Call or text ${EVENT.phone}.

See you Wednesday,
JD Carlston
Red Thread Labs
`;

  const h3 = (t) => `<h3 style="margin:0 0 6px;font-family:Georgia,serif;font-size:18px;color:#1D1C1A;">${t}</h3>`;
  const p = (t, mb = 16) => `<p style="margin:0 0 ${mb}px;">${t}</p>`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F4F1EC;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EC;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:6px;font-family:Arial,Helvetica,sans-serif;color:#1D1C1A;">
<tr><td align="center" style="padding:28px 28px 8px;"><img src="${SITE}/img/rtl-email-logo.png" width="64" height="64" alt="Red Thread Labs" style="display:block;border:0;"></td></tr>
<tr><td style="padding:8px 32px 0;font-size:16px;line-height:1.55;">
${p(`Hi ${esc(first)},`, 14)}
${p(`<strong>The Love Lab</strong> is this Wednesday, and I’m so glad you’re coming. Here’s everything you need.`, 20)}
</td></tr>
<tr><td style="padding:0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #1D1C1A;border-radius:6px;"><tr><td align="center" style="padding:18px 16px;">
<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#4A4744;">See you</div>
<div style="font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#D63838;margin:8px 0 4px;">${EVENT.date}</div>
<div style="font-size:15px;color:#4A4744;">${EVENT.time} · <a href="${EVENT.mapUrl}" style="color:#2E6B6E;">${esc(EVENT.venue)}</a></div>
</td></tr></table>
</td></tr>
<tr><td style="padding:22px 32px 6px;font-size:15px;line-height:1.55;">
${p('Please arrive a few minutes before 6:30. We start together.')}
${h3('Parking')}${p('Park right in front of the building. There are no parking rules or time limits. If the lot is full, street parking nearby is free.')}
${h3('When you arrive')}${p(`Come in through the front door marked “Lark” and give us your name.${groupLine}`)}
${h3('Dinner')}${p(`A Greek and Mediterranean dinner is included, served family style. ${esc(foodLine)}`)}
${h3('What to expect')}${p('Good food, a few playful games, and simple practices for staying close to the people you love through the holidays. You can pass on anything, any time. Come as you are.')}
${h3('What to bring')}${p('Just yourself. A journal if you like.')}
${p(`A few seats are still open. If someone you love should be there too, they can <a href="${SITE}/love" style="color:#2E6B6E;">book here</a>.`)}
${p(`Running late or can’t find us? Call or text <a href="tel:+18014770497" style="color:#2E6B6E;">${EVENT.phone}</a>.`, 20)}
${p('See you Wednesday,', 4)}
${p('JD Carlston<br><span style="color:#4A4744;">Red Thread Labs</span>', 28)}
</td></tr></table>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#867E77;margin:14px 0 0;">Red Thread Labs · red-thread-labs.com</p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}

// ---------- who gets it ----------
function guests() {
  const raw = sh(`netlify api listFormSubmissions --data '{"form_id":"${FORM_ID}","per_page":100}'`);
  const subs = JSON.parse(raw);
  const byEmail = new Map();
  for (const s of subs) {
    const d = s.data || {};
    const email = String(d.email || s.email || '').trim().toLowerCase();
    const name = String(d.name || s.name || '').trim();
    if (!email || SKIP_NAMES.includes(name.toLowerCase())) continue;
    const allergies = [d.allergies, d.dietary].filter((x) => x && String(x).trim()).join('; ');
    if (!byEmail.has(email)) byEmail.set(email, { email, name, seats: d.seats, allergies });
  }
  return [...byEmail.values()];
}

async function send(key, to, guest) {
  const { subject, text, html } = reminderEmail(guest);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      'Idempotency-Key': `love-lab-reminder-${to}`.slice(0, 256),
    },
    body: JSON.stringify({
      from: 'Red Thread Labs <contact@red-thread-labs.com>',
      to: [to],
      reply_to: 'contact@red-thread-labs.com',
      subject, text, html,
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}

const list = guests();
console.log(`\n${list.length} guest(s) on the list:\n`);
for (const g of list) console.log(`  ${g.name || '(no name)'} <${g.email}> · ${g.seats || 1} seat(s)${g.allergies ? ' · food: ' + g.allergies : ''}`);

if (mode === 'preview') {
  console.log('\nPreview only. Nothing was sent.\nNext: --test you@example.com to see it in your inbox, then --send.\n');
  process.exit(0);
}

const key = sh('netlify env:get RESEND_API_KEY');
if (!key) { console.error('Could not read RESEND_API_KEY from Netlify.'); process.exit(1); }

if (mode === 'test') {
  const sample = list[0] || { name: 'JD', seats: 1, allergies: '' };
  await send(key, testTo, { ...sample, email: testTo });
  console.log(`\nSent one test copy to ${testTo} (personalized as ${sample.name || 'JD'}).\n`);
} else {
  let ok = 0;
  for (const g of list) {
    try { await send(key, g.email, g); ok++; console.log(`  sent → ${g.email}`); }
    catch (e) { console.error(`  FAILED → ${g.email}: ${e.message}`); }
    await new Promise((r) => setTimeout(r, 600)); // stay under Resend's rate limit
  }
  console.log(`\nDone: ${ok} of ${list.length} sent.\n`);
}
