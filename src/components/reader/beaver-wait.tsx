import { useEffect, useState } from "react";

const FRAMES = [
  "/beaver/idle-1.png",
  "/beaver/idle-2.png",
  "/beaver/idle-3.png",
  "/beaver/idle-4.png",
];

export function BeaverWait({
  line,
  detail,
}: {
  line: string;
  detail?: string;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setFrame((n) => (n + 1) % FRAMES.length), 420);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="beaver-wait" role="status" aria-live="polite">
      <img
        src={FRAMES[frame]}
        alt=""
        className="beaver-wait-fig"
        width={220}
        height={180}
      />
      <img src="/beaver/loading-word.png" alt="loading" className="beaver-wait-word" />
      <p className="beaver-wait-line">{line}</p>
      {detail ? <p className="beaver-wait-detail">{detail}</p> : null}
    </div>
  );
}
