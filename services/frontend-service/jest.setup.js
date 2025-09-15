import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock IndexedDB
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
};

const mockIDBDatabase = {
  transaction: jest.fn(() => ({
    objectStore: jest.fn(() => ({
      get: jest.fn(() => mockIDBRequest),
      put: jest.fn(() => mockIDBRequest),
      delete: jest.fn(() => mockIDBRequest),
      getAll: jest.fn(() => mockIDBRequest),
      createIndex: jest.fn(),
    })),
  })),
  createObjectStore: jest.fn(() => ({
    createIndex: jest.fn(),
  })),
  objectStoreNames: {
    contains: jest.fn(() => false),
  },
};

global.indexedDB = {
  open: jest.fn(() => ({
    ...mockIDBRequest,
    onupgradeneeded: null,
  })),
  deleteDatabase: jest.fn(() => mockIDBRequest),
};

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve({
      addEventListener: jest.fn(),
    })),
    getRegistration: jest.fn(() => Promise.resolve({
      unregister: jest.fn(() => Promise.resolve(true)),
    })),
  },
});

// Mock caches API
global.caches = {
  open: jest.fn(() => Promise.resolve({
    match: jest.fn(() => Promise.resolve(null)),
    put: jest.fn(() => Promise.resolve()),
  })),
  keys: jest.fn(() => Promise.resolve([])),
  delete: jest.fn(() => Promise.resolve(true)),
};