import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

type SwipeHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
};

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 48,
}: SwipeHandlers) {
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  const fired = useRef(false);

  const consider = (x: number, y: number) => {
    const start = origin.current;
    if (!start || fired.current) return;
    const dx = x - start.x;
    const dy = y - start.y;
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.1) return;
    fired.current = true;
    if (dx < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    fired.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* not every surface allows capture */
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!origin.current || origin.current.id !== e.pointerId) return;
    consider(e.clientX, e.clientY);
  };

  const end = (e: ReactPointerEvent) => {
    if (origin.current && origin.current.id === e.pointerId) {
      consider(e.clientX, e.clientY);
    }
    origin.current = null;
  };

  const style: CSSProperties = { touchAction: "pan-y" };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: end,
    onPointerCancel: end,
    style,
  };
}