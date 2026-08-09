import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FORMSPREE_ENDPOINT,
  REQUIRED_FIELDS,
  SUBMIT_DELAY_MS,
  VALIDATION_MESSAGE,
  buildAuditPayload,
  closeModal,
  generateRefId,
  missingRequiredFields,
  openModal,
  readAuditForm,
  submitAudit
} from '../src/demo/auditModal.js';

const FILLED_FORM = {
  modalName: 'Acme HVAC',
  modalOwner: 'Dana',
  modalPhone: '5125550100',
  modalEmail: 'dana@acme.test',
  modalWebsite: 'acme.test'
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

describe('missingRequiredFields', () => {
  it('reports nothing for a complete submission', () => {
    expect(missingRequiredFields({ name: 'a', owner: 'b', phone: 'c', email: 'd', industry: 'e' })).toEqual([]);
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

  it('blocks submission and shows an inline error when required fields are empty', () => {
    renderModal({ modalName: '', modalOwner: '', modalPhone: '', modalEmail: '', modalWebsite: '' }, '');
    const fetchImpl = vi.fn();

    expect(submitAudit(document, { fetchImpl })).toBe(false);

    const err = document.getElementById('modalValidationError');
    expect(err.textContent).toBe(VALIDATION_MESSAGE);
    expect(err.style.display).toBe('block');
    expect(err.nextElementSibling.tagName).toBe('BUTTON');
    expect(document.getElementById('modalForm').style.display).not.toBe('none');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reuses a single error element across failed attempts', () => {
    renderModal({}, '');

    submitAudit(document, { fetchImpl: vi.fn() });
    submitAudit(document, { fetchImpl: vi.fn() });

    expect(document.querySelectorAll('#modalValidationError')).toHaveLength(1);
  });

  it('hides a previous error once the form is complete', () => {
    renderModal({}, '');
    submitAudit(document, { fetchImpl: vi.fn() });

    fillForm(FILLED_FORM);
    submitAudit(document, { fetchImpl: vi.fn().mockResolvedValue({ ok: true }) });

    expect(document.getElementById('modalValidationError').style.display).toBe('none');
  });

  it('swaps the form for the loading pane immediately', () => {
    renderModal();

    expect(submitAudit(document, { fetchImpl: vi.fn().mockResolvedValue({ ok: true }) })).toBe(true);
    expect(document.getElementById('modalForm').style.display).toBe('none');
    expect(document.getElementById('modalLoading').style.display).toBe('block');
    expect(document.getElementById('modalSuccess').style.display).toBe('none');
  });

  it('shows success with a reference id and posts the lead after the delay', async () => {
    renderModal();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });

    submitAudit(document, { fetchImpl, random: () => 0.5 });
    await vi.advanceTimersByTimeAsync(SUBMIT_DELAY_MS);

    expect(document.getElementById('modalLoading').style.display).toBe('none');
    expect(document.getElementById('modalSuccess').style.display).toBe('block');
    expect(document.getElementById('refId').textContent).toBe('5500');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe(FORMSPREE_ENDPOINT);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toMatchObject({
      business_name: 'Acme HVAC',
      owner_name: 'Dana',
      reference_id: 'ZX-2026-5500'
    });
  });

  it('still shows success when the lead post fails', async () => {
    renderModal();
    const error = new Error('network down');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    submitAudit(document, { fetchImpl: vi.fn().mockRejectedValue(error) });
    await vi.advanceTimersByTimeAsync(SUBMIT_DELAY_MS);

    expect(document.getElementById('modalSuccess').style.display).toBe('block');
    expect(consoleError).toHaveBeenCalledWith('Formspree error:', error);
  });

  it('skips the network call when no fetch implementation exists', async () => {
    renderModal();

    submitAudit(document, { fetchImpl: null });
    await vi.advanceTimersByTimeAsync(SUBMIT_DELAY_MS);

    expect(document.getElementById('modalSuccess').style.display).toBe('block');
  });
});
