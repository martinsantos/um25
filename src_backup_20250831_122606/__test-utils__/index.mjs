// Test utilities for common testing patterns

/**
 * Mocks the Directus client with specific responses
 * @param {Object} responses - Object containing method names and their mock implementations
 * @returns {Object} The mocked Directus client
 */
export function mockDirectus(responses = {}) {
  const mockClient = {
    items: jest.fn().mockReturnThis(),
    readByQuery: jest.fn().mockResolvedValue({ data: [], meta: { total_count: 0 } }),
    readOne: jest.fn().mockResolvedValue(null),
    readItems: jest.fn().mockResolvedValue([]),
    withToken: jest.fn().mockReturnThis(),
    request: jest.fn().mockResolvedValue({}),
    setToken: jest.fn().mockReturnThis(),
    login: jest.fn().mockResolvedValue({ access_token: 'mock-token' }),
    logout: jest.fn().mockResolvedValue(undefined),
    refresh: jest.fn().mockResolvedValue({ access_token: 'refreshed-token' }),
    getToken: jest.fn().mockResolvedValue('mock-token'),
    createItem: jest.fn().mockResolvedValue({ id: 1 }),
    updateItem: jest.fn().mockResolvedValue({ id: 1 }),
    deleteItem: jest.fn().mockResolvedValue(true),
    files: {
      readOne: jest.fn().mockResolvedValue({}),
      readByQuery: jest.fn().mockResolvedValue({ data: [] }),
      uploadOne: jest.fn().mockResolvedValue({ id: 'file-1' }),
      deleteOne: jest.fn().mockResolvedValue(true)
    },
    users: {
      me: { read: jest.fn().mockResolvedValue({ id: 'user-1' }) },
      readOne: jest.fn().mockResolvedValue({ id: 'user-1' }),
      readByQuery: jest.fn().mockResolvedValue({ data: [] })
    },
    roles: {
      readOne: jest.fn().mockResolvedValue({ id: 'role-1', name: 'Public' }),
      readByQuery: jest.fn().mockResolvedValue({ data: [] })
    },
    permissions: {
      readByQuery: jest.fn().mockResolvedValue({ data: [] })
    },
    server: {
      specs: {
        oas: jest.fn().mockResolvedValue({})
      }
    }
  };

  // Override default mocks with provided responses
  Object.entries(responses).forEach(([method, implementation]) => {
    if (typeof implementation === 'function') {
      mockClient[method] = jest.fn(implementation);
    } else {
      mockClient[method] = jest.fn().mockResolvedValue(implementation);
    }
  });

  return mockClient;
}

/**
 * Mocks the window.matchMedia API
 */
export function mockMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

/**
 * Mocks the IntersectionObserver API
 */
export function mockIntersectionObserver() {
  class MockIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      this.observe = jest.fn();
      this.unobserve = jest.fn();
      this.disconnect = jest.fn();
    }
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });

  return MockIntersectionObserver;
}

/**
 * Waits for the next tick
 * @returns {Promise<void>}
 */
export function nextTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Waits for a component to update
 * @param {number} ms - Time to wait in milliseconds
 * @returns {Promise<void>}
 */
export async function waitForUpdate(ms = 0) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  mockDirectus,
  mockMatchMedia,
  mockIntersectionObserver,
  nextTick,
  waitForUpdate,
};
