import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUDIT_ENDPOINT,
  AUDIT_MIN_LOADING_MS,
  AUDIT_TIMEOUT_MS,
  MESSAGES,
  REQUIRED_FIELDS,
  buildAuditPayload,
  closeModal,
  describeFailure,
  generateRefId,
  isValidEmail,
  missingRequiredFields,
  openModal,
  postAudit,
  readAuditForm,
  submitAudit,
  validateAuditForm
} from '../src/demo/auditModal.js';

const FILLED_FORM = {
  modalName: 'Acme HVAC',
  modalOwner: 'Dana',
  modalPhone: '5125550100',
  modalEmail: 'dana@acme.test',
  modalWebsite: 'acme.test'
};

const EMPTY_FORM = {
  modalName: '',
  modalOwner: '',
  modalPhone: '',
  modalEmail: '',
  modalWebsite: ''
};

const VALID_VALUES = {
  name: 'Acme',
  owner: 'Dana',
  phone: '1',
  email: 'dana@acme.test',
  website: '',
  industry: 'HVAC'
};

function renderModal(values = FILLED_FORM, industry = 'HVAC') {
  document.body.innerHTML = `
    <div id="auditModal" class="modal">
      <div id="modalForm">
        <input id="modalName" value="${values.modalName ?? ''}" />
        <input id="modalOwner" value="${values.modalOwner ?? ''}" />
        <input id="modalPhone" value="${values.modalPhone ?? ''}" />
        <input id="modalEmail" value="${values.modalEmail ?? ''}" />
        <input id="modalWebsite" value="${values.modalWebsite ?? ''}" />
        <select id="modalIndustry">
          <option value="">Choose</option>
          <option value="HVAC" ${industry === 'HVAC' ? 'selected' : ''}>HVAC</option>
        </select>
        <button>Book My 20-Minute Call</button>
      </div>
      <div id="modalLoading" style="display:none"></div>
      <div id="modalSuccess" style="display:none"><span id="refId"></span></div>
    </div>
  `;
}

function okResponse() {
  return { ok: true, status: 200 };
}

describe('readAuditForm', () => {
  it('trims text inputs and reads the industry select', () => {
    renderModal({ ...FILLED_FORM, modalName: '  Acme HVAC  ' });

    expect(readAuditForm(document)).toEqual({
      name: 'Acme HVAC',
      owner: 'Dana',
      phone: '5125550100',
      email: 'dana@acme.test',
      website: 'acme.test',
      industry: 'HVAC'
    });
  });

  it('returns empty strings when the fields are absent', () => {
    document.body.innerHTML = '';

    expect(readAuditForm(document)).toEqual({
      name: '',
      owner: '',
      phone: '',
      email: '',
      website: '',
      industry: ''
    });
  });
});

describe('validation', () => {
  it('reports nothing missing for a complete submission', () => {
    expect(missingRequiredFields(VALID_VALUES)).toEqual([]);
  });

  it('lists each empty required field', () => {
    expect(missingRequiredFields({ name: 'a', owner: '', phone: 'c', email: '', industry: '' })).toEqual([
      'owner',
      'email',
      'industry'
    ]);
  });

  it('treats website as optional', () => {
    expect(REQUIRED_FIELDS).not.toContain('website');
  });

  it.each(['dana@acme.test', 'a.b+c@sub.domain.co'])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(['dana', 'dana@acme', 'dana@acme.c', 'da na@acme.test', 'dana@@acme.test', ''])(
    'rejects %s',
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    }
  );

  it('prefers the missing-field message over the email message', () => {
    expect(validateAuditForm({ ...VALID_VALUES, owner: '', email: 'nope' })).toBe(MESSAGES.missingFields);
  });

  it('flags an invalid email once every field is filled', () => {
    expect(validateAuditForm({ ...VALID_VALUES, email: 'nope' })).toBe(MESSAGES.invalidEmail);
  });

  it('passes a valid submission', () => {
    expect(validateAuditForm(VALID_VALUES)).toBeNull();
  });
});

describe('generateRefId', () => {
  it('stays within the four digit range', () => {
    expect(generateRefId(() => 0)).toBe(1000);
    expect(generateRefId(() => 0.9999)).toBe(9999);
    expect(generateRefId(() => 0.5)).toBe(5500);
  });
});

