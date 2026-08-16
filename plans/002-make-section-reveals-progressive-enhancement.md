# Make section reveals progressive enhancement

**Status:** READY
**Severity:** MEDIUM
**Category:** Accessibility and purpose
**Baseline commit:** `a226d0f`

## Finding

`Demo.html:451-457` gives every `.part-section` an initial `opacity: 0` and `transform: translateY(30px)`. The `IntersectionObserver` at `Demo.html:2059-2070` is the only path that adds `.visible`. Users with JavaScript disabled or an observer failure can never read the sections. The same rule also makes ordinary content entry depend on motion timing rather than information hierarchy.

## Target behavior

All section content is readable by default. IntersectionObserver may add a subtle reveal only as an enhancement, with no hidden content state.

## Implementation

1. In `/home/ubuntu/repos/Zynvox/Demo.html`, change the base `.part-section` rule at lines 451-457 to:

```css
.part-section {
  margin-bottom: 90px;
}
```

2. Replace the current `.part-section.visible` rule with an opt-in enhancement class:

```css
html.motion-enhanced .part-section {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 420ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

html.motion-enhanced .part-section.visible {
  opacity: 1;
  transform: translateY(0);
}
```

3. In the `DOMContentLoaded` handler near line 2044, add `document.documentElement.classList.add('motion-enhanced');` only after confirming `window.IntersectionObserver` exists.
4. If `IntersectionObserver` is unavailable, skip the enhanced class and leave sections in their default visible state.
5. In the existing reduced-motion rule, set `.part-section` to `opacity: 1` and `transform: none` so reduced-motion users never wait for an observer transition.

## Verification

- Disable JavaScript and confirm all three sections render visible.
- Run in a browser with `IntersectionObserver` disabled; confirm sections remain visible.
- With normal motion, confirm each section reveals once as it enters the viewport and does not re-run on every scroll.
- Enable `prefers-reduced-motion: reduce`; confirm there is no delayed opacity or vertical movement.
- Confirm the section reveal uses the exact 420ms duration and `cubic-bezier(0.22, 1, 0.36, 1)` easing above.
