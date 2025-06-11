/**
 * Test utilities for authentication-related tests
 */

/**
 * Mocks the Directus authentication response
 */
export const mockDirectusAuth = (token = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky') => {
  return {
    access_token: token,
    expires: 3600,
    refresh_token: 'mock-refresh-token',
  };
};

/**
 * Mocks the Directus user response
 */
export const mockDirectusUser = () => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  role: '74e3b05e-0f14-422e-9ad3-759d426db60a',
  status: 'active',
});

/**
 * Sets up the test environment with required mocks
 */
export const setupTestEnv = () => {
  // Mock process.env with required Directus variables
  process.env.NODE_ENV = 'test';
  process.env.PUBLIC_DIRECTUS_URL = 'http://localhost:8055';
  process.env.DIRECTUS_STATIC_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
  process.env.PUBLIC_DIRECTUS_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

  // Mock fetch if not already mocked
  if (!global.fetch) {
    global.fetch = jest.fn();
  }
};

/**
 * Resets all mocks and clears environment variables
 */
export const resetTestEnv = () => {
  jest.clearAllMocks();
  jest.resetModules();
  
  // Clear environment variables
  delete process.env.NODE_ENV;
  delete process.env.PUBLIC_DIRECTUS_URL;
  delete process.env.DIRECTUS_STATIC_TOKEN;
  delete process.env.PUBLIC_DIRECTUS_TOKEN;
  
  // Reset fetch mock if it exists
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockReset();
  }
};

/**
 * Creates a mock context for authentication tests
 */
export const createMockContext = () => {
  return {
    req: {
      headers: {
        authorization: 'Bearer k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
      },
    },
    res: {
      setHeader: jest.fn(),
      statusCode: 200,
      end: jest.fn(),
    },
  };
};