describe('buildAuditPayload', () => {
  it('maps form values to the Formspree field names', () => {
    const payload = buildAuditPayload(
      { name: 'Acme', owner: 'Dana', phone: '1', email: 'e', website: 'w', industry: 'HVAC' },
      4242
    );

    expect(payload).toEqual({
      business_name: 'Acme',
      owner_name: 'Dana',
      phone: '1',
      email: 'e',
      website: 'w',
      industry: 'HVAC',
      reference_id: 'ZX-2026-4242'
    });
  });
});

describe('openModal / closeModal', () => {
  beforeEach(() => renderModal());

  it('activates the modal and resets its panes', () => {
    document.getElementById('modalSuccess').style.display = 'block';

    openModal(document);

    expect(document.getElementById('auditModal').classList.contains('active')).toBe(true);
    expect(document.getElementById('modalForm').style.display).toBe('block');
    expect(document.getElementById('modalLoading').style.display).toBe('none');
    expect(document.getElementById('modalSuccess').style.display).toBe('none');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('clears a stale error message when reopened', async () => {
    renderModal(EMPTY_FORM, '');
    await submitAudit(document, { fetchImpl: vi.fn() });
    expect(document.getElementById('modalValidationError').style.display).toBe('block');

    openModal(document);

    expect(document.getElementById('modalValidationError').style.display).toBe('none');
  });

  it('deactivates the modal and restores scrolling', () => {
    openModal(document);
    closeModal(document);

    expect(document.getElementById('auditModal').classList.contains('active')).toBe(false);
    expect(document.body.style.overflow).toBe('auto');
  });

  it('does not throw when the modal markup is absent', () => {
    document.body.innerHTML = '';

    expect(() => openModal(document)).not.toThrow();
    expect(() => closeModal(document)).not.toThrow();
  });
});

describe('describeFailure', () => {
  it('includes a single error string from the body', async () => {
    const response = { status: 422, json: async () => ({ error: 'Form disabled' }) };

    expect(await describeFailure(response)).toBe('Audit endpoint responded 422: Form disabled');
  });

  it('joins a list of field errors', async () => {
    const response = {
      status: 400,
      json: async () => ({ errors: [{ message: 'email invalid' }, { message: 'phone invalid' }] })
    };

    expect(await describeFailure(response)).toBe('Audit endpoint responded 400: email invalid, phone invalid');
  });

  it('falls back to the bare status when the body is unreadable', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = {
      status: 502,
      json: async () => {
        throw new Error('not json');
      }
    };

    expect(await describeFailure(response)).toBe('Audit endpoint responded 502');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('postAudit', () => {
  it('posts JSON to the audit endpoint with an abort signal', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse());

    await postAudit({ business_name: 'Acme' }, { fetchImpl });

    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe(AUDIT_ENDPOINT);
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json', Accept: 'application/json' });
    expect(JSON.parse(options.body)).toEqual({ business_name: 'Acme' });
    expect(options.signal.aborted).toBe(false);
  });

  it('throws a described error on a non-ok response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Too many requests' })
    });

    await expect(postAudit({}, { fetchImpl })).rejects.toThrow('Audit endpoint responded 429: Too many requests');
  });

  it('aborts the request once the timeout elapses', async () => {
    vi.useFakeTimers();
    let capturedSignal;
    const fetchImpl = vi.fn((_url, options) => {
      capturedSignal = options.signal;
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    const pending = postAudit({}, { fetchImpl, timeoutMs: 100 });
    const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(100);
    await assertion;

    expect(capturedSignal.aborted).toBe(true);
    vi.useRealTimers();
  });
});

