import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import ThemeSelect from "../themeSelect";
import { Link } from "@tanstack/react-router";
import {
  Home,
  Menu,
  Newspaper,
  Terminal,
  BookOpen,
  Settings,
  Minus,
  X,
  Wrench,
  Info,
} from "lucide-react";
import useModalStore from "@/stores/modalStore";
import useAccountStore from "@/stores/accountStore";
import useSettingStore from "@/stores/settingStore";
import { AppService } from "@bindings/cyrene-launcher/internal/app-service";
import Credits from "../footer";
import AccountButton from "../accountButton";
import LanguageSwitcher from "../languageSwitcher";

export default function Header() {
  const { setIsOpenSettingModal, setIsOpenCloseModal } = useModalStore();
  const isAdmin = useAccountStore((s) => s.user?.role === "admin");
  const isStarRail = useSettingStore((s) => s.gameProfile === "starrail");
  const mobileMenu = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useLocation({ select: (location) => location.pathname });
  useEffect(() => {
    mobileMenu.current?.close();
  }, [pathname]);
  const navigation = () => (
    <nav
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a"))
          mobileMenu.current?.close();
      }}
    >
      <Link to="/" activeOptions={{ exact: true }}>
        <Home size={19} />
        ホーム
      </Link>
      {isStarRail && (
        <Link to="/news">
          <Newspaper size={19} />
          ニュース
        </Link>
      )}
      <Link to="/howto">
        <BookOpen size={19} />
        プレイガイド
      </Link>
      {isStarRail && (
        <details>
          <summary>
            <Wrench size={19} />
            ゲームツール
          </summary>
          <Link to="/language">言語パッチ</Link>
          <Link to="/diff">クライアント更新</Link>
          <Link to="/analysis">分析</Link>
          <Link to="/srtools">SR Tools</Link>
        </details>
      )}
      {isStarRail && isAdmin && (
        <Link to="/console">
          <Terminal size={19} />
          管理者コンソール
        </Link>
      )}
      <Link to="/about">
        <Info size={19} />
        このアプリについて
      </Link>
    </nav>
  );
  return (
    <>
      <header
        className="bassaps-titlebar"
        style={{ "--wails-draggable": "drag" } as React.CSSProperties}
      >
        <button
          className="bassaps-mobile-trigger"
          aria-label="メニューを開く"
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          onClick={() => {
            mobileMenu.current?.showModal();
            setMenuOpen(true);
          }}
        >
          <Menu size={19} />
        </button>
        <Link to="/" className="bassaps-brand">
          <span className="bassaps-monogram">B</span>
          <strong>
            BASSAPS<span>LAUNCHER</span>
          </strong>
        </Link>
        <span className="bassaps-title-label">Launcher</span>
        <div className="bassaps-window-controls">
          <ThemeSelect />
          <AccountButton />
          <LanguageSwitcher />
          <button aria-label="設定" onClick={() => setIsOpenSettingModal(true)}>
            <Settings size={17} />
          </button>
          <button aria-label="最小化" onClick={() => AppService.MinimizeApp()}>
            <Minus size={17} />
          </button>
          <button aria-label="閉じる" onClick={() => setIsOpenCloseModal(true)}>
            <X size={17} />
          </button>
        </div>
      </header>
      <aside className="bassaps-sidebar">
        <span className="bassaps-eyebrow">メニュー</span>
        {navigation()}
        <div className="bassaps-sidebar-footer">
          <span className="bassaps-eyebrow">標準接続先</span>
          <strong>hsr.bassaps.com</strong>
          <Credits />
        </div>
      </aside>
      <dialog
        id="mobile-navigation"
        ref={mobileMenu}
        className="bassaps-mobile-menu"
        aria-label="ナビゲーション"
        onClose={() => setMenuOpen(false)}
      >
        <header>
          <strong>BASSAPS</strong>
          <button
            autoFocus
            aria-label="メニューを閉じる"
            onClick={() => mobileMenu.current?.close()}
          >
            <X size={20} />
          </button>
        </header>
        {navigation()}
        <AccountButton />
        <LanguageSwitcher />
        <Credits />
      </dialog>
    </>
  );
}
