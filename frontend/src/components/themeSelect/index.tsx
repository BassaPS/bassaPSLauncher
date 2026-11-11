import { useThemeStore, type ThemePreference } from "@/stores/themeStore";
export default function ThemeSelect() {
  const { theme, setTheme } = useThemeStore();
  return (
    <label className="bassaps-theme-select">
      <span className="sr-only">カラーテーマ</span>
      <select
        aria-label="カラーテーマ"
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemePreference)}
      >
        <option value="system">自動</option>
        <option value="light">ライト</option>
        <option value="dark">ダーク</option>
      </select>
    </label>
  );
}
