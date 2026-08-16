export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function onOnlineChange(fn: (online: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const go = () => fn(navigator.onLine);
  window.addEventListener("online", go);
  window.addEventListener("offline", go);
  return () => {
    window.removeEventListener("online", go);
    window.removeEventListener("offline", go);
  };
}
