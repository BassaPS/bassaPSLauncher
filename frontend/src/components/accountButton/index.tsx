import { ExternalLink, LogIn, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AccountService } from "@bindings/cyrene-launcher/internal/account-service";
import { AppService } from "@bindings/cyrene-launcher/internal/app-service";
import useAccountStore from "@/stores/accountStore";

// Avatar dropdown in the header. Session restore, login and account events
// all live in LoginGate — by the time this renders, the user is signed in.
export default function AccountButton() {
    const { t } = useTranslation()
    const { user, skipped, setUser, setSkipped } = useAccountStore()

    const handleLogout = async () => {
        try { await AccountService.Logout() } catch { }
        setUser(null)
    }

    const openProfile = async () => {
        const base = await AccountService.GetWebBaseURL()
        await AppService.OpenURL(base + "/profile")
    }

    // Skipped the gate: offer a way back in.
    if (!user && skipped) return (
        <button onClick={() => setSkipped(false)} className="btn btn-ghost btn-sm gap-1 text-base-content/70">
            <LogIn size={15} /> {t("account.sign_in")}
        </button>
    )

    if (!user) return null

    return (
        <div className="dropdown dropdown-end">
            <button type="button" aria-label={user.name} className="btn btn-ghost btn-circle avatar">
                <div className="w-8 rounded-full ring-2 ring-base-300">
                    <img
                        src={user.image || "/appicon.png"}
                        alt={user.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/appicon.png" }}
                    />
                </div>
            </button>
            <ul tabIndex={0} className="menu dropdown-content bg-base-100 backdrop-blur-xl border border-base-300 rounded-xl z-52 mt-3 w-48 p-2 shadow-sm">
                <li className="menu-title truncate">{user.name}</li>
                <li>
                    <button onClick={openProfile} className="flex items-center gap-2">
                        <ExternalLink size={15} /> {t("account.profile")}
                    </button>
                </li>
                <li>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-error">
                        <LogOut size={15} /> {t("account.sign_out")}
                    </button>
                </li>
            </ul>
        </div>
    )
}
