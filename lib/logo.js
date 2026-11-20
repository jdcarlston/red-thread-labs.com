// The Red Thread Labs mark, drawn as SVG.
//
// Traced from rtl-logo-no-text-light.png (artwork is 1932 px square). Three colour versions:
//   cream   - cream circle, ink triangle (the original light logo)
//   black   - ink circle (85% opaque), cream triangle (home page hero)
//   oxblood - see-through reddish-black circle with a faint coral edge (menu bar on inner pages)

const ART = 1932; // artwork size, in its own units
const CENTER = [966, 994]; // centre of the circle in the artwork
const RADIUS = 882; // circle radius in the artwork

// Where the logo's own red thread starts and ends (its bottom-left and bottom-right nodes).
const NODES = { bottomLeft: [198, 1435], bottomRight: [1729, 1435] };

const INK = "#1D1C1A";
const CREAM = "#E8E5E0";
const CORAL = "#FF7777";
const GREY = "#6E6A65";

const VARIANTS = {
  cream: { circle: `fill="${CREAM}"`, triangle: INK },
  // 85% opaque, so a little of the photo behind shows through the circle.
  black: { circle: `fill="${INK}" fill-opacity="0.85"`, triangle: CREAM },
  oxblood: {
    circle: `fill="#4A1410" fill-opacity="0.85" stroke="${CORAL}" stroke-opacity="0.35" stroke-width="14"`,
    triangle: CREAM,
  },
};

/** The inner shapes of the mark, in artwork units (no outer <svg>). */
function markShapes(variant = "black") {
  const v = VARIANTS[variant] || VARIANTS.black;
  const node = (x, y) => `<circle cx="${x}" cy="${y}" r="54" fill="#FFFFFF" stroke="${CORAL}" stroke-width="15"/>`;
  const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="37" fill="${CORAL}"/>`;
  return [
    `<circle cx="${CENTER[0]}" cy="${CENTER[1]}" r="${RADIUS}" ${v.circle}/>`,
    `<polygon points="966,118 198,1435 1729,1435" fill="none" stroke="${v.triangle}" stroke-width="34" stroke-linejoin="miter"/>`,
    `<line x1="561" y1="1227" x2="1345" y2="1227" stroke="${GREY}" stroke-width="6"/>`,
    `<polyline points="198,1435 561,1227 966,529 1345,1227 1729,1435" fill="none" stroke="${CORAL}" stroke-width="15" stroke-linejoin="round"/>`,
    dot(966, 529), dot(561, 1227), dot(1345, 1227),
    node(966, 118), node(198, 1435), node(1729, 1435),
  ].join("");
}

/** A standalone logo <svg>, sized in CSS pixels. */
function logoSvg(variant = "black", size = 40, className = "logo") {
  return `<svg class="${className}" viewBox="0 0 ${ART} ${ART}" width="${size}" height="${size}" role="img" aria-label="Red Thread Labs logo">${markShapes(variant)}</svg>`;
}

/** Map a point in the artwork to page coordinates when the logo is drawn `size` px wide, centred at (cx, cy). */
function artToPage([ax, ay], size, cx, cy) {
  const k = size / ART;
  return [cx + (ax - ART / 2) * k, cy + (ay - ART / 2) * k];
}

module.exports = { ART, CENTER, RADIUS, NODES, markShapes, logoSvg, artToPage };
