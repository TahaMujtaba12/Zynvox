import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_SYSTEM_BUBBLE_HTML } from '../src/demo/chatData.js';
import { initDemo, observeSections, prerenderFirstBubble } from '../src/demo/init.js';

function fakeObserver() {
  const instances = [];
  const Impl = class {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observed = [];
      instances.push(this);
    }

    observe(el) {
      this.observed.push(el);
    }
  };
  return { Impl, instances };
}

describe('prerenderFirstBubble', () => {
  it('seeds the first system bubble so the phone frame is never blank', () => {
    document.body.innerHTML = '<div id="chatStream"></div>';

    expect(prerenderFirstBubble(document)).toBe(true);

    const bubble = document.querySelector('#chatStream .bubble.system');
    expect(bubble.innerHTML).toBe(INITIAL_SYSTEM_BUBBLE_HTML);
    expect(bubble.querySelector('.bubble-tag').textContent).toContain('AUTO-INTERCEPT');
  });

  it('does not duplicate an existing bubble', () => {
    document.body.innerHTML = '<div id="chatStream"><div class="bubble system">existing</div></div>';

    expect(prerenderFirstBubble(document)).toBe(false);
    expect(document.querySelectorAll('#chatStream .bubble')).toHaveLength(1);
  });

  it('is a no-op without a chat stream', () => {
    document.body.innerHTML = '';

    expect(prerenderFirstBubble(document)).toBe(false);
  });
});

describe('observeSections', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section class="part-section" id="a"></section>
      <section class="part-section" id="b"></section>
      <section id="c"></section>
    `;
  });

  it('observes every part section with a 10% threshold', () => {
    const { Impl, instances } = fakeObserver();

    observeSections(document, Impl);

    expect(instances).toHaveLength(1);
    expect(instances[0].options).toEqual({ threshold: 0.1 });
    expect(instances[0].observed.map((el) => el.id)).toEqual(['a', 'b']);
  });

  it('marks intersecting sections visible and leaves others alone', () => {
    const { Impl, instances } = fakeObserver();
    observeSections(document, Impl);
    const [a, b] = instances[0].observed;

    instances[0].callback([
      { isIntersecting: true, target: a },
      { isIntersecting: false, target: b }
    ]);

    expect(a.classList.contains('visible')).toBe(true);
    expect(b.classList.contains('visible')).toBe(false);
  });

  it('returns null when IntersectionObserver is unavailable', () => {
    expect(observeSections(document, undefined)).toBeNull();
  });
});

describe('initDemo', () => {
  it('marks the body loaded, seeds the bubble, and wires the observer', () => {
    document.body.className = '';
    document.body.innerHTML = '<div id="chatStream"></div><section class="part-section"></section>';
    const { Impl, instances } = fakeObserver();

    const observer = initDemo(document, Impl);

    expect(document.body.classList.contains('loaded')).toBe(true);
    expect(document.querySelectorAll('#chatStream .bubble')).toHaveLength(1);
    expect(observer).toBe(instances[0]);
  });

  it('falls back to the window IntersectionObserver', () => {
    document.body.innerHTML = '<section class="part-section"></section>';
    const observe = vi.fn();
    window.IntersectionObserver = class {
      observe = observe;
    };

    initDemo(document);

    expect(observe).toHaveBeenCalledTimes(1);
    delete window.IntersectionObserver;
  });
});
