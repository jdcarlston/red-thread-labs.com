// The home page hero artwork: the black logo, a ring of rose dots around it, and the red thread
// that runs in from the left to the logo's bottom-left node and out from its bottom-right node.
//
// Drawn in a 1440 x 900 space. The threads run well past both edges, so they still reach the
// sides of the screen on very wide displays.

const { strands, seeded } = require("./threads");
const { markShapes, artToPage, CENTER, RADIUS, NODES, ART } = require("./logo");

const W = 1440;
const LOGO = { size: 380, cx: 720, cy: 400 };
const ROSE = "#FFB4A8";
const CORAL = "#FF7777";

function ring() {
  const k = LOGO.size / ART;
  const [cx, cy] = artToPage(CENTER, LOGO.size, LOGO.cx, LOGO.cy);
  const edge = RADIUS * k; // the logo circle's radius on the page
  const rand = seeded(11);
  let dots = "";
  for (let i = 0; i < 72; i++) {
    const a = (i * Math.PI) / 36;
    const r = [1.1, 1.6, 2.2][Math.floor(rand() * 3)];
    const op = (0.35 + rand() * 0.5).toFixed(2);
    dots += `<circle cx="${(cx + edge * 1.045 * Math.cos(a)).toFixed(1)}" cy="${(cy + edge * 1.045 * Math.sin(a)).toFixed(1)}" r="${r}" fill="${ROSE}" fill-opacity="${op}"/>`;
  }
  return (
    `<circle cx="${cx}" cy="${cy}" r="${(edge * 1.012).toFixed(1)}" fill="none" stroke="${ROSE}" stroke-opacity="0.3" stroke-width="1"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${(edge * 1.08).toFixed(1)}" fill="none" stroke="${CORAL}" stroke-opacity="0.5" stroke-width="2.2"/>` +
    dots
  );
}

function heroArtwork() {
  const left = artToPage(NODES.bottomLeft, LOGO.size, LOGO.cx, LOGO.cy);
  const right = artToPage(NODES.bottomRight, LOGO.size, LOGO.cx, LOGO.cy);
  const threadsIn = strands({ start: (i) => [-700, left[1] + (i - 22) * 9], end: left, count: 44, amp: 60, seed: 21 });
  const threadsOut = strands({ start: () => right, end: [W + 700, right[1]], count: 44, amp: 70, endSpread: 9, seed: 22 });
  const x = LOGO.cx - LOGO.size / 2;
  const y = LOGO.cy - LOGO.size / 2;
  return `<svg class="hero-art" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
<defs><radialGradient id="hero-glow"><stop offset="0" stop-color="#E8392E" stop-opacity=".38"/><stop offset=".4" stop-color="#E8392E" stop-opacity=".12"/><stop offset=".7" stop-color="#E8392E" stop-opacity="0"/></radialGradient></defs>
<g class="hero-threads">${threadsIn}${threadsOut}</g>
<circle cx="${LOGO.cx}" cy="${LOGO.cy}" r="310" fill="url(#hero-glow)"/>
<g class="hero-ring">${ring()}</g>
<svg x="${x}" y="${y}" width="${LOGO.size}" height="${LOGO.size}" viewBox="0 0 ${ART} ${ART}" overflow="visible">${markShapes("black")}</svg>
</svg>`;
}

/** Faint threads that run behind the menu bar on inner pages. */
function menuThreads() {
  return `<svg class="menu-threads" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">${strands({
    start: (i) => [0, 60 + (i - 10) * 2.5], end: [1440, 60], count: 20, amp: 22, endSpread: 2.5, seed: 31,
  })}</svg>`;
}

module.exports = { heroArtwork, menuThreads };
