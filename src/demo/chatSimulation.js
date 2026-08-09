import { chatMessages, statusTimeline } from './chatData.js';

export function createStatusItem(doc, item) {
  const div = doc.createElement('div');
  div.className = 'status-item';
  div.innerHTML = `<span class="time">${item.time}</span><span class="check">✓</span><span>${item.label}</span>`;
  return div;
}

export function createMessageBubble(doc, msg) {
  const div = doc.createElement('div');
  div.className = `bubble ${msg.type}`;
  if (msg.tag) {
    div.innerHTML = `<span class="bubble-tag">${msg.tag}</span>${msg.text}`;
  } else {
    div.textContent = msg.text;
  }
  if (msg.type === 'system') {
    const status = doc.createElement('span');
    status.className = 'bubble-status';
    status.textContent = '✓✓ Read';
    div.appendChild(status);
  }
  return div;
}

export function createThinkingState(doc) {
  const div = doc.createElement('div');
  div.className = 'thinking-state';
  div.innerHTML = '<span>Processing</span><div class="typing-dots"><span></span><span></span><span></span></div>';
  return div;
}

export function createCompleteBanner(doc) {
  const div = doc.createElement('div');
  div.className = 'thinking-state';
  div.style.cssText = 'border-color:var(--gold); color:var(--gold); margin-top:8px;';
  div.innerHTML = '<span>✓ Intercept Complete — Revenue Protected</span>';
  return div;
}

function scrollToBottom(el) {
  el.scrollTop = el.scrollHeight;
}

export function createChatSimulation(doc = document) {
  let isPlaying = false;

  function start() {
    if (isPlaying) return false;

    const chat = doc.getElementById('chatStream');
    if (!chat) return false;
    isPlaying = true;

    const startBtn = doc.getElementById('startSimulation');
    if (startBtn) startBtn.style.display = 'none';

    const statusContainer = doc.getElementById('liveStatusContainer');
    if (statusContainer) statusContainer.innerHTML = '';

    let msgIndex = 0;
    let statusIndex = 0;

    function addLiveStatus() {
      if (statusIndex >= statusTimeline.length) return;
      const div = createStatusItem(doc, statusTimeline[statusIndex]);
      if (statusContainer) statusContainer.appendChild(div);
      statusIndex++;
      setTimeout(() => { div.classList.add('visible'); }, 50);
    }

    function nextMessage() {
      if (msgIndex >= chatMessages.length) {
        isPlaying = false;
        chat.appendChild(createCompleteBanner(doc));
        scrollToBottom(chat);
        return;
      }

      const msg = chatMessages[msgIndex];
      if (msg.type === 'system' && statusIndex < statusTimeline.length) {
        addLiveStatus();
      }

      const thinking = createThinkingState(doc);
      chat.appendChild(thinking);
      scrollToBottom(chat);

      setTimeout(() => {
        thinking.remove();
        chat.appendChild(createMessageBubble(doc, msg));
        scrollToBottom(chat);
        msgIndex++;
        setTimeout(nextMessage, 900);
      }, 1000);
    }

    setTimeout(nextMessage, 400);
    return true;
  }

  return { start, isPlaying: () => isPlaying };
}
