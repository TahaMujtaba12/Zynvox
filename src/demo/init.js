import { INITIAL_SYSTEM_BUBBLE_HTML } from './chatData.js';
import { reportError } from './errors.js';

export function prerenderFirstBubble(doc) {
  const chat = doc.getElementById('chatStream');
  if (!chat || chat.children.length > 0) return false;
  const div = doc.createElement('div');
  div.className = 'bubble system';
  div.innerHTML = INITIAL_SYSTEM_BUBBLE_HTML;
  chat.appendChild(div);
  return true;
}

// Without the fallback, an unavailable observer would leave every section
// permanently hidden.
export function observeSections(doc, ObserverImpl) {
  const sections = doc.querySelectorAll('.part-section');

  if (typeof ObserverImpl !== 'function') {
    reportError('reveal animations', new Error('IntersectionObserver unavailable; revealing all sections'));
    sections.forEach((section) => section.classList.add('visible'));
    return null;
  }

  const observer = new ObserverImpl((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });

  sections.forEach((section) => observer.observe(section));
  return observer;
}

export function initDemo(doc = document, ObserverImpl = doc.defaultView?.IntersectionObserver) {
  doc.body.classList.add('loaded');
  prerenderFirstBubble(doc);
  return observeSections(doc, ObserverImpl);
}
