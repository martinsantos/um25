import { initFunctionalScenes } from "../src/components/proto/functional-motion";

describe("functional scenes stay quiet outside the viewport", () => {
  let callback: IntersectionObserverCallback;
  let reducedListener: () => void;
  let preference: { matches: boolean; addEventListener: jest.Mock };
  let scene: HTMLElement;
  let stage: HTMLElement;
  const visibility = (ratio: number) =>
    callback(
      [
        {
          target: stage,
          isIntersecting: ratio > 0,
          intersectionRatio: ratio,
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML =
      '<figure data-functional-scene="energy" data-state="complete"><div data-functional-stage></div></figure>';
    scene = document.querySelector("figure")!;
    stage = scene.firstElementChild as HTMLElement;
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    preference = {
      matches: false,
      addEventListener: jest.fn((_, listener) => {
        reducedListener = listener;
      }),
    };
    window.matchMedia = jest.fn(() => preference as unknown as MediaQueryList);
    window.IntersectionObserver = jest.fn(
      (cb: IntersectionObserverCallback) => {
        callback = cb;
        return { observe: jest.fn(), disconnect: jest.fn() };
      },
    ) as unknown as typeof IntersectionObserver;
    initFunctionalScenes(document);
  });
  afterEach(() => {
    window.dispatchEvent(new Event("pagehide"));
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("starts only when enough of the scene is visible and stops immediately on exit", () => {
    visibility(0.3);
    expect(scene.dataset.state).toBe("complete");
    visibility(0.8);
    expect(scene.dataset.state).toBe("running");
    jest.advanceTimersByTime(1400);
    expect(scene.dataset.phase).toBe("1");
    visibility(0);
    expect(scene.dataset.state).toBe("complete");
    expect(jest.getTimerCount()).toBe(0);
  });
  it("completes once and does not replay due to small threshold movements", () => {
    visibility(0.8);
    jest.advanceTimersByTime(4800);
    expect(scene.dataset.state).toBe("complete");
    visibility(0.5);
    visibility(0.8);
    expect(scene.dataset.state).toBe("complete");
    visibility(0);
    visibility(0.8);
    expect(scene.dataset.state).toBe("running");
  });
  it("uses the static explanatory state when reduced motion is requested", () => {
    preference.matches = true;
    visibility(0.8);
    expect(scene.dataset.state).toBe("complete");
    expect(jest.getTimerCount()).toBe(0);
    preference.matches = false;
    reducedListener();
    expect(scene.dataset.state).toBe("running");
    preference.matches = true;
    reducedListener();
    expect(scene.dataset.state).toBe("complete");
    expect(jest.getTimerCount()).toBe(0);
  });
  it("cancels pending changes when the tab is hidden", () => {
    visibility(0.8);
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(scene.dataset.state).toBe("complete");
    expect(jest.getTimerCount()).toBe(0);
  });
});
