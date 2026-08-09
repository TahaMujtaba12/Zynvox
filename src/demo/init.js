import { INITIAL_SYSTEM_BUBBLE_HTML } from './chatData.js';

export function prerenderFirstBubble(doc) {
  const chat = doc.getElementById('chatStream');
  if (!chat || chat.children.length > 0) return false;
  const div = doc.createElement('div');
  div.className = 'bubble system';
  div.innerHTML = INITIAL_SYSTEM_BUBBLE_HTML;
  chat.appendChild(div);
  return true;
}

export function observeSections(doc, ObserverImpl) {
  if (typeof ObserverImpl !== 'function') return null;
  const observer = new ObserverImpl((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });

  doc.querySelectorAll('.part-section').forEach((section) => observer.observe(section));
  return observer;
}

export function initDemo(doc = document, ObserverImpl = doc.defaultView?.IntersectionObserver) {
  doc.body.classList.add('loaded');
  prerenderFirstBubble(doc);
  return observeSections(doc, ObserverImpl);
}
