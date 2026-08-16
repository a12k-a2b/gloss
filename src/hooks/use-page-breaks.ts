import { useLayoutEffect, useState, type RefObject } from "react";

export function usePageBreaks(
  viewport: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
  enabled: boolean,
  deps: unknown[],
): number[] {
  const [breaks, setBreaks] = useState<number[]>([0]);

  useLayoutEffect(() => {
    if (!enabled) {
      setBreaks([0]);
      return;
    }
    const view = viewport.current;
    const root = content.current;
    if (!view || !root) return;

    const measure = () => {
      const pageH = Math.max(240, view.clientHeight - 44);
      const next = [0];
      let pageTop = 0;
      const kids = [...root.children] as HTMLElement[];
      if (kids.length === 0) {
        const total = root.scrollHeight;
        let y = pageH;
        while (y < total - 32) {
          next.push(y);
          y += pageH;
        }
        setBreaks(next);
        return;
      }
      for (const kid of kids) {
        if (kid.dataset.pageChrome === "true") continue;
        const top = kid.offsetTop;
        const bottom = top + kid.offsetHeight;
        if (bottom - pageTop > pageH && top > pageTop + 12) {
          next.push(top);
          pageTop = top;
        }
        if (bottom - pageTop > pageH) {
          let y = pageTop + pageH;
          while (y < bottom - 32) {
            next.push(y);
            y += pageH;
          }
          pageTop = y;
        }
      }
      setBreaks(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(view);
    ro.observe(root);
    return () => ro.disconnect();
  }, [enabled, viewport, content, ...deps]);

  return breaks;
}
