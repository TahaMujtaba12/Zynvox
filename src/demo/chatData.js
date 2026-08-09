export const INITIAL_SYSTEM_BUBBLE_HTML =
  '<span class="bubble-tag">ZYNVOX AUTO-INTERCEPT (12S RESPONSE)</span>Hi! We saw we just missed your call. Is your system acting up, or are you looking to schedule routine service?<span class="bubble-status">✓✓ Read</span>';

export const chatMessages = [
  { type: 'customer', text: 'My AC stopped working 🥵 it\'s 88°F inside and I have two kids' },
  { type: 'system', tag: 'ZYNVOX AI RESPONSE (3s)', text: 'That\'s an emergency — we\'re sending someone tonight. Can you confirm your address so we can dispatch the nearest technician?' },
  { type: 'customer', text: '4521 Maple Creek Drive' },
  { type: 'system', tag: 'ZYNVOX AI RESPONSE (2s)', text: 'Got it. Your technician is on the way — ETA 12:15 AM. You\'ll get a text when he\'s 10 minutes out.<br><br>✓ Appointment Created<br>✓ Technician Assigned<br>✓ Confirmation SMS Sent<br>✓ Calendar Updated<br>✓ Owner Notified' },
  { type: 'customer', text: 'Thank you so much!' },
  { type: 'system', tag: 'ZYNVOX AI RESPONSE (1s)', text: 'You\'re all set. Stay cool — help is on the way.<br><br>✓ Technician will call before arrival' }
];

export const statusTimeline = [
  { time: '11:42:08', label: 'Customer Identified' },
  { time: '11:42:10', label: 'Intent Classified' },
  { time: '11:42:12', label: 'Technician Search' },
  { time: '11:42:14', label: 'Calendar Locked' },
  { time: '11:42:17', label: 'SMS Sent' },
  { time: '11:42:19', label: 'CRM Updated' },
  { time: '11:42:22', label: 'Owner Notified' }
];
