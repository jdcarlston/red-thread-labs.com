import { randomUUID } from 'node:crypto';
import { sendConfirmation } from '../lib/confirmation.mjs';
import { seatStatus, recordComp } from '../lib/seats.mjs';
/**
 * Red Thread Labs — Love Lab checkout endpoint
 * POST /api/checkout   { seats, name, email, code?, check_only?, "bot-field"? }
 *
 * Builds a one-off Square checkout for exactly the seats someone chose,
 * with their email already filled in, and returns its URL.
 *
 *   1 seat          $40
 *   2 or more       $37.50 each   (2 = $75, 3 = $112.50, 4 = $150 …)
 *   free code       no checkout; the seat is confirmed on the page
 *   half-off code   50% off the order
 *   percent code    any % off the order (e.g. FRENZ = 22%)
 *
 * With check_only: true it only says what kind of code was entered
 * ({ code: 'free' | 'half' | 'percent' | 'none', percent? }) so the page can show the right total.
 *
 * Environment variables (Netlify → Site configuration → Environment variables):
 *   SQUARE_ACCESS_TOKEN   — Square Developer → your app → Credentials → Access token
 *   SQUARE_LOCATION_ID    — Square Developer → your app → Locations → Location ID
 *   SQUARE_ENV            — "sandbox" while testing, "production" when live
 *                           (anything other than "sandbox" counts as production)
 *   FREE_CODES            — comma-separated list of codes
 *   HALF_OFF_CODES        — comma-separated list of codes (optional)
 *   PERCENT_OFF_CODES     — CODE:percent pairs, comma-separated, e.g. FRENZ:22,VIP:15 (optional)
 *   SEAT_CAPACITY, SEATS_ADJUST — the seat cap; see netlify/lib/seats.mjs
 *
 * Codes and the token live only here on the server; the page never sees them.
 */

const SQUARE_VERSION = '2026-09-16';
const SITE = 'https://www.red-thread-labs.com';

