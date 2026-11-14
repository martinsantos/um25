/** One meaningful sequence per visit to the scene; no work while hidden. */
export function initFunctionalScenes(root: Document) {
  const scenes = [
    ...root.querySelectorAll<HTMLElement>("[data-functional-scene]"),
  ].filter((scene) => !scene.hasAttribute("data-functional-ready"));
  if (!scenes.length || typeof IntersectionObserver === "undefined") return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const visible = new Set<HTMLElement>();
  const seen = new Set<HTMLElement>();
  const timers = new Map<HTMLElement, ReturnType<typeof setTimeout>[]>();

  function finish(scene: HTMLElement) {
    timers.get(scene)?.forEach(clearTimeout);
    timers.delete(scene);
    scene.dataset.state = "complete";
    scene.dataset.phase = "2";
  }
  function update() {
    for (const scene of scenes) {
      if (!visible.has(scene) || root.hidden || reduced.matches) {
        finish(scene);
        continue;
      }
      if (seen.has(scene)) continue;
      seen.add(scene);
      scene.dataset.state = "running";
      scene.dataset.phase = "0";
      timers.set(scene, [
        setTimeout(() => {
          scene.dataset.phase = "1";
        }, 1300),
        setTimeout(() => {
          scene.dataset.phase = "2";
        }, 3100),
        setTimeout(() => finish(scene), 4800),
      ]);
    }
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const scene = (entry.target as HTMLElement).closest<HTMLElement>(
          "[data-functional-scene]",
        );
        if (!scene) continue;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.55)
          visible.add(scene);
        else visible.delete(scene);
        if (!entry.isIntersecting || entry.intersectionRatio < 0.02)
          seen.delete(scene);
      }
      update();
    },
    { threshold: [0, 0.02, 0.55] },
  );
  scenes.forEach((scene) => {
    scene.setAttribute("data-functional-ready", "");
    const stage = scene.querySelector("[data-functional-stage]");
    if (stage) observer.observe(stage);
  });
  root.addEventListener("visibilitychange", update);
  reduced.addEventListener("change", update);
  window.addEventListener("pagehide", () => {
    scenes.forEach(finish);
    visible.clear();
    seen.clear();
    observer.disconnect();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted)
      scenes.forEach((scene) => {
        const stage = scene.querySelector("[data-functional-stage]");
        if (stage) observer.observe(stage);
      });
  });
}
