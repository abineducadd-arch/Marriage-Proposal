import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock HTMLMediaElement play/pause in jsdom environment to prevent console noise
if (typeof window !== "undefined" && window.HTMLMediaElement) {
  Object.defineProperty(window.HTMLMediaElement.prototype, "paused", {
    configurable: true,
    writable: true,
    value: true,
  });
  window.HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
    this.paused = false;
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function (this: HTMLMediaElement) {
    this.paused = true;
  };
}

// Mock HTMLCanvasElement getContext for tests
if (typeof window !== "undefined" && window.HTMLCanvasElement) {
  window.HTMLCanvasElement.prototype.getContext = () => null;
}


// Polyfill PointerEvent in jsdom environment for pointer down/move/up/cancel testing
if (typeof window !== "undefined" && !window.PointerEvent) {
  // @ts-expect-error - jsdom missing PointerEvent
  window.PointerEvent = class PointerEvent extends window.MouseEvent {
    pointerId: number;
    isPrimary: boolean;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
      this.isPrimary = params.isPrimary ?? true;
    }
  };
}