const EVENT_NAME = 'The Love Lab: Cherished + Chosen';
const SINGLE_CENTS = 4000; // 1 seat
const GROUP_EACH_CENTS = 3750; // per seat when 2 or more
const MAX_SEATS = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const codeList = (v) =>
  String(v || '')
    .split(',')
    .map((s) => s.trim().replace(/^["']+|["']+$/g, '').trim().toUpperCase())
    .filter(Boolean);

// Square wants phone numbers as +1XXXXXXXXXX. Anything we can't confidently
// convert is skipped (the buyer just types it on Square's page instead).
function toE164(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const digits = s.replace(/\D/g, '');
  if (s.startsWith('+') && digits.length >= 8 && digits.length <= 15) return '+' + digits;
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  return '';
}

// PERCENT_OFF_CODES looks like "FRENZ:22,VIP:15". Returns the percent for a code, or 0.
function percentFor(c) {
  for (const pair of String(process.env.PERCENT_OFF_CODES || '').split(',')) {
    const [k, v] = pair.split(':').map((x) => String(x || '').trim());
    const pct = Number(v);
    if (k && k.toUpperCase() === c && pct > 0 && pct < 100) return pct;
  }
  return 0;
}

function codeType(code) {
  const c = String(code || '').trim().toUpperCase();
  if (!c) return 'none';
  if (codeList(process.env.FREE_CODES).includes(c)) return 'free';
  if (codeList(process.env.HALF_OFF_CODES).includes(c)) return 'half';
  if (percentFor(c)) return 'percent';
  return 'none';
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let p;
  try {
    p = await req.json();
  } catch {
    return json(400, { error: 'Expected JSON.' });
  }

  // Honeypot: bots fill every field. Pretend success, do nothing.
  if (p['bot-field']) return json(200, { ok: true, free: true });

  const type = codeType(p.code);
  const percent = type === 'percent' ? percentFor(String(p.code).trim().toUpperCase()) : 0;
  if (p.check_only) return json(200, type === 'percent' ? { code: type, percent } : { code: type });

  const seats = Math.floor(Number(p.seats));
  const name = String(p.name || '').trim().slice(0, 120);
  const email = String(p.email || '').trim().toLowerCase();

  if (!Number.isFinite(seats) || seats < 1 || seats > MAX_SEATS) {
    return json(400, { error: 'Please choose between 1 and ' + MAX_SEATS + ' seats.' });
  }
  if (!name || !EMAIL_RE.test(email) || email.length > 254) {
    return json(400, { error: 'Please add your name and a valid email.' });
  }

  // Never sell past capacity. If Square can't be reached to count, let the booking
  // through rather than turning people away (the cap is checked again on the next one).
  try {
    const { left } = await seatStatus();
    if (left <= 0) return json(409, { error: 'The Love Lab is sold out. Email contact@red-thread-labs.com to join the waitlist.', left: 0 });
    if (seats > left) return json(409, { error: 'Only ' + left + (left === 1 ? ' seat is' : ' seats are') + ' left. Please choose ' + left + ' or fewer.', left });
  } catch (err) {
    console.error('Seat check skipped:', err);
  }

  // Complimentary seats: nothing to pay. The signup is already saved in Netlify Forms.
  if (type === 'free') {
    // Record it in Square as a $0 order so the seat cap counts it.
    try {
      await recordComp({ seats, name, email, code: p.code, idempotencyKey: 'comp-' + randomUUID() });
    } catch (err) {
      console.error('Complimentary seats not recorded in Square:', err);
    }
    // Email their confirmation and arrival details. Don't block the booking if email fails.
    try {
      await sendConfirmation({ email, name, seats, idempotencyKey: 'comp-' + email + '-' + seats + '-' + randomUUID() });
    } catch (err) {
      console.error('Complimentary confirmation email failed', err);
    }
    return json(200, { ok: true, free: true });
  }

  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!token || !locationId) {
    console.error('Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID.');
    return json(500, { error: 'Checkout is not configured yet.' });
  }
  const host =
    String(process.env.SQUARE_ENV || '').toLowerCase() === 'sandbox'
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

  const each = seats === 1 ? SINGLE_CENTS : GROUP_EACH_CENTS;
  const groupNames = String(p.group_names || '').trim().slice(0, 300);

  const order = {
    location_id: locationId,
    reference_id: 'love-lab-2026-11-11',
    line_items: [
      {
        name: EVENT_NAME + (seats === 1 ? ' · 1 seat' : ' · group seat'),
        quantity: String(seats),
        base_price_money: { amount: each, currency: 'USD' },
        note: (name + (groupNames ? ' + ' + groupNames : '')).slice(0, 500),
      },
    ],
  };
  if (type === 'half') {
    order.discounts = [{ uid: 'half-off', name: 'Half off', percentage: '50', scope: 'ORDER' }];
  }
  if (type === 'percent') {
    order.discounts = [{ uid: 'code-' + percent, name: percent + '% off', percentage: String(percent), scope: 'ORDER' }];
  }

  const body = {
    idempotency_key: crypto.randomUUID(),
    order,
    checkout_options: {
      redirect_url: SITE + '/love/?paid=1',
      ask_for_shipping_address: false,
      allow_tipping: false,
      enable_coupon: false,   // codes are entered on our page instead
      enable_loyalty: false,
    },
    pre_populated_data: { buyer_email: email },
    payment_note: (EVENT_NAME + ' · ' + seats + (seats === 1 ? ' seat · ' : ' seats · ') + name).slice(0, 500),
  };

  const phone = toE164(p.phone);
  if (phone) body.pre_populated_data.buyer_phone_number = phone;

  // Fill in their name too (Square takes it as part of the buyer's address).
  const parts = name.split(/\s+/);
  const first = parts.shift() || '';
  const last = parts.join(' ');
  if (first) {
    body.pre_populated_data.buyer_address = { first_name: first.slice(0, 50), ...(last ? { last_name: last.slice(0, 50) } : {}) };
  }

  const send = (b) =>
    fetch(host + '/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Square-Version': SQUARE_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(b),
    });

  try {
    let res = await send(body);
    let data = await res.json().catch(() => ({}));
    // If Square rejects the extra prefill (phone or name), retry with just the email.
    if (!res.ok && (phone || first)) {
      console.warn('Square rejected prefill, retrying with email only', JSON.stringify(data.errors || data));
      body.pre_populated_data = { buyer_email: email };
      body.idempotency_key = crypto.randomUUID();
      res = await send(body);
      data = await res.json().catch(() => ({}));
    }
    const url = data && data.payment_link && (data.payment_link.url || data.payment_link.long_url);
    if (!res.ok || !url) {
      console.error('Square create-payment-link failed', res.status, JSON.stringify(data.errors || data));
      return json(502, { error: 'Could not reach Square right now.' });
    }
    return json(200, { ok: true, url });
  } catch (err) {
    console.error('Checkout handler threw', err);
    return json(502, { error: 'Could not reach Square right now.' });
  }
};

export const config = {
  path: '/api/checkout',
};
