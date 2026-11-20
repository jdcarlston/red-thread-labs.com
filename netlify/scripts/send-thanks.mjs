/**
 * Love Lab — "Thank you for Wednesday night" follow-up to everyone who came.
 *
 * Run from the website folder (where you run `netlify deploy`):
 *   node netlify/scripts/send-thanks.mjs                 → preview: lists who would get it, sends nothing
 *   node netlify/scripts/send-thanks.mjs --test you@x.com → sends ONE copy to you to check
 *   node netlify/scripts/send-thanks.mjs --send          → sends to everyone on the list
 *
 * It reads signups from Netlify Forms and your Resend key with the netlify CLI,
 * keeps everything in memory, and writes no files (this folder is published).
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EVENT, SITE } from '../lib/confirmation.mjs';

const PHOTO = `${SITE}/img/love-lab-nov11-candles.jpg`;
const FORM_ID = '6add5489dde296c4f7996399';
// Test bookings to skip (matched on full name, case-insensitive).
const SKIP_NAMES = ['d', 'jd carlston', 'jaidy carlston'];
// Nobody skipped by email for this one (Deanna gets the "missed you" version).
const SKIP_EMAILS = [];

const args = process.argv.slice(2);
const mode = args.includes('--send') ? 'send' : args.includes('--test') ? 'test' : 'preview';
const testTo = mode === 'test' ? args[args.indexOf('--test') + 1] : null;
if (mode === 'test' && !/@/.test(testTo || '')) { console.error('Usage: --test you@example.com'); process.exit(1); }

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- the email ----------
// Booked but couldn't come: they get the "we missed you" version (matched on email).
const MISSED = ['clark0479@gmail.com', 'phoenixrising1113@gmail.com'];
const HUDDLE_FULL = 'https://square.link/u/fxH8RSeB';    // $600, all three sessions
const WINNER_EMAIL = 'j@luckycloverconstruction.com'; // feedback-card drawing winner
const MAILING_LIST = 'https://www.red-thread-labs.com/#email-section';
const HUDDLE_SESSION = 'https://square.link/u/qSi1SuOi'; // $200 per session

function reminderEmail({ name, email, seats }) {
  const raw = String(name || '').trim().split(/\s+/)[0] || '';
  const first = raw ? raw[0].toUpperCase() + raw.slice(1) : 'there';
  const missed = MISSED.includes(String(email || '').toLowerCase());
  const n = Number(seats) || 1;
  const seatWord = n > 1 ? `your ${n} seats are` : 'your seat is';
  const subject = missed ? 'We missed you Wednesday 💛' : 'Thank you for Wednesday 💛';

  const openText = missed
    ? `We missed you at The Love Lab on Wednesday, and I hope you're doing well. Here's a little of what we covered, and what's coming next.`
    : `Thank you for coming to The Love Lab on Wednesday. I'm still smiling about the laughter, the stories, and how bravely everyone practiced.`;
  const openHtml = missed
    ? `We missed you at <strong>The Love Lab</strong> on Wednesday, and I hope you&rsquo;re doing well. Here&rsquo;s a little of what we covered, and what&rsquo;s coming next.`
    : `Thank you for coming to <strong>The Love Lab</strong> on Wednesday. I&rsquo;m still smiling about the laughter, the stories, and how bravely everyone practiced.`;
  const takeHead = missed ? 'Three things we practiced' : 'Three things to carry into the holidays';
  const janText = missed
    ? `The next Love Lab evening is in January, and ${seatWord} on me. Reply "January" and I'll hold ${n > 1 ? 'them' : 'it'} for you as soon as the date is set.`
    : `The next Love Lab evening is in January. Reply "January" and you'll get first pick of seats before it opens to the public.`;
  const janHtml = missed
    ? `The next Love Lab evening is in January, and <strong>${seatWord} on me</strong>. Reply &ldquo;January&rdquo; and I&rsquo;ll hold ${n > 1 ? 'them' : 'it'} for you as soon as the date is set.`
    : `The next Love Lab evening is in January. Reply &ldquo;January&rdquo; and you&rsquo;ll get <strong>first pick of seats</strong> before it opens to the public.`;

  const isWinner = String(email || '').toLowerCase() === WINNER_EMAIL;
  const drawText = isWinner
    ? `And congratulations: you won the feedback-card drawing! Your seat at the January Love Lab is on me.`
    : `Congratulations to J Aarek, who won the feedback-card drawing and a free seat at the January Love Lab!`;
  const drawHtml = isWinner
    ? `&#127881; <strong>And congratulations: you won the feedback-card drawing!</strong> Your seat at the January Love Lab is on me.`
    : `&#127881; Congratulations to <strong>J Aarek</strong>, who won the feedback-card drawing and a free seat at the January Love Lab!`;
  const text = `Hi ${first},

${openText}

${takeHead.toUpperCase()}
- Notice the urge to fix, correct, or convince. It comes from love, but it's where criticism, defensiveness, and shutting down begin.
- Listen first: "Sounds like you feel ___ because ___. Is that right?" Validating isn't agreeing.
- You will rupture. Everyone does. The goal is to repair effectively.

HOLIDAY HUDDLE
The holidays can pull even close couples apart: the busyness, the family, the old patterns. Holiday Huddle is coaching to help you stay connected through the season: three 1-hour sessions over six weeks, with text support in between. $600, or $200 per session, and couples who come together pay the same. Spots are limited.
Book all three: ${HUDDLE_FULL}
Or one session at a time: ${HUDDLE_SESSION}

JANUARY LOVE LAB
${janText}

${drawText}

Want free writing, Love Labs news, and first notice on new workshops? Join the mail list: ${MAILING_LIST}

Our education is grounded in scientific research and validated through experience. We aim to empower everyone to relate more authentically, and to find and keep the love of their life.

With love,
JD

Practice Labs Empowering People and Relationships.

--
You're getting this because you booked The Love Lab. If you'd rather not hear from me again, just reply "unsubscribe" and I'll take you off.
Red Thread Labs · P.O. Box 266 · Draper, UT 84020
`;

  const h3 = (t) => `<h3 style="margin:0 0 8px;font-family:Georgia,serif;font-size:19px;color:#1D1C1A;">${t}</h3>`;
  const p = (t, mb = 16) => `<p style="margin:0 0 ${mb}px;">${t}</p>`;
  const li = (t) => `<li style="margin:0 0 8px;">${t}</li>`;
  const btn = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 10px;"><tr><td style="background:#D63838;border-radius:6px;"><a href="${href}" style="display:inline-block;padding:13px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#FFFFFF;text-decoration:none;">${label}</a></td></tr></table>`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F4F1EC;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EC;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:6px;font-family:Arial,Helvetica,sans-serif;color:#1D1C1A;">
<tr><td align="center" style="padding:28px 28px 8px;"><img src="${SITE}/img/rtl-email-logo.png" width="64" height="64" alt="Red Thread Labs" style="display:block;border:0;"></td></tr>
<tr><td style="padding:8px 32px 6px;font-size:16px;line-height:1.55;">
${p(`Hi ${esc(first)},`, 14)}
${p(openHtml)}
</td></tr>
<tr><td style="padding:6px 32px 20px;"><img src="${PHOTO}" width="496" alt="Candlelight on the table at The Love Lab" style="display:block;width:100%;max-width:496px;height:auto;border:0;border-radius:6px;"></td></tr>
<tr><td style="padding:0 32px 8px;font-size:15px;line-height:1.55;">
${h3(takeHead)}
<ul style="margin:0 0 18px;padding-left:20px;">
${li('Notice the urge to <strong>fix, correct, or convince</strong>. It comes from love, but it&rsquo;s where criticism, defensiveness, and shutting down begin.')}
${li('<strong>Listen first:</strong> <em style="font-family:Georgia,serif;">&ldquo;Sounds like you feel ___ because ___. Is that right?&rdquo;</em> Validating isn&rsquo;t agreeing.')}
${li('<strong>You will rupture.</strong> Everyone does. The goal is to repair effectively.')}
</ul>
</td></tr>
<tr><td style="padding:0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFE5E5;border-radius:6px;"><tr><td style="padding:20px 22px;font-size:15px;line-height:1.55;">
<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B42B2B;margin-bottom:6px;">Holiday Huddle</div>
<div style="font-family:Georgia,serif;font-size:20px;margin-bottom:8px;">Stay close to each other through the holidays</div>
${p('The holidays can pull even close couples apart: the busyness, the family, the old patterns. Holiday Huddle is coaching to help you stay connected through the season: <strong>three 1-hour sessions over six weeks</strong>, with text support in between. $600, or $200 per session, and <strong>couples who come together pay the same</strong>. Spots are limited.', 14)}
${btn(HUDDLE_FULL, 'Book Holiday Huddle')}
<div style="font-size:13px;"><a href="${HUDDLE_SESSION}" style="color:#2E6B6E;">Or book one session at a time ($200)</a></div>
</td></tr></table>
</td></tr>
<tr><td style="padding:22px 32px 6px;font-size:15px;line-height:1.55;">
${h3('January Love Lab')}
${p(janHtml, 16)}
${p(drawHtml, 16)}
${p(`Want free writing, Love Labs news, and first notice on new workshops? <a href="${MAILING_LIST}" style="color:#2E6B6E;font-weight:bold;">Join the mail list</a>.`, 22)}
${p('<em style="font-family:Georgia,serif;color:#4A4744;">Our education is grounded in scientific research and validated through experience. We aim to empower everyone to relate more authentically, and to find and keep the love of their life.</em>', 22)}
${p('With love,', 4)}
${p('JD', 14)}
${p('<em style="color:#B42B2B;font-family:Georgia,serif;">Practice Labs Empowering People and Relationships.</em>', 28)}
</td></tr></table>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#867E77;margin:14px 0 0;">Red Thread Labs · P.O. Box 266 · Draper, UT 84020 · red-thread-labs.com</p>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#867E77;margin:6px 0 0;max-width:520px;">You&rsquo;re getting this because you booked The Love Lab. If you&rsquo;d rather not hear from me again, <a href="mailto:contact@red-thread-labs.com?subject=Unsubscribe" style="color:#867E77;">reply &ldquo;unsubscribe&rdquo;</a> and I&rsquo;ll take you off.</p>
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
    if (!email || SKIP_NAMES.includes(name.toLowerCase()) || SKIP_EMAILS.includes(email)) continue;
    const allergies = [d.allergies, d.dietary].filter((x) => x && String(x).trim()).join('; ');
    if (!byEmail.has(email)) byEmail.set(email, { email, name, seats: d.seats, allergies });
  }
  return [...byEmail.values()];
}

async function send(key, to, guest, tag = '') {
  const { subject, text, html } = reminderEmail(guest);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      // The key changes whenever the email's content changes, and test sends always get a fresh key,
      // so an edit or a second test is never silently skipped by Resend's duplicate protection.
      'Idempotency-Key': `love-lab-thanks-${to}${tag ? '-' + tag : ''}-${createHash('sha1').update(subject + html).digest('hex').slice(0, 12)}${mode === 'test' ? '-' + Date.now() : ''}`.slice(0, 256),
    },
    body: JSON.stringify({
      from: 'Red Thread Labs <contact@red-thread-labs.com>',
      to: [to],
      reply_to: 'contact@red-thread-labs.com',
      headers: { 'List-Unsubscribe': '<mailto:contact@red-thread-labs.com?subject=Unsubscribe>' },
      subject, text, html,
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const out = await res.json().catch(() => ({}));
  return out.id || '(no id returned)';
}


// ---------- extra contacts + sent log (kept in the event folder, NOT the website folder) ----------
const EVENT_DIR = path.join(os.homedir(), 'Library/CloudStorage/GoogleDrive-jdcarlston@gmail.com/Shared drives/!Red Thread Labs Admin/03 Programs & Curriculum/Event Planning/Cherished and Chosen (Nov 2026)');
const EXTRA_CSV = path.join(EVENT_DIR, 'love-lab-extra-contacts.csv'); // name,email,seats,attended,notes
const SENT_LOG = path.join(EVENT_DIR, 'love-lab-thanks-sent.csv');      // email,sent_at,resend_id

function readCsv(file) {
  if (!fs.existsSync(file)) return [];
  const [head, ...rows] = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim());
  const cols = head.split(',').map((c) => c.trim().toLowerCase());
  return rows.map((r) => {
    const v = r.split(',').map((x) => x.trim());
    return Object.fromEntries(cols.map((c, i) => [c, v[i] || '']));
  });
}
function extraContacts() {
  return readCsv(EXTRA_CSV)
    .filter((r) => /@/.test(r.email))
    .map((r) => ({ name: r.name, email: r.email.toLowerCase(), seats: r.seats || 1, allergies: '',
                   missed: /^(no|n|false|0)$/i.test(r.attended || '') }));
}
function alreadySent() {
  return new Set(readCsv(SENT_LOG).map((r) => (r.email || '').toLowerCase()).filter(Boolean));
}
function logSent(email, id) {
  if (!fs.existsSync(SENT_LOG)) fs.writeFileSync(SENT_LOG, 'email,sent_at,resend_id\n');
  fs.appendFileSync(SENT_LOG, `${email},${new Date().toISOString()},${id}\n`);
}

// --only a@x.com,b@y.com  → limit the list to these addresses (e.g. to resend to people who missed it).
const onlyArg = args.includes('--only') ? String(args[args.indexOf('--only') + 1] || '') : '';
const only = onlyArg.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
const extras = extraContacts();
for (const x of extras) if (x.missed && !MISSED.includes(x.email)) MISSED.push(x.email);
const booked = guests();
const merged = [...booked, ...extras.filter((x) => !booked.some((b) => b.email === x.email))];
const sentBefore = alreadySent();
const resendAll = args.includes('--resend');
const list = merged
  .filter((g) => !only.length || only.includes(g.email))
  .filter((g) => mode === 'test' || resendAll || !sentBefore.has(g.email));
if (sentBefore.size && !resendAll && mode !== 'test') console.log(`\nSkipping ${merged.length - list.length} people already in the sent log.`);
if (extras.length) console.log(`Added ${extras.length} from love-lab-extra-contacts.csv.`);
if (only.length && list.length !== only.length) console.warn(`\nNote: ${only.length - list.length} address(es) in --only aren't on the booking list.`);
console.log(`\n${list.length} guest(s) on the list:\n`);
for (const g of list) console.log(`  ${MISSED.includes(g.email) ? '[missed-you] ' : ''}${g.name || '(no name)'} <${g.email}> · ${g.seats || 1} seat(s)${g.allergies ? ' · food: ' + g.allergies : ''}`);

if (mode === 'preview') {
  console.log('\nPreview only. Nothing was sent.\nNext: --test you@example.com to see it in your inbox, then --send.\n');
  process.exit(0);
}

// Make sure the photo is live on the site before anything goes out.
const photoOk = await fetch(PHOTO, { method: 'HEAD' }).then((r) => r.ok).catch(() => false);
if (!photoOk) { console.error(`\nThe photo isn't live yet: ${PHOTO}\nRun  netlify deploy --prod  first, then try again.\n`); process.exit(1); }

const key = sh('netlify env:get RESEND_API_KEY');
if (!key) { console.error('Could not read RESEND_API_KEY from Netlify.'); process.exit(1); }

if (mode === 'test') {
  const sample = list.find((g) => !MISSED.includes(g.email)) || { name: 'JD', seats: 1, allergies: '' };
  const missedSample = list.find((g) => MISSED.includes(g.email)) || { name: 'Deanna Clark', email: MISSED[0], seats: 2 };
  try {
    const id1 = await send(key, testTo, { ...sample, email: testTo });
    console.log(`\nSent the guest version to ${testTo} (personalized as ${sample.name || 'JD'}). Resend id: ${id1}`);
  } catch (e) { console.error(`The guest test copy FAILED: ${e.message}`); }
  await new Promise((r) => setTimeout(r, 1200)); // give Resend's rate limit room
  try {
    const id2 = await send(key, testTo, missedSample, 'missed');
    console.log(`Sent the "missed you" version to ${testTo} (as ${missedSample.name}). Resend id: ${id2}\n`);
  } catch (e) { console.error(`The "missed you" test copy FAILED: ${e.message}`); }
} else {
  let ok = 0;
  for (const g of list) {
    try { const id = await send(key, g.email, g); logSent(g.email, id); ok++; console.log(`  sent → ${g.email}`); }
    catch (e) { console.error(`  FAILED → ${g.email}: ${e.message}`); }
    await new Promise((r) => setTimeout(r, 600)); // stay under Resend's rate limit
  }
  console.log(`\nDone: ${ok} of ${list.length} sent.\n`);
}
