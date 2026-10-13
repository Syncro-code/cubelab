// Algorithm database. Every entry is checked by scripts/verify-algs.mjs.
//
// alg     main algorithm (parenthesised moves are AUF/setup and are still applied)
// alts    alternatives that solve the same case (up to an AUF)
// setup   optional setup used to draw the case; defaults to the inverse of alg
// view    diagram type: 'oll' (orientation only), 'pll' (top + arrows), 'f2l' (isometric)

export const PLL = [
  { id: 'Aa', name: 'Aa Perm', group: 'Corners only', alg: "x R' U R' D2 R U' R' D2 R2 x'", alts: ["x L2 D2 L' U' L D2 L' U L' x'"] },
  { id: 'Ab', name: 'Ab Perm', group: 'Corners only', alg: "x R2 D2 R U R' D2 R U' R x'", alts: ["x L U' L D2 L' U L D2 L2 x'"] },
  { id: 'E', name: 'E Perm', group: 'Corners only', alg: "x' R U' R' D R U R' D' R U R' D R U' R' D' x" },
  { id: 'H', name: 'H Perm', group: 'Edges only', alg: 'M2 U M2 U2 M2 U M2' },
  { id: 'Ua', name: 'Ua Perm', group: 'Edges only', alg: "M2 U M U2 M' U M2", alts: ["R U' R U R U R U' R' U' R2"] },
  { id: 'Ub', name: 'Ub Perm', group: 'Edges only', alg: "M2 U' M U2 M' U' M2", alts: ["R2 U R U R' U' R' U' R' U R'"] },
  { id: 'Z', name: 'Z Perm', group: 'Edges only', alg: "M' U M2 U M2 U M' U2 M2" },
  { id: 'T', name: 'T Perm', group: 'Adjacent corner swap', alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { id: 'F', name: 'F Perm', group: 'Adjacent corner swap', alg: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
  { id: 'Ja', name: 'Ja Perm', group: 'Adjacent corner swap', alg: "x R2 F R F' R U2 r' U r U2 x'", alts: ["L' U' L F L' U' L U L F' L2 U L"] },
  { id: 'Jb', name: 'Jb Perm', group: 'Adjacent corner swap', alg: "R U R' F' R U R' U' R' F R2 U' R'" },
  { id: 'Ra', name: 'Ra Perm', group: 'Adjacent corner swap', alg: "R U' R' U' R U R D R' U' R D' R' U2 R'" },
  { id: 'Rb', name: 'Rb Perm', group: 'Adjacent corner swap', alg: "R2 F R U R U' R' F' R U2 R' U2 R" },
  { id: 'Ga', name: 'Ga Perm', group: 'G perms', alg: "R2 U R' U R' U' R U' R2 U' D R' U R D'" },
  { id: 'Gb', name: 'Gb Perm', group: 'G perms', alg: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
  { id: 'Gc', name: 'Gc Perm', group: 'G perms', alg: "R2 U' R U' R U R' U R2 U D' R U' R' D" },
  { id: 'Gd', name: 'Gd Perm', group: 'G perms', alg: "R U R' U' D R2 U' R U' R' U R' U R2 D'" },
  { id: 'V', name: 'V Perm', group: 'Diagonal corner swap', alg: "R' U R' U' y R' F' R2 U' R' U R' F R F" },
  { id: 'Y', name: 'Y Perm', group: 'Diagonal corner swap', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { id: 'Na', name: 'Na Perm', group: 'Diagonal corner swap', alg: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
  { id: 'Nb', name: 'Nb Perm', group: 'Diagonal corner swap', alg: "R' U R U' R' F' U' F R U R' F R' F' R U' R" },
];

export const OLL = [
  { id: 1, name: 'Runway', group: 'Dot', alg: "R U2 R2 F R F' U2 R' F R F'" },
  { id: 2, name: 'Zamboni', group: 'Dot', alg: "F R U R' U' F' f R U R' U' f'" },
  { id: 3, name: 'Anti-Mouse', group: 'Dot', alg: "(U) f R U R' U' f' U' F R U R' U' F'" },
  { id: 4, name: 'Mouse', group: 'Dot', alg: "f R U R' U' f' U F R U R' U' F'" },
  { id: 17, name: 'Slash', group: 'Dot', alg: "R U R' U R' F R F' U2 R' F R F'" },
  { id: 18, name: 'Crown', group: 'Dot', alg: "r U R' U R U2 r2 U' R U' R' U2 r" },
  { id: 19, name: 'Bunny', group: 'Dot', alg: "r' R U R U R' U' M' R' F R F'" },
  { id: 20, name: 'Checkers', group: 'Dot', alg: "r U R' U' M2 U R U' R' U' M'" },
  { id: 21, name: 'H / Double Sune', group: 'Cross (OCLL)', alg: "R U R' U R U' R' U R U2 R'" },
  { id: 22, name: 'Pi', group: 'Cross (OCLL)', alg: "R U2 R2 U' R2 U' R2 U2 R" },
  { id: 23, name: 'Headlights', group: 'Cross (OCLL)', alg: "R2 D' R U2 R' D R U2 R" },
  { id: 24, name: 'Chameleon', group: 'Cross (OCLL)', alg: "r U R' U' r' F R F'" },
  { id: 25, name: 'Bowtie', group: 'Cross (OCLL)', alg: "F' r U R' U' r' F R" },
  { id: 26, name: 'Antisune', group: 'Cross (OCLL)', alg: "R U2 R' U' R U' R'" },
  { id: 27, name: 'Sune', group: 'Cross (OCLL)', alg: "R U R' U R U2 R'" },
  { id: 28, name: 'Stealth', group: 'Corners oriented', alg: "r U R' U' M U R U' R'" },
  { id: 57, name: 'Mummy', group: 'Corners oriented', alg: "R U R' U' M' U R U' r'" },
  { id: 5, name: 'Lefty Square', group: 'Square', alg: "(U2) l' U2 L U L' U l", alts: ["r' U2 R U R' U r"] },
  { id: 6, name: 'Righty Square', group: 'Square', alg: "(U2) r U2 R' U' R U' r'" },
  { id: 7, name: 'Lightning', group: 'Small lightning', alg: "r U R' U R U2 r'" },
  { id: 8, name: 'Reverse Lightning', group: 'Small lightning', alg: "l' U' L U' L' U2 l" },
  { id: 11, name: 'Downstairs', group: 'Small lightning', alg: "r U R' U R' F R F' R U2 r'" },
  { id: 12, name: 'Upstairs', group: 'Small lightning', alg: "M' R' U' R U' R' U2 R U' R r'" },
  { id: 9, name: 'Kite', group: 'Fish', alg: "(U') R U R' U' R' F R2 U R' U' F'" },
  { id: 10, name: 'Anti-Kite', group: 'Fish', alg: "(U') R U R' U R' F R F' R U2 R'" },
  { id: 35, name: 'Fish Salad', group: 'Fish', alg: "R U2 R2 F R F' R U2 R'" },
  { id: 37, name: 'Mounted Fish', group: 'Fish', alg: "(U) F R' F' R U R U' R'" },
  { id: 13, name: 'Gun', group: 'Knight move', alg: "r U' r' U' r U r' F' U F" },
  { id: 14, name: 'Anti-Gun', group: 'Knight move', alg: "R' F R U R' F' R F U' F'" },
  { id: 15, name: 'Squeegee', group: 'Knight move', alg: "(U2) r' U' r R' U' R U r' U r" },
  { id: 16, name: 'Anti-Squeegee', group: 'Knight move', alg: "(U2) r U r' R U R' U' r U' r'" },
  { id: 29, name: 'Spotted Chameleon', group: 'Awkward', alg: "(U) R U R' U' R U' R' F' U' F R U R'" },
  { id: 30, name: 'Anti-Spotted Chameleon', group: 'Awkward', alg: "(U2) F U R U2 R' U' R U2 R' U' F'" },
  { id: 41, name: 'Awkward Fish', group: 'Awkward', alg: "(U2) R U R' U R U2 R' F R U R' U' F'" },
  { id: 42, name: 'Lefty Awkward Fish', group: 'Awkward', alg: "R' U' R U' R' U2 R F R U R' U' F'" },
  { id: 31, name: 'Couch', group: 'P shapes', alg: "(U2) R' U' F U R U' R' F' R" },
  { id: 32, name: 'Anti-Couch', group: 'P shapes', alg: "S R U R' U' R' F R f'" },
  { id: 43, name: 'Anti-P', group: 'P shapes', alg: "(U) R' U' F' U F R" },
  { id: 44, name: 'P', group: 'P shapes', alg: "(U2) F U R U' R' F'" },
  { id: 33, name: 'Shoelaces', group: 'T shapes', alg: "R U R' U' R' F R F'" },
  { id: 45, name: 'T / Suit Up', group: 'T shapes', alg: "F R U R' U' F'" },
  { id: 34, name: 'City', group: 'C shapes', alg: "R U R2 U' R' F R U R U' F'" },
  { id: 46, name: 'Seein\' Headlights', group: 'C shapes', alg: "R' U' R' F R F' U R" },
  { id: 36, name: 'Wario', group: 'W shapes', alg: "(U2) L' U' L U' L' U L U L F' L' F" },
  { id: 38, name: 'Mario', group: 'W shapes', alg: "(U2) R U R' U R U' R' U' R' F R F'" },
  { id: 39, name: 'Fung', group: 'Big lightning', alg: "L F' L' U' L U F U' L'" },
  { id: 40, name: 'Anti-Fung', group: 'Big lightning', alg: "R' F R U R' U' F' U R" },
  { id: 47, name: 'Anti-Breakneck', group: 'L shapes', alg: "R' U' R' F R F' R' F R F' U R" },
  { id: 48, name: 'Breakneck', group: 'L shapes', alg: "F R U R' U' R U R' U' F'" },
  { id: 49, name: 'Right Back Squeezy', group: 'L shapes', alg: "(U2) r U' r2 U r2 U r2 U' r" },
  { id: 50, name: 'Right Front Squeezy', group: 'L shapes', alg: "r' U r2 U' r2 U' r2 U r'" },
  { id: 53, name: 'Frying Pan', group: 'L shapes', alg: "l' U' L U' L' U L U' L' U2 l" },
  { id: 54, name: 'Anti-Frying Pan', group: 'L shapes', alg: "r U R' U R U' R' U R U2 r'" },
  { id: 51, name: 'Bottlecap', group: 'I shapes', alg: "F U R U' R' U R U' R' F'" },
  { id: 52, name: 'Rice Cooker', group: 'I shapes', alg: "R U R' U R U' B U' B' R'" },
  { id: 55, name: 'Highway', group: 'I shapes', alg: "R U2 R2 U' R U' R' U2 F R F'" },
  { id: 56, name: 'Streetlights', group: 'I shapes', alg: "r U r' U R U' R' U R U' R' r U' r'" },
];

// 2-look OLL: orient edges, then corners.
export const OLL_EDGES = [
  { id: 'line', name: 'Line', alg: "F R U R' U' F'", note: 'Hold the line horizontally.' },
  { id: 'angle', name: 'L shape', alg: "f R U R' U' f'", note: 'Hold the L at the back-left (9 o\'clock to 12 o\'clock).' },
  { id: 'dot', name: 'Dot', alg: "F R U R' U' F' f R U R' U' f'", note: 'Line alg, then L alg.' },
];
export const OLL_CORNERS = [
  { id: 'sune', name: 'Sune', alg: "R U R' U R U2 R'" },
  { id: 'antisune', name: 'Antisune', alg: "R U2 R' U' R U' R'" },
  { id: 'h', name: 'H', alg: "R U R' U R U' R' U R U2 R'" },
  { id: 'pi', name: 'Pi', alg: "R U2 R2 U' R2 U' R2 U2 R" },
  { id: 'headlights', name: 'Headlights', alg: "R2 D' R U2 R' D R U2 R" },
  { id: 'chameleon', name: 'Chameleon', alg: "r U R' U' r' F R F'" },
  { id: 'bowtie', name: 'Bowtie', alg: "F' r U R' U' r' F R" },
];

// 2-look PLL: corners, then edges.
export const PLL_CORNERS = [
  { id: 'headlights', name: 'Adjacent swap (headlights)', alg: "R U R' U' R' F R2 U' R' U' R U R' F'", note: 'T perm. Put the headlights on the left.' },
  { id: 'diagonal', name: 'Diagonal swap', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", note: 'Y perm.' },
];
export const PLL_EDGES = [
  { id: 'ua', name: 'Ua', alg: "M2 U M U2 M' U M2" },
  { id: 'ub', name: 'Ub', alg: "M2 U' M U2 M' U' M2" },
  { id: 'h', name: 'H', alg: 'M2 U M2 U2 M2 U M2' },
  { id: 'z', name: 'Z', alg: "M' U M2 U M2 U M' U2 M2" },
];

// Beginner (layer-by-layer) method. Cube is held white-side down after step 2.
export const BEGINNER = [
  { id: 'corner-insert', name: 'Insert a white corner', alg: "R U R' U'", note: 'Corner in the top layer above its slot, front-right. Repeat until the corner is solved (1, 3 or 5 times).', view: 'none' },
  { id: 'edge-right', name: 'Second layer: edge to the right', alg: "U R U' R' U' F' U F", view: 'f2l' },
  { id: 'edge-left', name: 'Second layer: edge to the left', alg: "U' L' U L U F U' F'", view: 'f2l' },
  { id: 'yellow-cross', name: 'Yellow cross', alg: "F R U R' U' F'", note: 'Dot: do it, then the L appears. L: hold it at back-left. Line: hold it horizontally.', view: 'oll' },
  { id: 'yellow-edges', name: 'Match the yellow edges', alg: "R U R' U R U2 R' U", note: 'Swaps the front and left edges. Hold the two solved adjacent edges at back and right.', view: 'pll' },
  { id: 'corner-position', name: 'Position yellow corners', alg: "U R U' L' U R' U' L", note: 'Cycles three corners. Hold the correctly placed corner at front-right.', view: 'pll' },
  { id: 'corner-orient', name: 'Twist yellow corners', alg: "R' D' R D", note: 'With the corner at front-right, repeat until its yellow faces up (2 or 4 times). Turn only U to bring the next corner to front-right. The cube looks broken mid-way — keep going!', view: 'none' },
];

// A curated set of first-two-layers cases (front-right slot).
export const F2L = [
  { id: 'basic-1', name: 'Pair ready: insert from right', alg: "U R U' R'" },
  { id: 'basic-2', name: 'Pair ready: insert from front', alg: "U' F' U F" },
  { id: 'basic-3', name: 'Split pair: right', alg: "R U R'" },
  { id: 'basic-4', name: 'Split pair: front', alg: "F' U' F" },
  { id: 'f2l-5', name: 'Edge away, white right', alg: "U' R U R' U2 R U' R'" },
  { id: 'f2l-6', name: 'Edge away, white front', alg: "U F' U' F U2 F' U F" },
  { id: 'f2l-7', name: 'Disconnected, same colour on top', alg: "U' R U2 R' U2 R U' R'" },
  { id: 'f2l-9', name: 'Edge right, corner hidden', alg: "U' R U' R' U F' U' F" },
  { id: 'f2l-10', name: 'Hook the pair', alg: "U' R U R' U R U R'" },
  { id: 'f2l-17', name: 'White up, pair separated', alg: "R U2 R' U' R U R'" },
  { id: 'f2l-19', name: 'White up, edge back', alg: "U R U2 R' U R U' R'" },
  { id: 'f2l-21', name: 'White up, edge left', alg: "U2 R U R' U R U' R'" },
  { id: 'f2l-23', name: 'White up, edge in front', alg: "U R U' R' U' R U' R' U R U' R'" },
  { id: 'f2l-25', name: 'Corner in slot, edge on top (front)', alg: "U' R' F R F' R U R'" },
  { id: 'f2l-27', name: 'Corner in slot, edge on top (right)', alg: "R U' R' U R U' R'" },
  { id: 'f2l-33', name: 'Edge in slot, corner on top', alg: "U' R U' R' U2 R U' R'" },
  { id: 'f2l-34', name: 'Edge in slot, corner on top (mirror)', alg: "U R U R' U2 R U R'" },
  { id: 'f2l-37', name: 'Pair flipped in slot', alg: "R2 U2 F R2 F' U2 R' U R'" },
  { id: 'f2l-38', name: 'Corner twisted in slot', alg: "R U' R' U' R U R' U2 R U' R'" },
];

// Big cube parity. Diagrams use the pure inner-slice versions as setups.
export const PARITY_444 = [
  {
    id: 'oll-parity', name: 'OLL parity', view: 'oll', puzzle: 4,
    alg: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
    alts: ["2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2"],
    setup: "2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2",
    note: 'One edge pair is flipped (you see an odd number of flipped edges after the 3x3 stage). Hold the bad edge at the front. The main alg also shuffles a few top-layer pieces, which is fine because PLL comes next. The alternative (inner slices only) is pure.',
  },
  {
    id: 'pll-parity', name: 'PLL parity', view: 'pll', puzzle: 4,
    alg: "2R2 U2 2R2 Uw2 2R2 Uw2 (U2)",
    note: 'Two opposite edge pairs are swapped. If you see a case that is not a real PLL (two edges or two corners swapped), do this, then solve PLL normally.',
  },
];
export const PARITY_555 = [
  {
    id: 'edge-parity', name: 'Last tredge parity (flipped wings)', view: 'oll', puzzle: 5,
    alg: "2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2",
    note: 'During the last two edges, one tredge has its two wings swapped (the midge is fine). Hold it at UF and do this. It only touches the wing pieces.',
  },
];

// Edge pairing tools for 4x4/5x5 (no case diagram, watch them in 3D).
export const EDGE_PAIRING = [
  { id: 'flip', name: 'Edge flip / swap', alg: "R U R' F R' F' R", note: 'Replaces the paired edge at front-right with an unpaired edge from the top, flipped. Used between "slice" and "unslice".', view: 'none' },
  { id: 'slice-flip-slice', name: 'Slice - flip - slice (4x4)', alg: "Uw' R U R' F R' F' R Uw", note: 'Pairs the edges at front-left/front-right, stores the pair, and restores the centers.', view: 'none', puzzle: 4 },
  { id: 'slice-flip-slice-5', name: 'Slice - flip - slice (5x5)', alg: "Dw R F' U R' F Dw'", note: 'A common 5x5 pairing trigger: slice down, swap in a fresh edge, slice back.', view: 'none', puzzle: 5 },
];
