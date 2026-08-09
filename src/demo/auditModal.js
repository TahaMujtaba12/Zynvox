export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzenbbn';
export const REQUIRED_FIELDS = ['name', 'owner', 'phone', 'email', 'industry'];
export const VALIDATION_MESSAGE = '⚠ Please fill in all required fields.';
export const SUBMIT_DELAY_MS = 2000;

const ERROR_STYLE =
  'color:#E5BE48; font-size:12px; font-family:"JetBrains Mono",monospace; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.3); border-radius:6px; padding:10px 14px; margin-bottom:12px; text-align:center;';

function value(doc, id) {
  const el = doc.getElementById(id);
  return el ? el.value : '';
}

export function readAuditForm(doc) {
  return {
    name: value(doc, 'modalName').trim(),
    owner: value(doc, 'modalOwner').trim(),
    phone: value(doc, 'modalPhone').trim(),
    email: value(doc, 'modalEmail').trim(),
    website: value(doc, 'modalWebsite').trim(),
    industry: value(doc, 'modalIndustry')
  };
}

export function missingRequiredFields(values) {
  return REQUIRED_FIELDS.filter((field) => !values[field]);
}

export function generateRefId(random = Math.random) {
  return Math.floor(1000 + random() * 9000);
}

export function buildAuditPayload(values, refId) {
  return {
    business_name: values.name,
    owner_name: values.owner,
    phone: values.phone,
    email: values.email,
    website: values.website,
    industry: values.industry,
    reference_id: `ZX-2026-${refId}`
  };
}

export function openModal(doc = document) {
  const modal = doc.getElementById('auditModal');
  if (modal) modal.classList.add('active');
  const form = doc.getElementById('modalForm');
  if (form) form.style.display = 'block';
  const loading = doc.getElementById('modalLoading');
  if (loading) loading.style.display = 'none';
  const success = doc.getElementById('modalSuccess');
  if (success) success.style.display = 'none';
  doc.body.style.overflow = 'hidden';
}

export function closeModal(doc = document) {
  const modal = doc.getElementById('auditModal');
  if (modal) modal.classList.remove('active');
  doc.body.style.overflow = 'auto';
}

function showValidationError(doc) {
  let errMsg = doc.getElementById('modalValidationError');
  if (!errMsg) {
    errMsg = doc.createElement('div');
    errMsg.id = 'modalValidationError';
    errMsg.style.cssText = ERROR_STYLE;
    const form = doc.getElementById('modalForm');
    const btn = form && form.querySelector('button');
    if (form) form.insertBefore(errMsg, btn || null);
  }
  errMsg.textContent = VALIDATION_MESSAGE;
  errMsg.style.display = 'block';
}

export function submitAudit(doc = document, options = {}) {
  const {
    fetchImpl = typeof fetch === 'function' ? fetch : null,
    random = Math.random
  } = options;

  const values = readAuditForm(doc);
  if (missingRequiredFields(values).length > 0) {
    showValidationError(doc);
    return false;
  }

  const existingErr = doc.getElementById('modalValidationError');
  if (existingErr) existingErr.style.display = 'none';

  const form = doc.getElementById('modalForm');
  if (form) form.style.display = 'none';
  const loading = doc.getElementById('modalLoading');
  if (loading) loading.style.display = 'block';

  setTimeout(() => {
    if (loading) loading.style.display = 'none';
    const success = doc.getElementById('modalSuccess');
    if (success) success.style.display = 'block';

    const refId = generateRefId(random);
    const refEl = doc.getElementById('refId');
    if (refEl) refEl.textContent = String(refId);

    if (!fetchImpl) return;
    Promise.resolve(
      fetchImpl(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(buildAuditPayload(values, refId))
      })
    ).catch((err) => console.error('Formspree error:', err));
  }, SUBMIT_DELAY_MS);

  return true;
}
