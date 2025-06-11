const { jest } = require('@jest/globals');
const { authenticate, isAuthenticated, logout } = require('../auth');

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

// Mock the directus client
vi.mock('../directus', () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(() => ({
    login: vi.fn().mockResolvedValue({ access_token: 'test-token' }),
    logout: vi.fn().mockResolvedValue(true),
    refresh: vi.fn().mockResolvedValue({ access_token: 'refreshed-token' }),
    setToken: vi.fn(),
    getToken: vi.fn().mockResolvedValue('test-token')
  }))
}));

describe('Auth Utils', () => {
  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'password';
  const TEST_TOKEN = 'test-token';
  const REFRESH_TOKEN = 'refresh-token';

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('authenticate', () => {
    it('should authenticate user and store tokens', async () => {
      const result = await authenticate(TEST_EMAIL, TEST_PASSWORD);
      
      expect(result).toEqual({ access_token: 'test-token' });
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_refresh_token', 'refresh-token');
    });

    it('should throw error on authentication failure', async () => {
      const error = new Error('Authentication failed');
      const mockDirectus = require('../directus').default();
      mockDirectus.login.mockRejectedValueOnce(error);
      
      await expect(authenticate(TEST_EMAIL, 'wrong-password')).rejects.toThrow('Authentication failed');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', async () => {
      localStorage.setItem('auth_token', TEST_TOKEN);
      
      const result = await isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false when no token exists', async () => {
      localStorage.removeItem('auth_token');
      
      const result = await isAuthenticated();
      expect(result).toBe(false);
    });

    it('should attempt token refresh when token is expired', async () => {
      const mockDirectus = require('../directus').default();
      
      // First call fails with token expired, then succeeds
      mockDirectus.getToken.mockResolvedValueOnce(null);
      mockDirectus.refresh.mockResolvedValueOnce({ access_token: 'new-token' });
      
      localStorage.setItem('auth_refresh_token', REFRESH_TOKEN);
      
      const result = await isAuthenticated();
      expect(result).toBe(true);
      expect(mockDirectus.refresh).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
    });
  });

  describe('logout', () => {
    it('should clear auth data and call directus logout', async () => {
      localStorage.setItem('auth_token', TEST_TOKEN);
      
      await logout();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_refresh_token');
      
      const mockDirectus = require('../directus').default();
      expect(mockDirectus.logout).toHaveBeenCalled();
    });
  });
});
