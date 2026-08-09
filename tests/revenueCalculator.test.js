import { beforeEach, describe, expect, it } from 'vitest';
import {
  CALCULATOR_INPUT_IDS,
  calculateRevenue,
  formatCurrency,
  initRevenueCalculator,
  readCalculatorInputs,
  updateRevenueCalculator
} from '../src/demo/revenueCalculator.js';

function renderCalculator({ missedCalls = '31', averageTicket = '350', capture = '71' } = {}) {
  document.body.innerHTML = `
    <input id="missedCalls" type="number" value="${missedCalls}" />
    <input id="averageTicket" type="number" value="${averageTicket}" />
    <input id="competitorCapture" type="range" min="0" max="100" value="${capture}" />
    <span id="competitorCaptureValue"></span>
    <div id="revenueResult"></div>
    <strong id="recoveredJobsResult"></strong>
  `;
}

function setInput(id, value) {
  const el = document.getElementById(id);
  el.value = value;
  el.dispatchEvent(new Event('input'));
}

describe('calculateRevenue', () => {
  it('multiplies calls by ticket by capture rate over twelve months', () => {
    expect(calculateRevenue({ missedCalls: 31, averageTicket: 350, competitorCapture: 71 })).toEqual({
      competitorCapture: 71,
      annualRevenue: 92442,
      recoveredJobs: 22
    });
  });

  it('returns zero revenue when any factor is zero', () => {
    expect(calculateRevenue({ missedCalls: 0, averageTicket: 350, competitorCapture: 71 }).annualRevenue).toBe(0);
    expect(calculateRevenue({ missedCalls: 31, averageTicket: 0, competitorCapture: 71 }).annualRevenue).toBe(0);
    expect(calculateRevenue({ missedCalls: 31, averageTicket: 350, competitorCapture: 0 }).annualRevenue).toBe(0);
  });

  it('clamps negative inputs to zero', () => {
    expect(calculateRevenue({ missedCalls: -5, averageTicket: -350, competitorCapture: -20 })).toEqual({
      competitorCapture: 0,
      annualRevenue: 0,
      recoveredJobs: 0
    });
  });

  it('clamps the capture rate to 100%', () => {
    const result = calculateRevenue({ missedCalls: 10, averageTicket: 100, competitorCapture: 250 });

    expect(result.competitorCapture).toBe(100);
    expect(result.annualRevenue).toBe(12000);
    expect(result.recoveredJobs).toBe(10);
  });

  it('rounds recovered jobs to a whole number', () => {
    expect(calculateRevenue({ missedCalls: 5, averageTicket: 100, competitorCapture: 50 }).recoveredJobs).toBe(3);
  });
});

describe('formatCurrency', () => {
  it('renders whole dollars', () => {
    expect(formatCurrency(92442)).toBe('$92,442');
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(1234.56)).toBe('$1,235');
  });
});

describe('readCalculatorInputs', () => {
  it('reads numeric values from the inputs', () => {
    renderCalculator({ missedCalls: '12', averageTicket: '500', capture: '40' });

    expect(readCalculatorInputs(document)).toEqual({
      missedCalls: 12,
      averageTicket: 500,
      competitorCapture: 40
    });
  });

  it('treats blank or non-numeric fields as zero', () => {
    renderCalculator({ missedCalls: '', averageTicket: 'abc', capture: '0' });

    expect(readCalculatorInputs(document)).toEqual({
      missedCalls: 0,
      averageTicket: 0,
      competitorCapture: 0
    });
  });

  it('treats missing inputs as zero', () => {
    document.body.innerHTML = '';

    expect(readCalculatorInputs(document)).toEqual({
      missedCalls: 0,
      averageTicket: 0,
      competitorCapture: 0
    });
  });
});

describe('updateRevenueCalculator', () => {
  beforeEach(() => renderCalculator());

  it('renders the revenue, capture rate, and recovered jobs', () => {
    updateRevenueCalculator(document);

    expect(document.getElementById('revenueResult').textContent).toBe('$92,442');
    expect(document.getElementById('competitorCaptureValue').textContent).toBe('71%');
    expect(document.getElementById('recoveredJobsResult').textContent).toBe('22 recovered jobs / month');
  });

  it('thousands-separates the recovered jobs count', () => {
    renderCalculator({ missedCalls: '4000', averageTicket: '100', capture: '100' });

    updateRevenueCalculator(document);

    expect(document.getElementById('recoveredJobsResult').textContent).toBe('4,000 recovered jobs / month');
  });

  it('does not throw when the output nodes are absent', () => {
    document.body.innerHTML = '<input id="missedCalls" value="10" />';

    expect(() => updateRevenueCalculator(document)).not.toThrow();
  });
});

describe('initRevenueCalculator', () => {
  beforeEach(() => renderCalculator());

  it('renders the initial result on load', () => {
    const result = initRevenueCalculator(document);

    expect(result.annualRevenue).toBe(92442);
    expect(document.getElementById('revenueResult').textContent).toBe('$92,442');
  });

  it('recalculates when any input changes', () => {
    initRevenueCalculator(document);

    setInput('missedCalls', '50');
    expect(document.getElementById('revenueResult').textContent).toBe('$149,100');

    setInput('averageTicket', '1000');
    expect(document.getElementById('revenueResult').textContent).toBe('$426,000');

    setInput('competitorCapture', '50');
    expect(document.getElementById('competitorCaptureValue').textContent).toBe('50%');
    expect(document.getElementById('revenueResult').textContent).toBe('$300,000');
    expect(document.getElementById('recoveredJobsResult').textContent).toBe('25 recovered jobs / month');
  });

  it('binds only the three calculator inputs', () => {
    expect(CALCULATOR_INPUT_IDS).toEqual(['missedCalls', 'averageTicket', 'competitorCapture']);
  });

  it('does not throw on a page without the calculator', () => {
    document.body.innerHTML = '';

    expect(() => initRevenueCalculator(document)).not.toThrow();
  });
});
