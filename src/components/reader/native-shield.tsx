import { useEffect } from "react";

function allowNative(target: EventTarget | null) {
  return (
    target instanceof Element &&
    !!target.closest("input, textarea, [data-allow-select]")
  );
}

export function NativeMenuShield() {
  useEffect(() => {
    const block = (e: Event) => {
      if (allowNative(e.target)) return;
      e.preventDefault();
    };
    document.addEventListener("contextmenu", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("dragstart", block);

    let hold: number | null = null;
    const onDown = (e: PointerEvent) => {
      if (allowNative(e.target)) return;
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
      hold = window.setTimeout(() => {
        window.getSelection()?.removeAllRanges();
      }, 260);
    };
    const onUp = () => {
      if (hold != null) window.clearTimeout(hold);
      hold = null;
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);

    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("dragstart", block);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
      onUp();
    };
  }, []);

  return (
    <div className="native-menu-shield" aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
