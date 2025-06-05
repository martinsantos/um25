/// <reference types="@testing-library/jest-dom" />

// Extender las expectativas de Vitest con los matchers de jest-dom
interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toBeVisible(): R;
  toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace?: boolean }): R;
  // Añade aquí otros matchers que necesites
}

declare global {
  namespace Vi {
    interface JestAssertion<T = any>
      extends jest.Matchers<void, T>,
        CustomMatchers<T> {}
  }
}
