
/**
 * passive-events.ts
 * 
 * This utility patches addEventListener to force passive: true for scroll-blocking events
 * (touchstart, touchmove, wheel) unless explicitly set otherwise.
 * This helps resolve violations in Lighthouse and browser consoles, especially
 * when using third-party libraries that don't use passive listeners.
 */

export function applyPassiveEventsPatch(): void {
  if (typeof window === 'undefined') return;

  // Check if the browser supports passive event listeners
  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: function() {
        supportsPassive = true;
        return true;
      }
    });
    // @ts-expect-error - We're testing for support
    window.addEventListener('testPassive', null, opts);
    // @ts-expect-error - We're testing for support
    window.removeEventListener('testPassive', null, opts);
  } catch {
    // Passive not supported
  }

  if (!supportsPassive) return;

  const eventsToPatch = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];
  const originalAddEventListener = EventTarget.prototype.addEventListener;

  // @ts-expect-error - Monkey patching
  EventTarget.prototype.addEventListener = function(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ) {
    if (eventsToPatch.includes(type)) {
      // If options is not provided, default to { passive: true }
      if (options === undefined) {
        options = { passive: true };
      }
      // If options is a boolean (capture), convert to object and add passive: true
      else if (typeof options === 'boolean') {
        options = { capture: options, passive: true };
      }
      // If options is an object, ensure passive is true unless explicitly set to false
      else if (typeof options === 'object' && options !== null) {
        if (options.passive === undefined) {
          options = { ...options, passive: true };
        }
      }
    }
    
    return originalAddEventListener.call(this, type, listener, options);
  };
}
