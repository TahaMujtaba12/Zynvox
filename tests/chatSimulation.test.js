import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chatMessages, statusTimeline } from '../src/demo/chatData.js';
import {
  createChatSimulation,
  createCompleteBanner,
  createMessageBubble,
  createStatusItem,
  createThinkingState
} from '../src/demo/chatSimulation.js';

describe('bubble builders', () => {
  it('renders a customer bubble as plain text', () => {
    const div = createMessageBubble(document, { type: 'customer', text: '<b>hi</b>' });

    expect(div.className).toBe('bubble customer');
    expect(div.textContent).toBe('<b>hi</b>');
    expect(div.querySelector('.bubble-status')).toBeNull();
  });

  it('renders a system bubble with its tag and read receipt', () => {
    const div = createMessageBubble(document, { type: 'system', tag: 'AI (3s)', text: 'a<br>b' });

    expect(div.className).toBe('bubble system');
    expect(div.querySelector('.bubble-tag').textContent).toBe('AI (3s)');
    expect(div.querySelector('br')).not.toBeNull();
    expect(div.querySelector('.bubble-status').textContent).toBe('✓✓ Read');
  });

  it('renders a status timeline item', () => {
    const div = createStatusItem(document, { time: '11:42:08', label: 'Customer Identified' });

    expect(div.className).toBe('status-item');
    expect(div.querySelector('.time').textContent).toBe('11:42:08');
    expect(div.textContent).toContain('Customer Identified');
  });

  it('renders the thinking indicator with three dots', () => {
    const div = createThinkingState(document);

    expect(div.className).toBe('thinking-state');
    expect(div.querySelectorAll('.typing-dots span')).toHaveLength(3);
  });

  it('renders the completion banner', () => {
    const div = createCompleteBanner(document);

    expect(div.textContent).toContain('Intercept Complete');
    expect(div.style.color).toBe('var(--gold)');
  });
});

describe('createChatSimulation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div id="chatStream"></div>
      <div id="liveStatusContainer"><div class="stale"></div></div>
      <button id="startSimulation"></button>
    `;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function runToCompletion() {
    // 400ms lead-in, then per message: 1000ms thinking + 900ms gap.
    vi.advanceTimersByTime(400 + chatMessages.length * 1900 + 100);
  }

  it('hides the start button and clears stale status items', () => {
    const sim = createChatSimulation(document);

    expect(sim.start()).toBe(true);
    expect(document.getElementById('startSimulation').style.display).toBe('none');
    expect(document.getElementById('liveStatusContainer').innerHTML).toBe('');
  });

  it('ignores a second start while already playing', () => {
    const sim = createChatSimulation(document);
    sim.start();

    expect(sim.isPlaying()).toBe(true);
    expect(sim.start()).toBe(false);
  });

  it('reports and stays idle when the chat stream is missing', () => {
    document.body.innerHTML = '';
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const sim = createChatSimulation(document);

    expect(sim.start()).toBe(false);
    expect(sim.isPlaying()).toBe(false);
    expect(consoleError.mock.calls[0][0]).toBe('[Zynvox] chat simulation:');
    consoleError.mockRestore();
  });

  it('shows a thinking indicator before each message and replaces it', () => {
    const chat = document.getElementById('chatStream');
    createChatSimulation(document).start();

    vi.advanceTimersByTime(400);
    expect(chat.querySelectorAll('.thinking-state')).toHaveLength(1);
    expect(chat.querySelectorAll('.bubble')).toHaveLength(0);

    vi.advanceTimersByTime(1000);
    expect(chat.querySelectorAll('.thinking-state')).toHaveLength(0);
    expect(chat.querySelectorAll('.bubble')).toHaveLength(1);
    expect(chat.querySelector('.bubble').textContent).toContain('My AC stopped working');
  });

  it('reveals a status item for each system reply', () => {
    const statusContainer = document.getElementById('liveStatusContainer');
    createChatSimulation(document).start();

    vi.advanceTimersByTime(400 + 1900 + 50);
    const items = statusContainer.querySelectorAll('.status-item');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain(statusTimeline[0].label);
    expect(items[0].classList.contains('visible')).toBe(true);
  });

  it('plays every message in order then finishes with the completion banner', () => {
    const chat = document.getElementById('chatStream');
    const sim = createChatSimulation(document);
    sim.start();

    runToCompletion();

    const bubbles = [...chat.querySelectorAll('.bubble')];
    expect(bubbles).toHaveLength(chatMessages.length);
    expect(bubbles.map((b) => b.className)).toEqual(chatMessages.map((m) => `bubble ${m.type}`));
    expect(chat.lastElementChild.textContent).toContain('Intercept Complete');
    expect(sim.isPlaying()).toBe(false);
  });

  it('can be replayed after finishing', () => {
    const sim = createChatSimulation(document);
    sim.start();
    runToCompletion();

    expect(sim.start()).toBe(true);
  });

  it('never emits more status items than the timeline defines', () => {
    createChatSimulation(document).start();
    runToCompletion();

    const emitted = document.getElementById('liveStatusContainer').querySelectorAll('.status-item').length;
    expect(emitted).toBeLessThanOrEqual(statusTimeline.length);
    expect(emitted).toBe(chatMessages.filter((m) => m.type === 'system').length);
  });

  it('scrolls the chat stream to the bottom as it appends', () => {
    const chat = document.getElementById('chatStream');
    Object.defineProperty(chat, 'scrollHeight', { value: 1234, configurable: true });

    createChatSimulation(document).start();
    vi.advanceTimersByTime(400);

    expect(chat.scrollTop).toBe(1234);
  });

  it('runs without a live status container', () => {
    document.body.innerHTML = '<div id="chatStream"></div>';
    const sim = createChatSimulation(document);

    expect(sim.start()).toBe(true);
    expect(() => runToCompletion()).not.toThrow();
    expect(document.querySelectorAll('#chatStream .bubble')).toHaveLength(chatMessages.length);
    expect(document.querySelectorAll('.status-item')).toHaveLength(0);
  });
});
