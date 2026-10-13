// Tutorial content. Text supports **bold** and `moves` (see richText in ui/dom.js).
// Block types: p, h, tip, warn, list, steps, algs (an algorithm set rendered as cards).

export const NOTATION_DEMO = [
  { id: 'R', name: 'R — right face clockwise', alg: 'R' },
  { id: "R'", name: "R' — right face counter-clockwise", alg: "R'" },
  { id: 'R2', name: 'R2 — half turn', alg: 'R2' },
  { id: 'U', name: 'U — up face', alg: 'U' },
  { id: 'F', name: 'F — front face', alg: 'F' },
  { id: 'L', name: 'L — left face', alg: 'L' },
  { id: 'D', name: 'D — down face', alg: 'D' },
  { id: 'B', name: 'B — back face', alg: 'B' },
  { id: 'Rw', name: 'Rw (or r) — two layers', alg: 'Rw' },
  { id: 'M', name: 'M — middle slice (like L)', alg: 'M' },
  { id: 'E', name: 'E — equator slice (like D)', alg: 'E' },
  { id: 'S', name: 'S — standing slice (like F)', alg: 'S' },
  { id: 'x', name: 'x — rotate whole cube (like R)', alg: 'x' },
  { id: 'y', name: 'y — rotate whole cube (like U)', alg: 'y' },
  { id: 'z', name: 'z — rotate whole cube (like F)', alg: 'z' },
  { id: 'sexy', name: "R U R' U' — the \"sexy move\"", alg: "R U R' U'" },
];

export const NOTATION_BIG = [
  { id: '2R', name: '2R — second layer only', alg: '2R', puzzle: 4 },
  { id: 'Rw4', name: 'Rw — outer two layers', alg: 'Rw', puzzle: 4 },
  { id: 'Uw', name: 'Uw — top two layers', alg: 'Uw', puzzle: 4 },
  { id: '3Rw', name: '3Rw — outer three layers', alg: '3Rw', puzzle: 5 },
  { id: '3R', name: '3R — middle slice of a 5x5', alg: '3R', puzzle: 5 },
];

