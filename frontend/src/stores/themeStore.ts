import { create } from "zustand";
import { persist } from "zustand/middleware";
export type ThemePreference = "system" | "light" | "dark";
export const useThemeStore = create<{
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}>()(
  persist((set) => ({ theme: "system", setTheme: (theme) => set({ theme }) }), {
    name: "bassaps-ui-preferences",
  }),
);
