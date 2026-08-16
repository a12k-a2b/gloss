import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "@/components/reader/app-shell";
import "@/styles.css";

async function bootNative() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setBackgroundColor({ color: "#f3efe4" });
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    /* browser / PWA */
  }
}

void bootNative();

const root = document.getElementById("app");
if (!root) throw new Error("Gloss: #app missing");

createRoot(root).render(
  <StrictMode>
    <AppShell />
  </StrictMode>,
);
