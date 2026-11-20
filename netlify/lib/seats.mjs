/**
 * Red Thread Labs — Love Lab seat counter
 *
 * Counts the seats already paid for by reading the Love Lab orders in Square, so the
 * site never sells more than the room holds. Nothing is stored anywhere else.
 *
 * Environment variables:
 *   SEAT_CAPACITY   — the most people who can book (default 35)
 *   SEATS_ADJUST    — seats to add to (or subtract from) Square's count: cash or Venmo
 *                     guests, test orders to ignore. e.g. 3 or -1 (default 0)
 *
 * Complimentary bookings (free codes) are recorded in Square as $0 orders marked
 * love_lab_comp, so they count automatically.
 *   SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_ENV — same as the checkout function
 */

const SQUARE_VERSION = '2026-09-16';
const REFERENCE_ID = 'love-lab-2026-11-11';
const SINCE = '2026-10-01T00:00:00Z';

function squareHost() {
  return String(process.env.SQUARE_ENV || '').toLowerCase() === 'sandbox'
    ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com';
}

export const capacity = () => Math.max(0, Number(process.env.SEAT_CAPACITY) || 35);

/** Seats in one order, using the same rules as the payment notification. */
export function seatsInOrder(order) {
  let seats = 0;
  for (const i of order.line_items || []) {
    const q = Number(i.quantity) || 1;
    const per = /(\d+)\s*seats?/i.exec(i.name || '');
    seats += per && !/group seat|1 seat/i.test(i.name) ? Number(per[1]) * q : q;
  }
  return seats || 1;
}

const isLoveLab = (o) =>
  o.reference_id === REFERENCE_ID || (o.line_items || []).some((i) => /cherished/i.test(i.name || ''));

const isComp = (o) => o.metadata?.love_lab_comp === 'true';

function isPaidAndKept(o) {
  if (isComp(o)) return true; // complimentary seats
  if (!(o.tenders || []).length) return false; // never paid
  const total = Number(o.total_money?.amount || 0);
  const refunded = (o.refunds || [])
    .filter((r) => !/REJECTED|FAILED/i.test(r.status || ''))
    .reduce((sum, r) => sum + Number(r.amount_money?.amount || 0), 0);
  return !(total > 0 && refunded >= total); // fully refunded orders free their seats
}

/** Returns { capacity, taken, left }. Throws if Square can't be reached. */
export async function seatStatus() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!token || !locationId) throw new Error('Square is not configured');
  const host = squareHost();

  let paid = 0;
  let cursor;
  do {
    const res = await fetch(host + '/v2/orders/search', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Square-Version': SQUARE_VERSION, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location_ids: [locationId],
        limit: 500,
        cursor,
        query: { filter: {
          date_time_filter: { created_at: { start_at: SINCE } },
          state_filter: { states: ['OPEN', 'COMPLETED'] },
        } },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Square order search ' + res.status + ' ' + JSON.stringify(data.errors || ''));
    for (const o of data.orders || []) if (isLoveLab(o) && isPaidAndKept(o)) paid += seatsInOrder(o);
    cursor = data.cursor;
  } while (cursor);

  const taken = Math.max(0, paid + (Number(process.env.SEATS_ADJUST) || 0));
  const cap = capacity();
  return { capacity: cap, taken, left: Math.max(0, cap - taken) };
}

/**
 * Records a complimentary booking in Square as a $0 order so the seat counter sees it.
 * Best effort: a failure is logged and never blocks the guest's booking.
 */
export async function recordComp({ seats, name, email, code, idempotencyKey }) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!token || !locationId) throw new Error('Square is not configured');
  const host = squareHost();
  const headers = { Authorization: 'Bearer ' + token, 'Square-Version': SQUARE_VERSION, 'Content-Type': 'application/json' };
  const res = await fetch(host + '/v2/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      idempotency_key: String(idempotencyKey).slice(0, 192),
      order: {
        location_id: locationId,
        reference_id: REFERENCE_ID,
        metadata: { love_lab_comp: 'true', code: String(code || '').slice(0, 60), email: String(email || '').slice(0, 200) },
        line_items: [{
          name: 'The Love Lab: Cherished + Chosen · complimentary',
          quantity: String(seats),
          base_price_money: { amount: 4000, currency: 'USD' },
          note: String(name || '').slice(0, 500),
        }],
        discounts: [{ uid: 'comp', name: 'Complimentary', percentage: '100', scope: 'ORDER' }],
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Square comp order ' + res.status + ' ' + JSON.stringify(data.errors || ''));
  // Close out the $0 order so it doesn't sit open in Square. Not needed for counting.
  const order = data.order;
  try {
    await fetch(host + '/v2/orders/' + encodeURIComponent(order.id) + '/pay', {
      method: 'POST', headers,
      body: JSON.stringify({ idempotency_key: 'pay-' + order.id, order_version: order.version, payment_ids: [] }),
    });
  } catch {}
  return order.id;
}
