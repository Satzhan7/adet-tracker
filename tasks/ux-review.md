# UX/UI review — checklist and results

Run before each phase is merged. Measured items use the DOM audit script (row/column geometry,
contrast ratios, touch targets) at 1440 × 900, 768 × 1024 and 390 × 844 with real data.

## 1. Layout and spacing
- [ ] One spacing scale, used the same way for the same role (panel padding, tile gap, chip gap)
- [ ] Content edges line up: page header, panels and grids share the same left/right edge
- [ ] Gaps between panels equal horizontally and vertically
- [ ] Panels side by side in a row have the same height (no ragged bottoms)
- [ ] Repeated cards (KPI tiles, marking circles) equal size; labels, values and notes line up across a row
- [ ] Nothing overflows horizontally at any width; wide tables scroll inside their panel, not the page

## 2. Tables and data grids
- [ ] Header labels centred over their column in every row
- [ ] Label column the same width in every row (sticky when the grid scrolls)
- [ ] All data cells the same size; row heights equal
- [ ] Today / selected column visually distinguishable
- [ ] Empty (unmarked) state distinct from "no / missed"

## 3. Typography
- [ ] A small, deliberate type scale (sizes and weights); no one-off sizes
- [ ] Clear hierarchy: page title > panel title > KPI value > label > note
- [ ] Long text wraps or truncates on purpose; no clipped numbers
- [ ] Numbers formatted consistently (two decimals for %, units)

## 4. Colour and contrast (WCAG 2.2 AA)
- [ ] Body text ≥ 4.5:1, large text ≥ 3:1
- [ ] Icons, symbols in cells, focus rings, borders of inputs ≥ 3:1 (1.4.11)
- [ ] Colour never the only signal (✓ ✕ ↺ ◆ ½ – back up the cell colours)
- [ ] Same meaning = same colour everywhere (green done, red missed, teal made up …)
- [ ] Both themes checked

## 5. Interaction
- [ ] Touch targets ≥ 44 × 44 px for controls (dense data cells may be smaller but ≥ 24 px)
- [ ] Every interactive element has hover, focus-visible, active and disabled states
- [ ] Keyboard: logical tab order, dialogs trap focus, Esc closes, focus returns to the trigger
- [ ] Feedback for every action: optimistic change, error message with recovery, no silent failure
- [ ] Destructive actions confirm; undo where cheap
- [ ] Loading and empty states for every block

## 6. Content and language
- [ ] One language and consistent terms (Қаза / Өтелді / Мешітте used the same everywhere)
- [ ] Labels say what the number means (period, denominator)
- [ ] Dates show the year when it is not the current year

## 7. Responsive
- [ ] 1440 / 1024 / 768 / 390: layout reflows, no overlap, drawer works
- [ ] Primary action reachable by thumb on phones (floating «Белгілеу»)
- [ ] Charts and grids readable or scrollable on phones

## 8. Consistency with the design source
- [ ] Matches canvas v2 tokens (colours, radii, 14 px panel padding, 44 px buttons, 132 px label column)
- [ ] Deviations are deliberate and written down

---

## Results — 2026-11-27 (phase A preview, real data)

| # | Found | Where | Fix | After |
| --- | --- | --- | --- | --- |
| 1 | Day-grid columns misaligned: each row sized its own label column, so cells shifted under the day numbers | Уирд **up to 109 px**, Намаз / Басты бет 2.6 px; cell widths differed | One fixed 132 px label column (SPEC), short labels «Тоһа», «Әмәнәр расул» | 0 px, all cells equal |
| 2 | Side-by-side panels had different heights (ragged bottoms) | Every section page and home (e.g. 326 vs 464 px) | Grid rows stretch | Equal |
| 3 | KPI notes/values not aligned across a row when a label wrapped or a value was compact | Home, Намаз, Ораза; worst on phones (values 18 px apart) | CSS subgrid: label / value / note rows shared; values on one baseline | ≤ 1 px |
| 4 | White ✓ on green cells 2.3:1, «–» on grey 2.6:1 (below 3:1) | All grids, Ораза calendar, legends | Green #16a34a, grey #64748b | 3.3:1, 4.8:1 |
| 5 | «Құран бетіне өту» link 20 px tall, purple text 4.2:1 | Home | 44 px secondary button like «Толық айды көру» | 44 px |
| 6 | Today's Friday counted before Бесін marked (jumu'ah 3 / 4) | Home | Count today only once marked | 3 / 3 |
| 7 | Two values in one tile were clipped («5.26% / 0.0…») | Home | Compact 22 px value | Not clipped |

Accepted / not changed:
- Spacing values 6, 10, 14 px are not on a strict 4 px grid; they come from canvas v2 and are used consistently per role.
- 16–20 font sizes in use per page; most come from canvas (11 legend, 12 labels, 13 notes, 30 KPI). Consolidating is a design-system task for later.
- Panel titles wrap to two lines on 390 px (header 73 px instead of 49 px); padding stays equal.
- Data-grid cells are 24–30 px wide on phones (below 44 px); they are a dense data view and the «+» dialog offers 40–44 px targets for the same actions.

## Results — 2026-11-27 (phase B, month page)

Audit at 1440 / 768 / 390 with real data: no edge, column, cell-size, tile, truncation or touch-target issues; table scrolls inside its panel on phones.

| # | Found | Fix | After |
| --- | --- | --- | --- |
| 1 | Month popover on phones anchored to the picker, started at x = −57 (off-screen) | Centred on screen at ≤ 720 px | x 25–365 on a 390 px screen |
| 2 | Switching month dropped the «Талдау» view | Picker and ‹ › links carry `analysis=1` | 12 / 12 links keep it |

## Results — 2026-11-27 (phase C, reports)

Audit at 1440 / 768 / 390: no edge, row-height, alignment or contrast issues.

| # | Found | Fix | After |
| --- | --- | --- | --- |
| 1 | «шаблон (.xlsx)» link inside the steps 19 px tall | 44 px secondary button «Шаблонды жүктеу (.xlsx)» | 44 px |
| 2 | Month links in the year-summary table 19 px tall | Link fills its cell | 44 px row target |

## Fix — 2026-11-27 (user report: Ораза calendar scattered, « · » separators)

| Found | Fix | After |
| --- | --- | --- |
| Year calendar looked scattered: empty days pale with a thin border vs solid marked days, rows 24 / 29 px, missing days (Feb 30) and future days left holes, table narrower than the panel | CSS grid; every slot a 26 px square in every state (outline drawn inside), reserved invisible slots for missing days, hatched slots for future days, columns stretch | All 403 slots 25.5 × 26, 0 columns off-centre, rows equal, grid = panel width |
| « · » between words | « — » everywhere (88 places) | 0 left |
