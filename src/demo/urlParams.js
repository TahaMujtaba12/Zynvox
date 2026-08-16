export const DEFAULT_CUSTOMER = 'Sarah M.';

export function parsePersonalization(search) {
  const params = new URLSearchParams(search);
  return {
    biz: params.get('biz'),
    city: params.get('city'),
    owner: params.get('owner'),
    industry: params.get('industry'),
    customer: params.get('customer') || DEFAULT_CUSTOMER
  };
}

export function selectIndustryOption(select, industry) {
  if (!select || !industry) return false;
  for (const opt of select.options) {
    if (opt.value.toLowerCase() === industry.toLowerCase()) {
      opt.selected = true;
      return true;
    }
  }
  return false;
}

export function applyPersonalization(personalization, doc = document) {
  const { biz, city, owner, industry, customer } = personalization;

  const notifCustomer = doc.getElementById('notifCustomer');
  if (notifCustomer) notifCustomer.textContent = customer;

  if (!biz) return;

  const chatHeaderName = doc.getElementById('chatHeaderName');
  if (chatHeaderName) chatHeaderName.textContent = biz;

  if (city) {
    const notifArea = doc.getElementById('notifArea');
    if (notifArea) notifArea.textContent = city;
  }

  const modalName = doc.getElementById('modalName');
  if (modalName) modalName.value = biz;

  if (owner) {
    const modalOwner = doc.getElementById('modalOwner');
    if (modalOwner) modalOwner.value = owner;
  }

  selectIndustryOption(doc.getElementById('modalIndustry'), industry);
}

export function applyURLParams(doc = document, search = doc.defaultView?.location?.search ?? '') {
  applyPersonalization(parsePersonalization(search), doc);
}
