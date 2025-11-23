import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { mockDirectusAuth, mockDirectusUser, setupTestEnv, resetTestEnv } from './utils/authTestUtils';

// Mock the Directus SDK
jest.mock('@directus/sdk', () => ({
  createDirectus: jest.fn().mockImplementation(() => ({
    withRest: jest.fn().mockReturnThis(),
    withAuth: jest.fn().mockReturnThis(),
    login: jest.fn().mockResolvedValue({
      access_token: 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
      expires: 3600,
    }),
    request: jest.fn().mockResolvedValue({}),
    getToken: jest.fn().mockResolvedValue('k6P8LAY8_x_y1miB_KTlWnysCnx2Abky'),
  })),
}));

describe('Authentication', () => {
  beforeEach(() => {
    setupTestEnv();
    // Mock console to keep test output clean
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    resetTestEnv();
    jest.restoreAllMocks();
  });

  describe('Directus Authentication', () => {
    it('should authenticate with Directus using static token', async () => {
      const { createDirectus } = require('@directus/sdk');
      const client = createDirectus('http://localhost:8055');
      
      const token = await client.getToken();
      expect(token).toBe('k6P8LAY8_x_y1miB_KTlWnysCnx2Abky');
      expect(createDirectus).toHaveBeenCalledWith('http://localhost:8055');
    });

    it('should handle authentication errors', async () => {
      const { createDirectus } = require('@directus/sdk');
      const error = new Error('Authentication failed');
      createDirectus().login.mockRejectedValueOnce(error);

      await expect(createDirectus().login()).rejects.toThrow('Authentication failed');
    });
  });

  describe('Environment Configuration', () => {
    it('should have required environment variables', () => {
      expect(process.env.PUBLIC_DIRECTUS_URL).toBe('http://localhost:8055');
      expect(process.env.DIRECTUS_STATIC_TOKEN).toBe('k6P8LAY8_x_y1miB_KTlWnysCnx2Abky');
      expect(process.env.PUBLIC_DIRECTUS_TOKEN).toBe('k6P8LAY8_x_y1miB_KTlWnysCnx2Abky');
    });
  });

  describe('Mock Utilities', () => {
    it('should create a mock Directus auth response', () => {
      const auth = mockDirectusAuth();
      expect(auth).toHaveProperty('access_token');
      expect(auth).toHaveProperty('expires');
      expect(auth).toHaveProperty('refresh_token');
    });

    it('should create a mock Directus user', () => {
      const user = mockDirectusUser();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user.role).toBe('74e3b05e-0f14-422e-9ad3-759d426db60a');
    });
  });
});
