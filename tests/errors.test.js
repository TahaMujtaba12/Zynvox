import { afterEach, describe, expect, it, vi } from 'vitest';
import { installGlobalErrorHandlers, reportError } from '../src/demo/errors.js';

describe('reportError', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs with the Zynvox prefix and context', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('boom');

    reportError('chat simulation', error);

    expect(consoleError).toHaveBeenCalledWith('[Zynvox] chat simulation:', error);
  });
});

describe('installGlobalErrorHandlers', () => {
  afterEach(() => vi.restoreAllMocks());

  function fakeTarget() {
    const listeners = {};
    return {
      addEventListener: (type, handler) => {
        listeners[type] = handler;
      },
      emit: (type, event) => listeners[type](event),
      types: () => Object.keys(listeners)
    };
  }

  it('subscribes to uncaught errors and rejected promises', () => {
    const target = fakeTarget();

    installGlobalErrorHandlers(target);

    expect(target.types()).toEqual(['error', 'unhandledrejection']);
  });

  it('reports the error object from an error event', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const target = fakeTarget();
    const error = new Error('boom');
    installGlobalErrorHandlers(target);

    target.emit('error', { error, message: 'ignored' });

    expect(consoleError).toHaveBeenCalledWith('[Zynvox] uncaught error:', error);
  });

  it('falls back to the message when no error object is attached', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const target = fakeTarget();
    installGlobalErrorHandlers(target);

    target.emit('error', { error: null, message: 'Script error.' });

    expect(consoleError).toHaveBeenCalledWith('[Zynvox] uncaught error:', 'Script error.');
  });

  it('reports the reason from an unhandled rejection', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const target = fakeTarget();
    installGlobalErrorHandlers(target);

    target.emit('unhandledrejection', { reason: 'no network' });

    expect(consoleError).toHaveBeenCalledWith('[Zynvox] unhandled promise rejection:', 'no network');
  });
});
