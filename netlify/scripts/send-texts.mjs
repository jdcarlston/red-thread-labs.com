/**
 * Love Lab — follow-up TEXT messages, sent from JD's own number through the Mac Messages app.
 *
 * Run from the website folder, on the Mac (Messages must be signed in):
 *   node netlify/scripts/send-texts.mjs                    → preview: who gets which text, sends nothing
 *   node netlify/scripts/send-texts.mjs --test 8014770497  → sends ONE copy of each version to that number
 *   node netlify/scripts/send-texts.mjs --send             → texts everyone not already in the texts-sent log
 * Options:
 *   --sms        send as SMS (green) instead of iMessage (needs Text Message Forwarding on your iPhone)
 *   --only 8015551234,8015556789   limit to these numbers
 *   --resend     ignore the sent log
 *
 * Phone numbers come from the booking form (Netlify) plus love-lab-extra-contacts.csv (phone column)
 * in the event folder. Nothing is written into this website folder.
 */
import { execSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const FORM_ID = '6add5489dde296c4f7996399';
const SKIP_NAMES = ['d', 'jd carlston', 'jaidy carlston'];
// Already talked with them in person; don't text yet (matched on email).
const HOLD = ['stephanie@hercollectiveut.com', 'phoenixrising1113@gmail.com'];
const MISSED = ['clark0479@gmail.com', 'phoenixrising1113@gmail.com']; // booked but didn't come
const EVENT_DIR = path.join(os.homedir(), 'Library/CloudStorage/GoogleDrive-jdcarlston@gmail.com/Shared drives/!Red Thread Labs Admin/03 Programs & Curriculum/Event Planning/Cherished and Chosen (Nov 2026)');
const EXTRA_CSV = path.join(EVENT_DIR, 'love-lab-extra-contacts.csv');
const SENT_LOG = path.join(EVENT_DIR, 'love-lab-texts-sent.csv');

const args = process.argv.slice(2);
const mode = args.includes('--send') ? 'send' : args.includes('--test') ? 'test' : 'preview';
const argAfter = (flag) => (args.includes(flag) ? String(args[args.indexOf(flag) + 1] || '') : '');
const useSms = args.includes('--sms');

// ---------- the texts ----------
function textFor({ name, missed, seats }) {
  const raw = String(name || '').trim().split(/\s+/)[0] || '';
  const first = raw ? raw[0].toUpperCase() + raw.slice(1) : 'there';
  const n = Number(seats) || 1;
  if (missed) {
    return `Hi ${first}, it's JD. We missed you Wednesday! I hope you're feeling better. I sent you an email with a little of what we did, and ${n > 1 ? 'your two seats' : 'your seat'} at the January Love Lab ${n > 1 ? 'are' : 'is'} on me 💛`;
  }
  return `Hi ${first}! It's JD. I've been thinking about Wednesday all week. Thank you for coming and for jumping in the way you did 💛 I sent you an email with a few things to take into the holidays. How are you feeling since?`;
}

// ---------- helpers ----------
const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function normPhone(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 10) return '+1' + d;
  if (d.length === 11 && d.startsWith('1')) return '+' + d;
  return d.length >= 10 ? '+' + d : '';
}
function readCsv(file) {
  if (!fs.existsSync(file)) return [];
  const [head, ...rows] = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim());
  const cols = head.split(',').map((c) => c.trim().toLowerCase());
  return rows.map((r) => { const v = r.split(',').map((x) => x.trim()); return Object.fromEntries(cols.map((c, i) => [c, v[i] || ''])); });
}
function logSent(phone, name) {
  if (!fs.existsSync(SENT_LOG)) fs.writeFileSync(SENT_LOG, 'phone,name,sent_at\n');
  fs.appendFileSync(SENT_LOG, `${phone},${String(name).replace(/,/g, ' ')},${new Date().toISOString()}\n`);
}

// ---------- who gets it ----------
function people() {
  const subs = JSON.parse(sh(`netlify api listFormSubmissions --data '{"form_id":"${FORM_ID}","per_page":100}'`));
  const byPhone = new Map();
  for (const s of subs) {
    const d = s.data || {};
    const name = String(d.name || s.name || '').trim();
    const email = String(d.email || s.email || '').trim().toLowerCase();
    const phone = normPhone(d.phone);
    if (!phone || SKIP_NAMES.includes(name.toLowerCase()) || HOLD.includes(email)) continue;
    if (!byPhone.has(phone)) byPhone.set(phone, { name, phone, seats: d.seats, missed: MISSED.includes(email) });
  }
  for (const r of readCsv(EXTRA_CSV)) {
    const phone = normPhone(r.phone);
    if (!phone || byPhone.has(phone)) continue;
    byPhone.set(phone, { name: r.name, phone, seats: r.seats || 1, missed: /^(no|n|false|0)$/i.test(r.attended || '') });
  }
  return [...byPhone.values()];
}

function sendText(phone, body) {
  const service = useSms ? 'SMS' : 'iMessage';
  const script = `on run argv
  set targetPhone to item 1 of argv
  set msg to item 2 of argv
  tell application "Messages"
    set svc to 1st account whose service type = ${service}
    send msg to participant targetPhone of svc
  end tell
end run`;
  execFileSync('osascript', ['-e', script, phone, body], { stdio: ['ignore', 'pipe', 'pipe'] });
}

// ---------- run ----------
const only = argAfter('--only').split(',').map(normPhone).filter(Boolean);
const sent = new Set(readCsv(SENT_LOG).map((r) => r.phone));
const all = people();
const list = all
  .filter((p) => !only.length || only.includes(p.phone))
  .filter((p) => mode === 'test' || args.includes('--resend') || !sent.has(p.phone));

console.log(`\n${list.length} text(s) to send${sent.size && !args.includes('--resend') ? ` (skipping ${all.length - list.length} already texted)` : ''}:\n`);
for (const p of list) console.log(`  ${p.missed ? '[missed-you] ' : ''}${p.name} ${p.phone}\n    "${textFor(p)}"\n`);

if (mode === 'preview') { console.log('Preview only. Nothing was sent.\nNext: --test YOURNUMBER to see both versions on your phone, then --send.\n'); process.exit(0); }

if (mode === 'test') {
  const to = normPhone(argAfter('--test'));
  if (!to) { console.error('Usage: --test 8015551234'); process.exit(1); }
  sendText(to, textFor({ name: 'Stephanie', missed: false }));
  sendText(to, textFor({ name: 'Deanna', missed: true, seats: 2 }));
  console.log(`Sent both versions to ${to}. Check Messages for a blue (iMessage) or green (SMS) bubble, and any red "Not Delivered".\n`);
  process.exit(0);
}

let ok = 0;
for (const p of list) {
  try { sendText(p.phone, textFor(p)); logSent(p.phone, p.name); ok++; console.log(`  texted → ${p.name} ${p.phone}`); }
  catch (e) { console.error(`  FAILED → ${p.name} ${p.phone}: ${String(e.stderr || e.message).trim()}`); }
  await new Promise((r) => setTimeout(r, 1500));
}
console.log(`\nDone: ${ok} of ${list.length} texted. Open Messages and look for any red "Not Delivered" (those numbers may need --sms).\n`);
