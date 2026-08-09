export const CALCULATOR_INPUT_IDS = ['missedCalls', 'averageTicket', 'competitorCapture'];

function numericValue(doc, id) {
  const el = doc.getElementById(id);
  return Number(el?.value) || 0;
}

export function calculateRevenue({ missedCalls, averageTicket, competitorCapture }) {
  const calls = Math.max(0, missedCalls);
  const ticket = Math.max(0, averageTicket);
  const capture = Math.min(100, Math.max(0, competitorCapture));

  return {
    competitorCapture: capture,
    annualRevenue: calls * ticket * (capture / 100) * 12,
    recoveredJobs: Math.round(calls * (capture / 100))
  };
}

export function formatCurrency(amount) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });
}

export function readCalculatorInputs(doc) {
  return {
    missedCalls: numericValue(doc, 'missedCalls'),
    averageTicket: numericValue(doc, 'averageTicket'),
    competitorCapture: numericValue(doc, 'competitorCapture')
  };
}

export function updateRevenueCalculator(doc = document) {
  const result = calculateRevenue(readCalculatorInputs(doc));

  const captureEl = doc.getElementById('competitorCaptureValue');
  if (captureEl) captureEl.textContent = `${result.competitorCapture}%`;

  const revenueEl = doc.getElementById('revenueResult');
  if (revenueEl) revenueEl.textContent = formatCurrency(result.annualRevenue);

  const jobsEl = doc.getElementById('recoveredJobsResult');
  if (jobsEl) {
    jobsEl.textContent = `${result.recoveredJobs.toLocaleString('en-US')} recovered jobs / month`;
  }

  return result;
}

export function initRevenueCalculator(doc = document) {
  CALCULATOR_INPUT_IDS.forEach((id) => {
    doc.getElementById(id)?.addEventListener('input', () => updateRevenueCalculator(doc));
  });
  return updateRevenueCalculator(doc);
}
