import { reportError } from './errors.js';

export const AUDIT_ENDPOINT = 'https://formspree.io/f/xvzenbbn';
export const AUDIT_TIMEOUT_MS = 15000;
export const AUDIT_MIN_LOADING_MS = 2000;
export const REQUIRED_FIELDS = ['name', 'owner', 'phone', 'email', 'industry'];
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MESSAGES = {
  missingFields: '⚠ Please fill in all required fields.',
  invalidEmail: '⚠ Please enter a valid business email address.',
  timeout: '⚠ The request timed out before we could save your details. Please try again, or email taha@zynvox.tech.',
  failed: '⚠ We could not submit your request. Please try again, or email taha@zynvox.tech.'
};

const MESSAGE_STYLE =
  'color:#E5BE48; font-size:12px; font-family:"JetBrains Mono",monospace; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.3); border-radius:6px; padding:10px 14px; margin-bottom:12px; text-align:center; line-height:1.6;';

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

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(email);
}

export function validateAuditForm(values) {
  if (missingRequiredFields(values).length > 0) return MESSAGES.missingFields;
  if (!isValidEmail(values.email)) return MESSAGES.invalidEmail;
  return null;
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

export function showModalMessage(doc, text) {
  let errMsg = doc.getElementById('modalValidationError');
  if (!errMsg) {
    errMsg = doc.createElement('div');
    errMsg.id = 'modalValidationError';
    errMsg.style.cssText = MESSAGE_STYLE;
    const form = doc.getElementById('modalForm');
    const btn = form && form.querySelector('button');
    if (form) form.insertBefore(errMsg, btn || null);
  }
  errMsg.textContent = text;
  errMsg.style.display = 'block';
  return errMsg;
}

export function hideModalMessage(doc) {
  const existingErr = doc.getElementById('modalValidationError');
  if (existingErr) existingErr.style.display = 'none';
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
  hideModalMessage(doc);
}

export function closeModal(doc = document) {
  const modal = doc.getElementById('auditModal');
  if (modal) modal.classList.remove('active');
  doc.body.style.overflow = 'auto';
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function describeFailure(response) {
  let detail = '';
  try {
    const body = await response.json();
    detail = body.error || (Array.isArray(body.errors) ? body.errors.map((e) => e.message).join(', ') : '');
  } catch (parseError) {
    reportError('parsing audit endpoint error body', parseError);
  }
  return `Audit endpoint responded ${response.status}${detail ? `: ${detail}` : ''}`;
}

export async function postAudit(payload, { fetchImpl = fetch, timeoutMs = AUDIT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(AUDIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(await describeFailure(response));
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function submitAudit(doc = document, options = {}) {
  const {
    fetchImpl = (...args) => fetch(...args),
    random = Math.random,
    timeoutMs = AUDIT_TIMEOUT_MS,
    minLoadingMs = AUDIT_MIN_LOADING_MS
  } = options;

  const values = readAuditForm(doc);
  const validationMessage = validateAuditForm(values);
  if (validationMessage) {
    showModalMessage(doc, validationMessage);
    return false;
  }

  hideModalMessage(doc);

  const form = doc.getElementById('modalForm');
  const loading = doc.getElementById('modalLoading');
  if (form) form.style.display = 'none';
  if (loading) loading.style.display = 'block';

  const refId = generateRefId(random);

  try {
    await Promise.all([
      postAudit(buildAuditPayload(values, refId), { fetchImpl, timeoutMs }),
      delay(minLoadingMs)
    ]);
  } catch (error) {
    reportError('audit form submission', error);
    if (loading) loading.style.display = 'none';
    if (form) form.style.display = 'block';
    showModalMessage(doc, error.name === 'AbortError' ? MESSAGES.timeout : MESSAGES.failed);
    return false;
  }

  if (loading) loading.style.display = 'none';
  const refEl = doc.getElementById('refId');
  if (refEl) refEl.textContent = String(refId);
  const success = doc.getElementById('modalSuccess');
  if (success) success.style.display = 'block';
  return true;
}
