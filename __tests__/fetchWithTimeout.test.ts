import { fetchWithTimeout } from '../src/utils/fetchWithTimeout';

test('the timeout remains active after fetch returns the response headers', async () => {
  let signal: AbortSignal | null | undefined;
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (_input, options) => {
    signal = options?.signal;
    return {} as Response;
  });

  await fetchWithTimeout('http://test.invalid/', {}, 10);
  await new Promise(resolve => setTimeout(resolve, 40));

  expect(signal?.aborted).toBe(true);
});

test('a caller can cancel a request before its timeout', async () => {
  let signal: AbortSignal | null | undefined;
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (_input, options) => {
    signal = options?.signal;
    return {} as Response;
  });

  const controller = new AbortController();
  await fetchWithTimeout('http://test.invalid/', { signal: controller.signal }, 1000);
  controller.abort();

  expect(signal?.aborted).toBe(true);
});
