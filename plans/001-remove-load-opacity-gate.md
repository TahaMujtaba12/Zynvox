# Remove the load opacity gate

**Status:** READY  
**Severity:** HIGH  
**Category:** Accessibility and failure behavior  
**Baseline commit:** `a226d0f`

## Finding

`Demo.html:31-46` sets `body { opacity: 0; transition: opacity 0.8s ease; }` and only reveals the page in `DOMContentLoaded` at `Demo.html:2044`. The entire marketing page is invisible until JavaScript runs. If script execution is delayed or fails, users receive a blank page; the transition also delays first meaningful content.

## Target behavior

The page must render fully opaque without JavaScript. JavaScript may add a short, non-blocking enhancement after the DOM is ready, but it must never be required for content visibility.

## Implementation

1. In `/home/ubuntu/repos/Zynvox/Demo.html`, remove `opacity: 0` and `transition: opacity 0.8s ease` from the base `body` rule at lines 31-46.
2. Remove the `body.loaded { opacity: 1; }` rule.
3. In the `DOMContentLoaded` handler near line 2044, remove `document.body.classList.add('loaded');`.
4. Do not replace the opacity gate with another page-wide transform, filter, or display toggle.
5. Keep the existing `prefers-reduced-motion` rule, but do not rely on it for page visibility.

## Verification

- Open `file:///home/ubuntu/repos/Zynvox/Demo.html` with JavaScript disabled: header, hero, navigation, and section copy remain visible.
- Reload with the browser cache disabled and confirm no blank flash longer than one frame.
- Use keyboard navigation from the address bar into the page; focus lands on visible controls.
- With DevTools console throttled to “Slow 3G,” confirm the hero is visible before the script finishes.
- Confirm there are no references to `.loaded` or `classList.add('loaded')`.
