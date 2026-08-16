export const NAV_STEP_COUNT = 3;

export function stepClassName(step, activeStep) {
  if (step < activeStep) return 'step-item completed';
  if (step === activeStep) return 'step-item active';
  return 'step-item';
}

export function goToPart(num, doc = document) {
  const target = doc.getElementById(`part${num}`);
  if (target && typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ behavior: 'smooth' });
  }

  for (let i = 1; i <= NAV_STEP_COUNT; i++) {
    const item = doc.getElementById(`nav-s${i}`);
    if (item) item.className = stepClassName(i, num);
  }
}
