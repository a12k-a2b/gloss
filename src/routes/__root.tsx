import { useEffect, type ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppErrorComponent } from "@/lib/error-component";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5",
      },
      { title: "Gloss — a margin for hard words" },
      {
        name: "description",
        content:
          "A two-column study reader for paper screens. The passage on the left, a teacher in the margin.",
      },
      { name: "theme-color", content: "#f3efe4" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Gloss" },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "default",
      },
      { name: "application-name", content: "Gloss" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      {
        rel: "icon",
        href: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      { rel: "apple-touch-icon", href: "/icons/icon-180.png" },
    ],
  }),
  component: RootComponent,
  errorComponent: AppErrorComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <PreviewHostBridge />
      <PwaRegister />
      <Outlet />
    </RootDocument>
  );
}

function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if ("Capacitor" in window) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline pin is optional */
    });
  }, []);
  return null;
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
