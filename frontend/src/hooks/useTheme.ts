import { useEffect } from "react";
import { useThemeStore } from "@/stores/themeStore";
export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.dataset.theme = dark
        ? "bassaps"
        : "bassaps-light";
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
}