export const GUIDES = [
  {
    id: 'notation', title: 'Notation', sections: [
      {
        id: 'basics', title: 'Reading moves', blocks: [
          { type: 'p', text: 'Every move is a letter naming a face. Turn that face **clockwise as if you were looking straight at it**.' },
          { type: 'list', items: [
            '**R** right · **L** left · **U** up · **D** down · **F** front · **B** back',
            "A prime **'** means counter-clockwise: `R'`",
            'A **2** means a half turn (direction does not matter): `R2`',
            'Hold the cube still while you do an algorithm. Only rotate it when you see **x**, **y** or **z**.',
          ] },
          { type: 'tip', text: 'Tap ▶ on any card below to watch the move on the 3D cube. You can drag the cube to look around it.' },
          { type: 'algs', source: 'NOTATION_DEMO', view: 'none', puzzle: 3, practice: false },
        ],
      },
      {
        id: 'more', title: 'Wide, slice and rotation moves', blocks: [
          { type: 'list', items: [
            '**Wide moves** turn two layers at once: `Rw` (also written `r`). A number in front sets the depth: `3Rw` turns three layers.',
            '**Slice moves** turn a middle layer: `M` follows `L`, `E` follows `D`, `S` follows `F`.',
            '**Big cube slices**: `2R` turns only the second layer from the right. (Some 4x4 tutorials write this as a lowercase `r` — in this app `r` always means the wide move `Rw`.)',
            '**Rotations** move the whole cube: `x` like `R`, `y` like `U`, `z` like `F`.',
            'Moves in brackets, like `(U2)` at the start of an algorithm, are an **AUF** (adjust U face) to line the case up with the picture.',
          ] },
          { type: 'algs', source: 'NOTATION_BIG', view: 'none', practice: false },
        ],
      },
    ],
  },
  {
    id: '333', title: '3x3', sections: [
      {
        id: 'beginner', title: 'Beginner method', blocks: [
          { type: 'p', text: 'The layer-by-layer method solves the cube in 7 steps and needs only a handful of short algorithms. Learn this first, then move on to CFOP.' },
          { type: 'h', text: 'Step 1 · White cross' },
          { type: 'p', text: 'Put the four white edges around the white center so each edge\'s side color also matches its side center. This step is intuitive — no algorithm needed.' },
          { type: 'list', items: [
            '**Daisy trick:** hold yellow on top and bring the four white edges up around it (white facing up), making a flower.',
            'Turn `U` until a petal\'s side color matches the center below it, then turn that face twice (`F2`) to send it down to the white side.',
            'Repeat for all four petals. Flip the cube over: you have a white cross.',
          ] },
          { type: 'h', text: 'Step 2 · White corners' },
          { type: 'p', text: 'Find a corner with white on it in the top layer. Turn `U` until it sits directly above the slot where it belongs (between its two colors), with that slot at the front-right. Repeat the move below until the corner drops in correctly: 1, 3 or 5 times.' },
          { type: 'algs', source: 'BEGINNER', ids: ['corner-insert'], practice: false },
          { type: 'tip', text: 'If a white corner is stuck in the bottom layer in the wrong place, do the move once with it at front-right to pop it into the top layer.' },
          { type: 'h', text: 'Step 3 · Second layer edges' },
          { type: 'p', text: 'Flip the cube so white is on the bottom. Find a top-layer edge with **no yellow**. Turn `U` so its front color matches the front center (an upside-down T). Then send it right or left depending on its top color:' },
          { type: 'algs', source: 'BEGINNER', ids: ['edge-right', 'edge-left'], view: 'f2l-full', practice: false },
          { type: 'tip', text: 'Edge stuck in the middle layer the wrong way round? Insert any yellow-topped edge into that slot to kick it out, then solve it normally.' },
          { type: 'h', text: 'Step 4 · Yellow cross' },
          { type: 'p', text: 'You will see a dot, an L, a line, or already a cross. For a dot do the move, then the L appears. Hold the L in the back-left (top-left in the picture) and hold a line horizontally.' },
          { type: 'algs', source: 'BEGINNER', ids: ['yellow-cross'], view: 'oll', practice: false },
          { type: 'h', text: 'Step 5 · Match the yellow edges' },
          { type: 'p', text: 'Turn `U` until at least two edges match their side centers. If they are next to each other, hold them at the back and right, then do the algorithm. If they are opposite, do it once from any angle and try again.' },
          { type: 'algs', source: 'BEGINNER', ids: ['yellow-edges'], view: 'pll-edges', practice: false },
          { type: 'h', text: 'Step 6 · Put the yellow corners in place' },
          { type: 'p', text: 'A corner is in the right place when its three colors match the three centers around it (twisting does not matter yet). Hold a correct one at front-right and repeat until all four are in place. If none are, do it once from anywhere.' },
          { type: 'algs', source: 'BEGINNER', ids: ['corner-position'], view: 'pll', practice: false },
          { type: 'h', text: 'Step 7 · Twist the yellow corners' },
          { type: 'p', text: 'Hold the cube with yellow on top. With an unsolved corner at front-right, repeat `R\' D\' R D` until its yellow faces up. Then turn only `U` to bring the next unsolved corner to the front-right and repeat. The bottom looks scrambled in the middle of this step — trust it, it fixes itself.' },
          { type: 'algs', source: 'BEGINNER', ids: ['corner-orient'], practice: false },
          { type: 'tip', text: 'Done! Finish with a `U` turn if needed. Typical beginner times are 1–3 minutes; with practice this method can get you under a minute.' },
        ],
      },
      {
        id: 'cfop', title: 'CFOP overview', blocks: [
          { type: 'p', text: 'CFOP (Fridrich) is the method most speedcubers use. It has four steps:' },
          { type: 'steps', items: [
            ['Cross', 'Solve the white cross on the bottom, planned during inspection. Aim for 8 moves or fewer.'],
            ['F2L', 'First Two Layers: pair each white corner with its middle edge in the top layer and insert them together. Four pairs.'],
            ['OLL', 'Orient Last Layer: make the whole top yellow in one algorithm (57 cases) or two (2-look, 10 algorithms).'],
            ['PLL', 'Permute Last Layer: move the pieces to finish the cube (21 cases) or 2-look (6 algorithms).'],
          ] },
          { type: 'h', text: 'Suggested learning path' },
          { type: 'list', items: [
            'Beginner method → **cross on the bottom** (do it every solve, even if it is slow at first).',
            '**Intuitive F2L** — understand how pairs form; learn the cases below as a reference.',
            '**2-look OLL** (10 algs) and **2-look PLL** (6 algs).',
            '**Full PLL** (21) — fewer cases and a big payoff.',
            '**Full OLL** (57) — learn a few groups at a time.',
          ] },
          { type: 'tip', text: 'Use the 🎯 Practice buttons: the timer will give you real scrambles that produce exactly the case you are learning.' },
        ],
      },
      {
        id: 'f2l', title: 'F2L', blocks: [
          { type: 'p', text: 'Each case shows the front-right slot. Gray stickers do not matter. The idea is always the same: **join the corner and edge in the top layer, then insert the pair** without breaking the cross.' },
          { type: 'list', items: [
            '`U R U\' R\'` and `U\' F\' U F` insert a ready-made pair; `R U R\'` and `F\' U\' F` insert a "split" pair.',
            'Use empty slots and `U` turns to join pairs. Avoid rotating the cube — use the back slots with `R\'` / `L` moves when you can.',
            'Solve slowly enough that you can look for the next pair while inserting this one (lookahead). Slow and smooth beats fast and stopping.',
          ] },
          { type: 'algs', source: 'F2L', view: 'f2l' },
        ],
      },
      {
        id: 'oll2', title: '2-look OLL', blocks: [
          { type: 'p', text: 'First make a yellow cross (orient the edges), then twist the corners. Ten algorithms total and three are the same move repeated.' },
          { type: 'h', text: 'Look 1 · Edges' },
          { type: 'algs', source: 'OLL_EDGES', view: 'oll' },
          { type: 'h', text: 'Look 2 · Corners' },
          { type: 'p', text: 'Match the pattern of yellow stickers on the top and the sides.' },
          { type: 'algs', source: 'OLL_CORNERS', view: 'oll' },
        ],
      },
      {
        id: 'pll2', title: '2-look PLL', blocks: [
          { type: 'p', text: 'First solve the corners, then the edges. Look at the sides of the top layer for **headlights**: two stickers of the same color on one side.' },
          { type: 'h', text: 'Look 1 · Corners' },
          { type: 'list', items: [
            'Headlights on one side only → put them on the **left** and do the adjacent swap.',
            'No headlights anywhere → diagonal swap.',
            'Headlights on all four sides → corners are done.',
          ] },
          { type: 'algs', source: 'PLL_CORNERS', view: 'pll' },
          { type: 'h', text: 'Look 2 · Edges' },
          { type: 'algs', source: 'PLL_EDGES', view: 'pll' },
        ],
      },
      {
        id: 'pll', title: 'Full PLL (21)', blocks: [
          { type: 'p', text: 'Arrows show where each piece goes. Learn T, Ua/Ub, Aa/Ab, H, Z and Y first — you already know some from 2-look PLL.' },
          { type: 'algs', source: 'PLL', view: 'pll', grouped: true },
        ],
      },
      {
        id: 'oll', title: 'Full OLL (57)', blocks: [
          { type: 'p', text: 'Yellow shows stickers that are already yellow. Learn the cross cases (2-look) first, then go shape by shape.' },
          { type: 'algs', source: 'OLL', view: 'oll', grouped: true },
        ],
      },
    ],
  },
  {
    id: '444', title: '4x4', sections: [
      {
        id: 'overview', title: 'Reduction method', blocks: [
          { type: 'p', text: 'The 4x4 is solved by **reducing** it to a 3x3: build the 2x2 centers, pair the edge pieces into 12 edge pairs (dedges), then solve it like a 3x3. Two "parity" cases can appear at the end that a 3x3 can never have — they each have a single algorithm.' },
          { type: 'steps', items: [
            ['Centers', 'Build all six 2x2 centers in the correct color arrangement.'],
            ['Edges', 'Pair the 24 edge pieces into 12 dedges.'],
            ['3x3 stage', 'Solve like a 3x3, fixing OLL/PLL parity if it shows up.'],
          ] },
          { type: 'warn', text: 'The 4x4 has no fixed centers, so you must place them in the right order: **white opposite yellow, green opposite blue, red opposite orange**. With white on top and green in front, **red goes on the right**.' },
          { type: 'h', text: 'Big cube notation' },
          { type: 'algs', source: 'NOTATION_BIG', ids: ['2R', 'Rw4', 'Uw'], view: 'none', practice: false },
        ],
      },
      {
        id: 'centers', title: 'Step 1 · Centers', blocks: [
          { type: 'list', items: [
            '**First center (white):** make a 1x2 bar of white, then a second bar, and join them with a wide move like `Rw U Rw\'`. Keep the first bar on top and bring the second one under it.',
            '**Second center (yellow) opposite:** put white on the bottom and build yellow on top the same way, using only `Rw`/`Lw` moves and `U`/`F`-type turns so the white center comes back.',
            '**Last four centers:** keep white and yellow on top and bottom. Build bars on the sides and insert them with `Rw U Rw\'` / `Rw U2 Rw\'`. Check the color order before the last two!',
          ] },
          { type: 'tip', text: 'A wide move that you undo right after (like `Rw U Rw\'`) never breaks centers you already built on U and D. That is the key idea for every center step.' },
        ],
      },
      {
        id: 'edges', title: 'Step 2 · Edge pairing', blocks: [
          { type: 'p', text: 'Use the **slice – flip – slice** idea: bring two matching edge pieces to the front-left and front-right at the same height, slice them together with `Uw` or `Dw`, store the new pair with the flip algorithm, then undo the slice to restore the centers.' },
          { type: 'steps', items: [
            ['Find', 'Put an edge piece at front-left; find its partner and bring it to front-right at the same height (flip it in place with the flip alg if needed).'],
            ['Slice', 'Do `Uw` or `Dw` (whichever joins them) — the centers break temporarily.'],
            ['Flip', 'Do `R U R\' F R\' F\' R` — the new pair goes into the top layer and an unpaired edge takes its place.'],
            ['Unslice', 'Undo the slice (`Uw\'` or `Dw\'`). Centers are fixed and you have one more pair.'],
          ] },
          { type: 'algs', source: 'EDGE_PAIRING', ids: ['flip', 'slice-flip-slice'], view: 'none', practice: false, puzzle: 4 },
          { type: 'tip', text: 'Pair up to 8 edges freely, then do the last few carefully. For the last two, put both at front-left/front-right and slice-flip-slice once.' },
        ],
      },
      {
        id: 'parity', title: 'Step 3 · 3x3 stage & parity', blocks: [
          { type: 'p', text: 'Solve the cube as a 3x3 using the centers and paired edges. Two things can happen that a 3x3 cannot do:' },
          { type: 'list', items: [
            '**OLL parity:** an odd number of edges are flipped (often one single edge pair at the yellow cross step). Fix it before OLL.',
            '**PLL parity:** at PLL you see two edges or two corners swapped — a case that is not one of the 21 PLLs. Fix it, then finish with a normal PLL.',
          ] },
          { type: 'algs', source: 'PARITY_444', view: 'auto', puzzle: 4, practice: false },
          { type: 'tip', text: 'You can get OLL parity, PLL parity, both, or neither. Each happens about half the time.' },
        ],
      },
    ],
  },
  {
    id: '555', title: '5x5', sections: [
      {
        id: 'overview', title: 'Reduction method', blocks: [
          { type: 'p', text: 'The 5x5 is solved like the 4x4: **centers → edges → 3x3 stage**. Each center is a 3x3 block with a fixed middle piece, and each edge is a **tredge** (a fixed middle edge "midge" plus two "wings").' },
          { type: 'tip', text: 'Good news: because the center pieces are fixed, the color scheme takes care of itself and there is **no OLL or PLL parity** at the 3x3 stage. The only parity happens while pairing the last two edges.' },
          { type: 'h', text: 'Big cube notation' },
          { type: 'algs', source: 'NOTATION_BIG', ids: ['2R', '3Rw', '3R'], view: 'none', practice: false },
        ],
      },
      {
        id: 'centers', title: 'Step 1 · Centers', blocks: [
          { type: 'list', items: [
            '**First center:** build 1x3 bars (a column of three including the middle piece) and join them. A common order: make a "+" plus sign first, then fill the corners of the center.',
            '**Opposite center:** with the first center on the bottom, build the opposite one on top using wide moves you undo (`Rw U Rw\'`, `3Rw U2 3Rw\'`).',
            '**Last four centers:** build 1x3 bars on the side faces and insert them with `Rw U Rw\'`-style moves. Do two centers fully, then the last two together.',
          ] },
          { type: 'tip', text: 'Building centers efficiently is the biggest time sink on 5x5. Spend practice time here: try to see the next bar while you insert the current one.' },
        ],
      },
      {
        id: 'edges', title: 'Step 2 · Tredges', blocks: [
          { type: 'p', text: 'Pair the two wing pieces with their midge using the same slice – flip – slice idea as the 4x4. Put the midge at front-left and bring a matching wing next to it on the right, then slice with `Uw`/`Dw`, store the pair with `R U R\' F R\' F\' R`, and slice back.' },
          { type: 'algs', source: 'EDGE_PAIRING', ids: ['flip', 'slice-flip-slice-5'], view: 'none', practice: false, puzzle: 5 },
          { type: 'h', text: 'Last two edges (L2E)' },
          { type: 'p', text: 'With two tredges left, put them at front-left and front-right and keep slicing/flipping until both are done. Sometimes one tredge ends up with its two wings swapped: the midge is right but the wings are backwards. That is edge parity:' },
          { type: 'algs', source: 'PARITY_555', view: 'oll', puzzle: 5, practice: false },
        ],
      },
      {
        id: 'finish', title: 'Step 3 · 3x3 stage', blocks: [
          { type: 'p', text: 'Treat each 3x3 center as a center and each tredge as an edge, and solve with your 3x3 method. Use wide moves only if your algorithm calls for them (on a 5x5, `Rw` turns two layers).' },
          { type: 'tip', text: 'Turn more gently than on a 3x3 — big cubes catch and pop more easily if layers are misaligned.' },
        ],
      },
    ],
  },
  {
    id: 'tips', title: 'Tips', sections: [
      {
        id: 'timer', title: 'Using the timer', blocks: [
          { type: 'list', items: [
            '**Desktop:** hold **Space** until the time turns green, release to start, press any key to stop.',
            '**Phone:** touch and hold the timer until it turns green, let go to start, tap anywhere to stop.',
            'Turn on **WCA inspection** in Settings to get 15 seconds to look at the cube (with 8 s and 12 s warnings). Starting after 15 s adds +2, after 17 s is a DNF.',
            'After a solve, tap **+2** or **DNF** to add a penalty, or delete it.',
            'Use the scramble buttons to watch the scramble on the 3D cube or copy it.',
          ] },
        ],
      },
      {
        id: 'averages', title: 'What the averages mean', blocks: [
          { type: 'list', items: [
            '**Ao5** — average of 5: drop the best and the worst time, average the middle 3 (how official competitions rank you).',
            '**Ao12** — average of 12: drop the best and worst, average the middle 10.',
            '**Ao50 / Ao100** — drop the best and worst 5% (3 / 5 times on each end), average the rest.',
            'A **DNF** counts as the worst time. Two DNFs in an Ao5 make the whole average a DNF.',
            'You get a chime and confetti for a new **best single** or a new best **Ao5 / Ao12 / Ao50 / Ao100** on that puzzle.',
          ] },
        ],
      },
      {
        id: 'practice', title: 'Getting faster', blocks: [
          { type: 'list', items: [
            '**Plan the cross during inspection.** Try to see the whole cross before you start turning.',
            '**Slow down to speed up.** Do slow solves without pauses — lookahead beats fast turning.',
            '**Learn PLL before full OLL.** 21 cases, used every solve.',
            '**Drill algorithms with Practice mode** (🎯) and mark them learned (✓) to track progress.',
            '**Finger tricks:** do `U` turns with your right index finger flicking the back-right of the top layer; `U\'` with the left index finger. Keep the cube in your fingertips, not your palms.',
            '**Cube setup:** a little silicone lube and the right tension make a huge difference on 4x4 and 5x5.',
          ] },
        ],
      },
    ],
  },
];
