import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NAV_STEP_COUNT, goToPart, stepClassName } from '../src/demo/navigation.js';

describe('stepClassName', () => {
  it('marks steps before the active one as completed', () => {
    expect(stepClassName(1, 3)).toBe('step-item completed');
  });

  it('marks the active step as active', () => {
    expect(stepClassName(2, 2)).toBe('step-item active');
  });

  it('leaves later steps unstyled', () => {
    expect(stepClassName(3, 1)).toBe('step-item');
  });
});

describe('goToPart', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <a id="nav-s1" class="step-item active"></a>
      <a id="nav-s2" class="step-item"></a>
      <a id="nav-s3" class="step-item"></a>
      <section id="part2"></section>
    `;
  });

  it('scrolls the target section into view smoothly', () => {
    const target = document.getElementById('part2');
    target.scrollIntoView = vi.fn();

    goToPart(2, document);

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('updates every nav step class relative to the target', () => {
    goToPart(2, document);

    expect(document.getElementById('nav-s1').className).toBe('step-item completed');
    expect(document.getElementById('nav-s2').className).toBe('step-item active');
    expect(document.getElementById('nav-s3').className).toBe('step-item');
  });

  it('does not throw when the target section is missing', () => {
    document.body.innerHTML = '<a id="nav-s1" class="step-item"></a>';

    expect(() => goToPart(1, document)).not.toThrow();
    expect(document.getElementById('nav-s1').className).toBe('step-item active');
  });

  it('exposes the number of nav steps rendered in the demo', () => {
    expect(NAV_STEP_COUNT).toBe(3);
  });
});
