/**
 * POST /api/square-webhook
 * Square calls this when a payment changes. When a Love Lab payment is COMPLETED,
 * we email the buyer their confirmation and arrival details.
 *
 * Environment variables:
 *   SQUARE_WEBHOOK_SIGNATURE_KEY — Square Developer → your app → Webhooks → your subscription → Signature key
 *   SQUARE_WEBHOOK_URL           — exactly the URL you gave Square (default https://red-thread-labs.com/api/square-webhook — the primary domain, since www redirects and Square won't follow redirects)
 *   SQUARE_ACCESS_TOKEN, SQUARE_ENV — same as the checkout function (used to look up the order)
 *   plus the email settings in netlify/lib/confirmation.mjs
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { sendConfirmation } from '../lib/confirmation.mjs';

const SQUARE_VERSION = '2026-09-16';
const ok = (msg) => new Response(msg || 'ok', { status: 200 });

function signatureValid(body, header) {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!key || !header) return false;
  const url = process.env.SQUARE_WEBHOOK_URL || 'https://red-thread-labs.com/api/square-webhook';
  const expected = createHmac('sha256', key).update(url + body).digest('base64');
  const a = Buffer.from(expected), b = Buffer.from(String(header));
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const body = await req.text();
  if (!signatureValid(body, req.headers.get('x-square-hmacsha256-signature'))) {
    console.warn('Square webhook: bad or missing signature');
    return new Response('Invalid signature', { status: 403 });
  }

  let event;
  try { event = JSON.parse(body); } catch { return ok('ignored: not json'); }
  const payment = event?.data?.object?.payment;
  if (!payment || payment.status !== 'COMPLETED') return ok('ignored: not a completed payment');
  if (payment.refunded_money && payment.refunded_money.amount > 0) return ok('ignored: refunded');
  if (!payment.order_id) return ok('ignored: no order');

  // Look up the order to see what was bought and who for.
  const host = String(process.env.SQUARE_ENV || '').toLowerCase() === 'sandbox' ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com';
  let order;
  try {
    const res = await fetch(`${host}/v2/orders/${encodeURIComponent(payment.order_id)}`, {
      headers: { Authorization: 'Bearer ' + process.env.SQUARE_ACCESS_TOKEN, 'Square-Version': SQUARE_VERSION },
    });
    // Square's "Send test event" uses an order from Square's demo account: not found (404) or not
    // ours to read (403). If the event came from a different merchant, acknowledge and skip it.
    if (res.status === 404 || res.status === 403) {
      const me = await fetch(`${host}/v2/merchants/me`, {
        headers: { Authorization: 'Bearer ' + process.env.SQUARE_ACCESS_TOKEN, 'Square-Version': SQUARE_VERSION },
      }).then((r) => r.json()).catch(() => ({}));
      if (me?.merchant?.id && event.merchant_id && me.merchant.id !== event.merchant_id) {
        return ok('ignored: event from another merchant (test event)');
      }
    }
    order = (await res.json()).order;
    if (!res.ok || !order) throw new Error('order lookup ' + res.status);
  } catch (err) {
    console.error('Square webhook: could not load order', payment.order_id, err);
    return new Response('order lookup failed', { status: 500 }); // Square will retry
  }

  const items = order.line_items || [];
  const isLoveLab = order.reference_id === 'love-lab-2026-11-11' || items.some((i) => /cherished/i.test(i.name || ''));
  if (!isLoveLab) return ok('ignored: not a Love Lab order');

  // Seats: 1-seat item = 1 each; "2 seats" backup link = 2; group checkout uses quantity.
  let seats = 0;
  for (const i of items) {
    const q = Number(i.quantity) || 1;
    const per = /(\d+)\s*seats?/i.exec(i.name || '');
    seats += per && !/group seat|1 seat/i.test(i.name) ? Number(per[1]) * q : q;
  }
  seats = seats || 1;

  const recipient = order.fulfillments?.[0]?.digital_details?.recipient || {};
  const noteName = String(items[0]?.note || '').split(' + ')[0].trim();
  const name = noteName || recipient.display_name || [recipient.address?.first_name, recipient.address?.last_name].filter(Boolean).join(' ') || '';
  const email = payment.buyer_email_address || recipient.email_address;
  if (!email) {
    console.error('Square webhook: no buyer email on payment', payment.id);
    return ok('no email');
  }

  try {
    await sendConfirmation({ email, name, seats, idempotencyKey: 'confirm-' + payment.id });
    console.log('Confirmation sent for order', payment.order_id);
  } catch (err) {
    return new Response('send failed', { status: 500 }); // Square will retry
  }
  return ok('confirmation sent');
};

export const config = { path: '/api/square-webhook' };
