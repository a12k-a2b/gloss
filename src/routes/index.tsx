import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/reader/app-shell";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <AppShell />;
}
