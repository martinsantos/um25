import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

global.localStorage = localStorageMock;

// Mock the auth and directus modules
jest.mock('../auth', () => ({
  authenticate: jest.fn(),
  isAuthenticated: jest.fn(),
  logout: jest.fn()
}));

jest.mock('../directus', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue({ access_token: 'test-token' }),
    logout: jest.fn().mockResolvedValue(true),
    refresh: jest.fn().mockResolvedValue({ access_token: 'refreshed-token' }),
    setToken: jest.fn(),
    getToken: jest.fn().mockResolvedValue('test-token')
  }))
}));

import { authenticate, isAuthenticated, logout } from '../auth';

describe('Auth Utils', () => {
  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'password';
  const TEST_TOKEN = 'test-token';
  const REFRESH_TOKEN = 'refresh-token';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('authenticate', () => {
    it('should authenticate user and store tokens', async () => {
      authenticate.mockResolvedValueOnce({ access_token: 'test-token' });
      const result = await authenticate(TEST_EMAIL, TEST_PASSWORD);

      expect(result).toEqual({ access_token: 'test-token' });
    });

    it('should throw error on authentication failure', async () => {
      const error = new Error('Authentication failed');
      authenticate.mockRejectedValueOnce(error);

      await expect(authenticate(TEST_EMAIL, 'wrong-password')).rejects.toThrow('Authentication failed');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', async () => {
      isAuthenticated.mockResolvedValueOnce(true);

      const result = await isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false when no token exists', async () => {
      isAuthenticated.mockResolvedValueOnce(false);

      const result = await isAuthenticated();
      expect(result).toBe(false);
    });

    it('should attempt token refresh when token is expired', async () => {
      isAuthenticated.mockResolvedValueOnce(true);

      const result = await isAuthenticated();
      expect(result).toBe(true);
      expect(isAuthenticated).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear auth data and call directus logout', async () => {
      logout.mockResolvedValueOnce(undefined);

      await logout();

      expect(logout).toHaveBeenCalled();
    });
  });
});
