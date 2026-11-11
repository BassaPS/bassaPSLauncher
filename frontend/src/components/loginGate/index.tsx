import ThemeSelect from "../themeSelect";
import Credits from "../footer";
import { useEffect, useState } from "react";
import { Minus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Events } from "@wailsio/runtime";
import { AccountService } from "@bindings/cyrene-launcher/internal/account-service";
import { AppService } from "@bindings/cyrene-launcher/internal/app-service";
import useAccountStore, { type GateError } from "@/stores/accountStore";

function mapError(code: string): GateError {
  if (code.includes("banned")) return "banned";
  if (code.includes("pending")) return "pending";
  return "failed";
}

// Fullscreen overlay that blocks the app until the user is signed in.
// Owns all account events; AccountButton only renders the store state.
export default function LoginGate() {
  const { t } = useTranslation();
  const [register, setRegister] = useState(false);
  const openRegistration = async () => {
    try {
      const base = await AccountService.GetWebBaseURL();
      await AppService.OpenURL(base + "/register");
    } catch {
      toast.error("登録ページを開けませんでした。接続を確認してください。");
    }
  };
  const {
    user,
    pending,
    checking,
    skipped,
    gateError,
    setUser,
    setPending,
    setChecking,
    setSkipped,
    setGateError,
  } = useAccountStore();

  // 每次打开 launcher 自动恢复登录态:连不上服务器则在 2 分钟内持续重试,期间显示带"暂不登录"的连接页,拿到 profile 即登录,未登录(401)则显示登录页。
  const restore = async () => {
    setGateError("");
    setChecking(true);
    const deadline = Date.now() + 2 * 60 * 1000;
    while (true) {
      const st = useAccountStore.getState();
      if (st.user || st.skipped) {
        setChecking(false);
        return;
      }
      try {
        const [ok, profile, err] = await AccountService.GetProfile();
        if (ok) {
          setUser(profile);
          setChecking(false);
          return;
        }
        if (!err) {
          setChecking(false);
          return;
        } // 未登录(401/无 token):显示登录页
      } catch {
        /* 连不上,继续重试 */
      }
      if (Date.now() >= deadline) {
        setGateError("offline");
        setChecking(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
  };

  useEffect(() => {
    restore();

    const offSuccess = Events.On("account:login:success", (event: any) => {
      setUser(event.data?.user ?? event.data);
      toast.success(t("account.login_success"));
    });
    const offFailed = Events.On("account:login:failed", (event: any) => {
      setPending(false);
      setGateError(mapError(String(event.data?.error ?? "")));
    });
    const offLogout = Events.On("account:logout", () => {
      setUser(null);
      toast.info(t("account.logged_out"));
    });
    return () => {
      offSuccess();
      offFailed();
      offLogout();
    };
  }, []);

  // 点登录后拿设备码:连不上则在 2 分钟内重试(期间显示连接页),拿到设备码即打开浏览器进入等待;被封禁/待激活则直接提示。
  const handleLogin = async () => {
    setGateError("");
    setChecking(true);
    const deadline = Date.now() + 2 * 60 * 1000;
    while (true) {
      const st = useAccountStore.getState();
      if (st.user || st.skipped) {
        setChecking(false);
        return;
      }
      try {
        const [ok, err] = await AccountService.StartLogin();
        if (ok) {
          setChecking(false);
          setPending(true);
          return;
        }
        const mapped = err ? mapError(err) : "";
        if (mapped === "banned" || mapped === "pending") {
          setChecking(false);
          setGateError(mapped);
          return;
        }
      } catch {
        /* 连不上,继续重试 */
      }
      if (Date.now() >= deadline) {
        setChecking(false);
        setGateError("offline");
        return;
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
  };

  const handleCancel = async () => {
    try {
      await AccountService.CancelLogin();
    } catch {}
    setPending(false);
  };

  const handleSkip = () => {
    setSkipped(true);
    toast.info(t("account.skip_reminder"));
  };

  if (user || skipped) return null;

  const errorKey =
    gateError === "banned"
      ? "account.banned"
      : gateError === "pending"
        ? "account.pending"
        : gateError === "offline"
          ? "account.offline"
          : gateError === "failed"
            ? "account.login_failed"
            : "";

  return (
    <div
      className="bassaps-gate fixed inset-0 z-100 flex flex-col"
      style={{ "--wails-draggable": "drag" } as any}
    >
      <div
        className="flex justify-end gap-1 p-2"
        style={{ "--wails-draggable": "no-drag" } as any}
      >
        <ThemeSelect />
        <button
          onClick={() => AppService.MinimizeApp()}
          className="btn btn-ghost btn-sm btn-circle hover:bg-base-300"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => AppService.CloseApp()}
          className="btn btn-ghost btn-sm btn-circle hover:bg-base-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 -mt-10 px-6">
        <span className="bassaps-monogram" aria-hidden="true">B</span>
        <h1 className="text-3xl font-bold">
          <span className="text-base-content">
            BASSAPS Launcher
          </span>
        </h1>

        {register ? (
          <section
            className="bassaps-register"
            style={{ "--wails-draggable": "no-drag" } as React.CSSProperties}
          >
            <span className="bassaps-eyebrow">CREATE YOUR ACCOUNT</span>
            <h2>新規アカウント登録</h2>
            <p>
              BASSAPSの登録サイトでアカウントを作成します。登録後、ログインしてランチャーを連携してください。
            </p>
            <div className="bassaps-connection">
              hsr.bassaps.com / 一般ユーザー
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={openRegistration}
            >
              ブラウザーで登録する ↗
            </button>
            <button
              className="btn btn-ghost w-full"
              onClick={() => setRegister(false)}
            >
              ログイン画面へ戻る
            </button>
          </section>
        ) : checking ? (
          <div
            className="flex flex-col items-center gap-4"
            style={{ "--wails-draggable": "no-drag" } as any}
          >
            <p className="text-base-content/55 text-sm">
              {t("account.connecting")}
            </p>
            <span className="loading loading-spinner loading-md text-base-content/80" />
            <button
              onClick={handleSkip}
              className="btn btn-ghost btn-sm text-base-content/60"
            >
              {t("account.skip")}
            </button>
          </div>
        ) : pending ? (
          <div
            className="flex flex-col items-center gap-4"
            style={{ "--wails-draggable": "no-drag" } as any}
          >
            <p className="text-base-content/55 text-sm">
              {t("account.waiting")}
            </p>
            <span className="loading loading-spinner loading-md text-base-content/80" />
            <button
              onClick={handleCancel}
              className="btn btn-ghost btn-sm text-base-content/65"
            >
              {t("account.cancel")}
            </button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-4"
            style={{ "--wails-draggable": "no-drag" } as any}
          >
            <p className="text-base-content/55 text-sm">
              BASSAPSへようこそ。アカウントを連携して旅を始めましょう。
            </p>
            {errorKey && <p className="text-error text-sm">{t(errorKey)}</p>}
            <button
              className="btn btn-outline w-full"
              onClick={() => setRegister(true)}
            >
              初めての方 · アカウントを登録
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogin}
                className="btn btn-primary border-none shadow-sm  px-8"
              >
                {t("account.sign_in")}
              </button>
              {gateError === "offline" && (
                <button
                  onClick={restore}
                  className="btn btn-ghost text-base-content/55"
                >
                  {t("account.retry")}
                </button>
              )}
            </div>
            <button
              onClick={handleSkip}
              className="btn btn-ghost btn-sm text-base-content/60"
            >
              {t("account.skip")}
            </button>
          </div>
        )}
      </div>
      <div className="bassaps-gate-credits"><Credits /></div>
    </div>
  );
}
