import { createChatSimulation } from './chatSimulation.js';
import { goToPart } from './navigation.js';
import { closeModal, openModal, submitAudit } from './auditModal.js';
import { applyURLParams } from './urlParams.js';
import { initDemo } from './init.js';

const simulation = createChatSimulation(document);

window.startAutoPlay = () => simulation.start();
window.goToPart = (num) => goToPart(num);
window.openModal = () => openModal();
window.closeModal = () => closeModal();
window.submitAudit = () => submitAudit();

const modal = document.getElementById('auditModal');
if (modal) {
  modal.addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });
}

applyURLParams(document, window.location.search);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initDemo(document));
} else {
  initDemo(document);
}