describe('submitAudit', () => {
  function fillForm(values) {
    for (const [id, value] of Object.entries(values)) {
      document.getElementById(id).value = value;
    }
    document.getElementById('modalIndustry').value = 'HVAC';
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('blocks submission and shows an inline error when required fields are empty', async () => {
    renderModal(EMPTY_FORM, '');
    const fetchImpl = vi.fn();

    await expect(submitAudit(document, { fetchImpl })).resolves.toBe(false);

    const err = document.getElementById('modalValidationError');
    expect(err.textContent).toBe(MESSAGES.missingFields);
    expect(err.style.display).toBe('block');
    expect(err.nextElementSibling.tagName).toBe('BUTTON');
    expect(document.getElementById('modalForm').style.display).not.toBe('none');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('blocks submission on a malformed email', async () => {
    renderModal({ ...FILLED_FORM, modalEmail: 'dana@acme' });
    const fetchImpl = vi.fn();

    await expect(submitAudit(document, { fetchImpl })).resolves.toBe(false);

    expect(document.getElementById('modalValidationError').textContent).toBe(MESSAGES.invalidEmail);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reuses a single error element across failed attempts', async () => {
    renderModal(EMPTY_FORM, '');

    await submitAudit(document, { fetchImpl: vi.fn() });
    await submitAudit(document, { fetchImpl: vi.fn() });

    expect(document.querySelectorAll('#modalValidationError')).toHaveLength(1);
  });

  it('hides a previous error once the form is complete', async () => {
    renderModal(EMPTY_FORM, '');
    await submitAudit(document, { fetchImpl: vi.fn() });

    fillForm(FILLED_FORM);
    const pending = submitAudit(document, { fetchImpl: vi.fn().mockResolvedValue(okResponse()) });

    expect(document.getElementById('modalValidationError').style.display).toBe('none');
    await vi.advanceTimersByTimeAsync(AUDIT_MIN_LOADING_MS);
    await pending;
  });

  it('swaps the form for the loading pane immediately', async () => {
    renderModal();

    const pending = submitAudit(document, { fetchImpl: vi.fn().mockResolvedValue(okResponse()) });

    expect(document.getElementById('modalForm').style.display).toBe('none');
    expect(document.getElementById('modalLoading').style.display).toBe('block');
    expect(document.getElementById('modalSuccess').style.display).toBe('none');

    await vi.advanceTimersByTimeAsync(AUDIT_MIN_LOADING_MS);
    await expect(pending).resolves.toBe(true);
  });

  it('holds the loading pane for the minimum duration even on a fast response', async () => {
    renderModal();

    const pending = submitAudit(document, { fetchImpl: vi.fn().mockResolvedValue(okResponse()) });
    await vi.advanceTimersByTimeAsync(AUDIT_MIN_LOADING_MS - 1);

    expect(document.getElementById('modalSuccess').style.display).toBe('none');

    await vi.advanceTimersByTimeAsync(1);
    await pending;

    expect(document.getElementById('modalSuccess').style.display).toBe('block');
  });

  it('shows success with a reference id and posts the lead', async () => {
    renderModal();
    const fetchImpl = vi.fn().mockResolvedValue(okResponse());

    const pending = submitAudit(document, { fetchImpl, random: () => 0.5 });
    await vi.advanceTimersByTimeAsync(AUDIT_MIN_LOADING_MS);
    await expect(pending).resolves.toBe(true);

    expect(document.getElementById('modalLoading').style.display).toBe('none');
    expect(document.getElementById('modalSuccess').style.display).toBe('block');
    expect(document.getElementById('refId').textContent).toBe('5500');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({
      business_name: 'Acme HVAC',
      owner_name: 'Dana',
      reference_id: 'ZX-2026-5500'
    });
  });

  it('restores the form with a retry message when the post fails', async () => {
    renderModal();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'));

    const pending = submitAudit(document, { fetchImpl });
    await vi.advanceTimersByTimeAsync(AUDIT_MIN_LOADING_MS);

    await expect(pending).resolves.toBe(false);
    expect(document.getElementById('modalForm').style.display).toBe('block');
    expect(document.getElementById('modalLoading').style.display).toBe('none');
    expect(document.getElementById('modalSuccess').style.display).toBe('none');
    expect(document.getElementById('modalValidationError').textContent).toBe(MESSAGES.failed);
    expect(consoleError).toHaveBeenCalled();
  });

  it('shows the timeout message when the request is aborted', async () => {
    renderModal();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchImpl = vi.fn((_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      })
    );

    const pending = submitAudit(document, { fetchImpl, timeoutMs: 50 });
    await vi.advanceTimersByTimeAsync(AUDIT_TIMEOUT_MS);

    await expect(pending).resolves.toBe(false);
    expect(document.getElementById('modalValidationError').textContent).toBe(MESSAGES.timeout);
    expect(document.getElementById('modalForm').style.display).toBe('block');
  });
});
