import { useEffect, useState } from "react";
import { isOnline, onOnlineChange } from "@/lib/online";

export function OfflinePill() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(isOnline());
    return onOnlineChange(setOnline);
  }, []);
  if (online) return null;
  return (
    <span className="caps hidden sm:inline px-2 text-ink-faint" title="Reading and notes still work">
      Offline
    </span>
  );
}
