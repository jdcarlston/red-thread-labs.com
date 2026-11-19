// Red thread drawing helpers.
//
// The site's signature element is a bundle of fine, flowing threads (mostly red, a few rose and teal).
// These functions build them as SVG paths at build time, so pages ship plain SVG with no JavaScript.
// Everything is seeded, so the same page always draws the same threads.

const COLORS = {
  thread: "#E8392E",
  coral: "#FF7777",
  rose: "#FFB4A8",
  teal: "#4FA8AC",
};

// Mostly red, some coral, a little rose, a touch of teal (the "blue highlights").
const PALETTE = [
  ...Array(6).fill(COLORS.thread),
  ...Array(4).fill(COLORS.coral),
  ...Array(2).fill(COLORS.rose),
  COLORS.teal,
];

/** Small, fast seeded random number generator (mulberry32). Returns a function giving 0..1. */
function seeded(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turn a list of [x, y] points into a smooth SVG path (quadratic curves through midpoints). */
function smoothPath(points) {
  const f = (n) => n.toFixed(1);
  let d = `M ${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += ` Q ${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
  }
  const last = points[points.length - 1];
  return d + ` L ${f(last[0])} ${f(last[1])}`;
}

/**
 * A bundle of threads travelling from start points to an end point.
 *
 * @param {object} o
 * @param {(i:number)=>[number,number]} o.start  where thread i begins
 * @param {[number,number]} o.end                 where the bundle gathers
 * @param {number} o.count                        how many threads
 * @param {number} [o.amp=70]                     how far the threads swing in the middle
 * @param {number} [o.endSpread=0.7]              how far apart the threads land at the end
 * @param {number} [o.seed=7]                     change for a different (but repeatable) pattern
 * @returns {string} SVG <path> elements
 */
function strands({ start, end, count, amp = 70, endSpread = 0.7, seed = 7 }) {
  const rand = seeded(seed);
  const between = (lo, hi) => lo + (hi - lo) * rand();
  const pick = (list) => list[Math.floor(rand() * list.length)];
  let out = "";
  for (let i = 0; i < count; i++) {
    const [sx, sy] = start(i);
    const ex = end[0];
    const ey = end[1] + (i - count / 2) * endSpread;
    const waves = between(1.5, 3.2);
    const phase = between(0, 6.28);
    const swing = amp * between(0.45, 1.15);
    const points = [];
    for (let s = 0; s <= 40; s++) {
      const t = s / 40;
      const calmEnds = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 1.2); // still at both ends, wild in the middle
      points.push([
        sx + (ex - sx) * t,
        sy + (ey - sy) * Math.pow(t, 0.8) + swing * calmEnds * Math.sin(t * Math.PI * waves + phase),
      ]);
    }
    const color = pick(PALETTE);
    const opacity = between(0.35, 0.9).toFixed(2);
    const width = pick([0.8, 1, 1, 1.2, 1.6]);
    out += `<path d="${smoothPath(points)}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linecap="round"/>`;
  }
  return out;
}

module.exports = { COLORS, strands, seeded };
