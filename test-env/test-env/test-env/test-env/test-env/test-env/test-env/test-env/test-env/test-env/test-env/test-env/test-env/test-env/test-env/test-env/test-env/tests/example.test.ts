// Example test file to verify Jest + TypeScript setup

describe('Jest Setup Test', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should run a basic test', () => {
    expect(true).toBe(true);
  });

  it('should have access to environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.PUBLIC_DIRECTUS_URL).toBeDefined();
    expect(process.env.DIRECTUS_STATIC_TOKEN).toBeDefined();
  });

  it('should mock fetch', async () => {
    // Mock a successful fetch response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      })
    );

    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(data).toEqual({ data: 'test' });
  });

  it('should mock localStorage', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.setItem).toHaveBeenCalledWith('test', 'value');
    
    const value = localStorage.getItem('test');
    expect(localStorage.getItem).toHaveBeenCalledWith('test');
    expect(value).toBe('value');
  });
});
