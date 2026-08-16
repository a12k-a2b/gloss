import type { DrawResult } from "./illustrate";

export async function drawTerm(): Promise<DrawResult> {
  return {
    ok: false,
    offline: true,
    error: "Drawing a figure needs the online app. The ink diagram above is the offline one.",
  };
}

export async function prewarmBoards(): Promise<void> {
  /* figures need the online app */
}
