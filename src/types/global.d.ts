// Tipos globales para el proyecto

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PUBLIC_DIRECTUS_URL: string;
    DIRECTUS_STATIC_TOKEN: string;
  }
}

declare module '*.astro' {
  const Component: any;
  export default Component;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

// Tipos para el mock de fetch
type FetchMock = jest.Mock<Promise<Response>, [string, RequestInit?]>;

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
    __INITIAL_STATE__: any;
  }

  // Extender el tipo global de Jest
  namespace jest {
    interface MockInstance<T = any, Y extends any[] = any> {
      mockResolvedValue: (value: T) => this;
      mockResolvedValueOnce: (value: T) => this;
      mockRejectedValue: (value: any) => this;
      mockRejectedValueOnce: (value: any) => this;
      mockImplementation: (fn: (...args: Y) => T) => this;
      mockImplementationOnce: (fn: (...args: Y) => T) => this;
    }
  }

  // Definir variables globales para Jest
  const jest: typeof import('@jest/globals').jest;
  const describe: typeof import('@jest/globals').describe;
  const it: typeof import('@jest/globals').it;
  const expect: typeof import('@jest/globals').expect;
  const beforeAll: typeof import('@jest/globals').beforeAll;
  const afterAll: typeof import('@jest/globals').afterAll;
  const beforeEach: typeof import('@jest/globals').beforeEach;
  const afterEach: typeof import('@jest/globals').afterEach;
  const test: typeof import('@jest/globals').test;
  const jestMock: typeof import('@jest/globals').jest;
  const jestFn: typeof import('@jest/globals').jest.fn;
  const jestSpyOn: typeof import('@jest/globals').jest.spyOn;
  const jestMockFn: typeof import('@jest/globals').jest.fn;
  const jestClearAllMocks: typeof import('@jest/globals').jest.clearAllMocks;
  const jestResetAllMocks: typeof import('@jest/globals').jest.resetAllMocks;
  const jestRestoreAllMocks: typeof import('@jest/globals').jest.restoreAllMocks;
  const jestUseFakeTimers: typeof import('@jest/globals').jest.useFakeTimers;
  const jestUseRealTimers: typeof import('@jest/globals').jest.useRealTimers;
  const jestRunAllTimers: typeof import('@jest/globals').jest.runAllTimers;
  const jestRunOnlyPendingTimers: typeof import('@jest/globals').jest.runOnlyPendingTimers;
  const jestAdvanceTimersByTime: typeof import('@jest/globals').jest.advanceTimersByTime;
  const jestRunAllTicks: typeof import('@jest/globals').jest.runAllTicks;
  const jestRunAllImmediates: typeof import('@jest/globals').jest.runAllImmediates;
  const jestSetSystemTime: typeof import('@jest/globals').jest.setSystemTime;
  const jestGetRealSystemTime: typeof import('@jest/globals').jest.getRealSystemTime;
}

// Extender el tipo global de NodeJS para incluir variables de entorno
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PUBLIC_DIRECTUS_URL: string;
      DIRECTUS_STATIC_TOKEN: string;
    }
  }
}

// Extender el tipo global de Window para incluir propiedades personalizadas
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
    __INITIAL_STATE__: any;
    IntersectionObserver: typeof IntersectionObserver;
    ResizeObserver: typeof ResizeObserver;
  }
}
