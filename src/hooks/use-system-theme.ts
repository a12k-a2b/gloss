import { useEffect } from "react";
import { useReader } from "@/store/reader";

const PAPER = "#f3efe4";
const INK = "#141311";

export function useSystemTheme() {
  const themePref = useReader((s) => s.themePref);
  const theme = useReader((s) => s.theme);
  const setTheme = useReader((s) => s.setTheme);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const pref = useReader.getState().themePref;
      const next = pref === "system" ? (mq.matches ? "ink" : "paper") : pref;
      if (useReader.getState().theme !== next) {
        useReader.setState({ theme: next });
      }
      const color = next === "ink" ? INK : PAPER;
      document.documentElement.style.colorScheme = next === "ink" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
        meta.setAttribute("content", color);
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [themePref, setTheme, theme]);
}
