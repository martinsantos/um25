// Prueba de ejemplo para verificar la configuración de Jest

describe('Configuración de pruebas', () => {
  // Mock de localStorage para Node.js
  const createLocalStorageMock = () => {
    const store = {};
    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      })
    };
  };

  let localStorageMock;

  // Configurar el mock antes de cada prueba
  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    global.localStorage = localStorageMock;
  });

  // Limpiar los mocks después de cada prueba
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('debe sumar correctamente', () => {
    expect(1 + 1).toBe(2);
  });

  it('debe manejar correctamente los mocks de fetch', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      })
    );

    const response = await fetch('https://api.example.com');
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data).toEqual({ data: 'test' });
  });

  it('debe manejar correctamente el localStorage', () => {
    // Configurar el test
    const testKey = 'test';
    const testValue = 'value';
    
    // Probar setItem y getItem
    localStorage.setItem(testKey, testValue);
    
    // Verificar que setItem fue llamado con los argumentos correctos
    expect(localStorage.setItem).toHaveBeenCalledWith(testKey, testValue);
    
    // Verificar que getItem devuelve el valor correcto
    expect(localStorage.getItem(testKey)).toBe(testValue);
    
    // Verificar que getItem fue llamado con el key correcto
    expect(localStorage.getItem).toHaveBeenCalledWith(testKey);
    
    // Probar removeItem
    localStorage.removeItem(testKey);
    expect(localStorage.removeItem).toHaveBeenCalledWith(testKey);
    
    // Verificar que el item fue eliminado
    expect(localStorage.getItem(testKey)).toBeNull();
    
    // Verificar que clear funciona
    localStorage.setItem('anotherKey', 'anotherValue');
    expect(localStorage.getItem('anotherKey')).toBe('anotherValue');
    
    localStorage.clear();
    expect(localStorage.clear).toHaveBeenCalled();
    expect(localStorage.getItem('anotherKey')).toBeNull();
  });
});
