// Drives the constellation's fade-in: invisible until the target section
// approaches the viewport, then ramps to fully visible and stays that way
// (no fade-out trigger) for the rest of the scroll.
export function sectionRevealFade(section: HTMLElement | null) {
  if (!section) return 0;
  const top = section.getBoundingClientRect().top;
  const vh = window.innerHeight;
  const raw = (vh - top) / (vh * 0.6);
  return Math.min(1, Math.max(0, raw));
}
