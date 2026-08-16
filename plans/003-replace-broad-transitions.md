# Replace broad transitions with property-specific transitions

**Status:** READY
**Severity:** LOW
**Category:** Easing and cohesion
**Baseline commit:** `a226d0f`

## Finding

The page uses broad `transition: all` declarations at `Demo.html:100`, `Demo.html:137`, and `Demo.html:670`, plus multiple interactive transitions that do not state a shared easing. Broad transitions allow unrelated properties such as layout, color, borders, and dimensions to animate together when a state changes, which makes the dispatch-board interface feel less intentional and can animate expensive properties accidentally.

## Target behavior

Each interactive element animates only the properties that visibly change, using the same 180ms ease-out timing for frequent controls and the existing slower timing only where the page deliberately changes layout.

## Implementation

1. In `/home/ubuntu/repos/Zynvox/Demo.html`, replace each `transition: all 0.3s ease` with the exact property list appropriate to the selector:
   - The `.btn-analysis-call` rule near line 100: `transition: background-color 180ms ease-out, border-color 180ms ease-out, color 180ms ease-out;`
   - The `.step-item` rule near line 137: `transition: background-color 180ms ease-out, border-color 180ms ease-out, color 180ms ease-out;`
   - The `.borderless-col` rule near line 670: `transition: background-color 180ms ease-out, border-color 180ms ease-out;`
2. Replace `transition: all 0.3s ease` anywhere else found by `rg -n "transition:\s*all" /home/ubuntu/repos/Zynvox/Demo.html`; do not leave broad transitions in the file.
3. Preserve the redesign overrides in the later `<style>` block; if an override needs a transition, use the same property-specific format.
4. Do not add hover transforms to cards or nav items as part of this plan; the redesign’s hard-edged layout should remain stable.

## Verification

- Run `rg -n "transition:\\s*all" /home/ubuntu/repos/Zynvox/Demo.html` and confirm it returns no matches.
- Hover and focus the header CTA, step navigation, and metric columns; confirm only color/background/border changes animate.
- Use DevTools “paint flashing” while resizing the viewport; confirm no layout dimension is animated by hover.
- Confirm the duration is exactly 180ms and the easing is `ease-out` for the three high-frequency controls.
