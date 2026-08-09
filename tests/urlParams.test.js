import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_CUSTOMER,
  applyPersonalization,
  applyURLParams,
  parsePersonalization,
  selectIndustryOption
} from '../src/demo/urlParams.js';

describe('parsePersonalization', () => {
  it('reads every supported query parameter', () => {
    expect(parsePersonalization('?biz=Acme+HVAC&city=Austin&owner=Dana&industry=HVAC&customer=Joe')).toEqual({
      biz: 'Acme HVAC',
      city: 'Austin',
      owner: 'Dana',
      industry: 'HVAC',
      customer: 'Joe'
    });
  });

  it('falls back to the default customer name', () => {
    expect(parsePersonalization('').customer).toBe(DEFAULT_CUSTOMER);
    expect(parsePersonalization('?customer=').customer).toBe(DEFAULT_CUSTOMER);
  });

  it('returns null for absent parameters', () => {
    expect(parsePersonalization('?city=Austin').biz).toBeNull();
  });
});

describe('selectIndustryOption', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="modalIndustry">
        <option value="">Choose</option>
        <option value="HVAC">HVAC</option>
        <option value="Plumbing">Plumbing</option>
      </select>
    `;
  });

  it('selects a matching option case-insensitively', () => {
    const select = document.getElementById('modalIndustry');

    expect(selectIndustryOption(select, 'plumbing')).toBe(true);
    expect(select.value).toBe('Plumbing');
  });

  it('leaves the selection untouched when nothing matches', () => {
    const select = document.getElementById('modalIndustry');

    expect(selectIndustryOption(select, 'Roofing')).toBe(false);
    expect(select.value).toBe('');
  });

  it('handles a missing select or missing industry', () => {
    expect(selectIndustryOption(null, 'HVAC')).toBe(false);
    expect(selectIndustryOption(document.getElementById('modalIndustry'), null)).toBe(false);
  });
});

describe('applyPersonalization', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <span id="notifCustomer"></span>
      <span id="notifArea">Your Area</span>
      <span id="chatHeaderName">Zynvox</span>
      <input id="modalName" value="" />
      <input id="modalOwner" value="" />
      <select id="modalIndustry">
        <option value="">Choose</option>
        <option value="HVAC">HVAC</option>
      </select>
    `;
  });

  it('personalizes the whole page when a business is provided', () => {
    applyPersonalization(
      { biz: 'Acme HVAC', city: 'Austin', owner: 'Dana', industry: 'hvac', customer: 'Joe' },
      document
    );

    expect(document.getElementById('notifCustomer').textContent).toBe('Joe');
    expect(document.getElementById('chatHeaderName').textContent).toBe('Acme HVAC');
    expect(document.getElementById('notifArea').textContent).toBe('Austin');
    expect(document.getElementById('modalName').value).toBe('Acme HVAC');
    expect(document.getElementById('modalOwner').value).toBe('Dana');
    expect(document.getElementById('modalIndustry').value).toBe('HVAC');
  });

  it('only sets the customer name when no business is provided', () => {
    applyPersonalization({ biz: null, city: 'Austin', owner: 'Dana', industry: 'HVAC', customer: 'Joe' }, document);

    expect(document.getElementById('notifCustomer').textContent).toBe('Joe');
    expect(document.getElementById('chatHeaderName').textContent).toBe('Zynvox');
    expect(document.getElementById('notifArea').textContent).toBe('Your Area');
    expect(document.getElementById('modalName').value).toBe('');
  });

  it('skips optional fields that were not supplied', () => {
    applyPersonalization({ biz: 'Acme HVAC', customer: DEFAULT_CUSTOMER }, document);

    expect(document.getElementById('notifArea').textContent).toBe('Your Area');
    expect(document.getElementById('modalOwner').value).toBe('');
  });

  it('tolerates a page missing every personalization target', () => {
    document.body.innerHTML = '';

    expect(() => applyPersonalization({ biz: 'Acme', customer: 'Joe' }, document)).not.toThrow();
  });
});

describe('applyURLParams', () => {
  it('parses the search string and applies it', () => {
    document.body.innerHTML = '<span id="chatHeaderName"></span><span id="notifCustomer"></span>';

    applyURLParams(document, '?biz=Acme&customer=Joe');

    expect(document.getElementById('chatHeaderName').textContent).toBe('Acme');
    expect(document.getElementById('notifCustomer').textContent).toBe('Joe');
  });

  it('defaults to the document location when no search is given', () => {
    document.body.innerHTML = '<span id="notifCustomer"></span>';

    applyURLParams(document);

    expect(document.getElementById('notifCustomer').textContent).toBe(DEFAULT_CUSTOMER);
  });
});
