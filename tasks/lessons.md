# Lessons

- UI from a design system: if the user has a specific visual reference in mind (screenshot), ask for it or show a quick preview before full build. Login v1 used canvas v2 sections; user wanted a centered single-card layout instead.
- UI audit must compare **visual states**, not only geometry: marked vs unmarked cells measured the same size, yet looked scattered (solid fill vs faint outline, missing days left holes, rows 24 vs 29 px). Check: every state renders the same box (inset outlines, reserved slots for non-existent/future days), equal row heights, grid fills its container. Look at a screenshot of each state side by side.
- Separators: the user dislikes « · » between words; use « — » (тире). Don't reintroduce middle dots.
- Fonts: verify glyph coverage for the product's language before relying on a face. Manrope (from the canvas) has no Ә Ғ Қ Ң Ұ, so Kazakh text silently mixed in a system font. Check with fontTools on the built woff2 files; Onest covers the full Kazakh alphabet.
