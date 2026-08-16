import { useRef, type PointerEvent as ReactPointerEvent } from "react";

type SwipeHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
};

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 56,
}: SwipeHandlers) {
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    const start = origin.current;
    origin.current = null;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    if (dx < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  };

  const onPointerCancel = () => {
    origin.current = null;
  };

  return { onPointerDown, onPointerUp, onPointerCancel };
}
