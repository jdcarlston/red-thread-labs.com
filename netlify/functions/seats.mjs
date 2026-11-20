/**
 * GET /api/seats → { left, soldOut }
 * Lets the booking page show how many seats remain. Only the number left is shared.
 */
import { seatStatus } from '../lib/seats.mjs';

export default async () => {
  try {
    const { left } = await seatStatus();
    return new Response(JSON.stringify({ left, soldOut: left <= 0 }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
    });
  } catch (err) {
    console.error('seat count failed', err);
    return new Response(JSON.stringify({ left: null }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
};

export const config = { path: '/api/seats' };
