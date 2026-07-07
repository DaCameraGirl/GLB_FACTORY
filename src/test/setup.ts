import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock WebGL context for Three.js
HTMLCanvasElement.prototype.getContext = function (contextId: string) {
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return {
      canvas: this,
      drawingBufferWidth: 800,
      drawingBufferHeight: 600,
      getExtension: () => null,
      getParameter: () => null,
      getShaderPrecisionFormat: () => ({
        precision: 1,
        rangeMin: 1,
        rangeMax: 1,
      }),
    };
  }
  return null;
} as any;
