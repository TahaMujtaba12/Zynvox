export function reportError(context, error) {
  console.error(`[Zynvox] ${context}:`, error);
}

export function installGlobalErrorHandlers(target = window) {
  target.addEventListener('error', (event) => {
    reportError('uncaught error', event.error || event.message);
  });

  target.addEventListener('unhandledrejection', (event) => {
    reportError('unhandled promise rejection', event.reason);
  });
}
