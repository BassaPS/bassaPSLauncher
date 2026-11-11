import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export default function HowToPage() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
            <div className="w-full bg-base-100 shadow-sm rounded-lg p-8 space-y-8">
                <div className="flex flex-col items-center gap-3">
                    <h1 className="text-xl font-bold text-base-content text-center">{t("howto.title")}</h1>
                </div>

                {/* ── Section 1: General features ── */}
                <div className="bg-success/10 border-l-4 border-success/30 p-6 rounded-r-lg">
                    <h2 className="text-lg font-bold text-success flex items-center gap-2 mb-4">
                        <span>🚀</span>
                        <span>{t("howto.sect1_title")}</span>
                    </h2>
                    <div className="space-y-3 text-success">
                        <div className="flex items-start gap-3">
                            <div className="text-success text-lg">🎮</div>
                            <p>{t("howto.sect1_launch_game")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-success text-lg">🌐</div>
                            <p>{t("howto.sect1_lang_pre")} <Link to="/language" className="link link-info font-mono">{t("howto.sect1_lang_link")}</Link></p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-success text-2xl">📦</div>
                            <div>
                                <p className="text-success font-semibold">{t("howto.sect1_patch_title")}</p>
                                <p className="text-success">
                                    {t("howto.sect1_patch_desc_1_pre")} <Link to="/diff" className="link link-info font-mono">{t("howto.sect1_patch_desc_1_link")}</Link> {t("howto.sect1_patch_desc_1_post")}
                                </p>
                                <p className="text-success mt-1">
                                    {t("howto.sect1_patch_desc_2_pre")} <span className="font-semibold">Hdiff</span>, <span className="font-semibold">Ldiff</span>{t("howto.sect1_patch_desc_2_post")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section 2: March7thHoney proxy guide ── */}
                <div className="bg-base-200 border-l-4 border-base-300 p-6 rounded-r-lg">
                    <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-4">
                        <span>🛡️</span>
                        <span>{t("howto.m7h_title")}</span>
                    </h2>

                    <p className="text-base-content mb-6">{t("howto.m7h_desc")}</p>

                    {/* Setup steps */}
                    <div className="bg-base-100 border border-base-300 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-base-content mb-3">📋 {t("howto.m7h_steps_title")}</h3>
                        <ol className="space-y-2 text-base-content text-sm list-none">
                            {[
                                t("howto.m7h_step1"),
                                t("howto.m7h_step2"),
                                t("howto.m7h_step3"),
                                t("howto.m7h_step4"),
                            ].map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-base-200 text-base-content/80 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Proxy feature list */}
                    <div className="bg-base-100 border border-base-300 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-base-content mb-3">⚙️ {t("howto.m7h_proxy_title")}</h3>
                        <ul className="space-y-2 text-base-content text-sm">
                            {[
                                { icon: "🔐", text: t("howto.m7h_proxy_ca") },
                                { icon: "🔑", text: t("howto.m7h_proxy_rsa") },
                                { icon: "🔗", text: t("howto.m7h_proxy_url") },
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span>{item.icon}</span>
                                    <span>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2 text-sm text-warning">
                            <span>⚠️</span>
                            <span>{t("howto.m7h_note_admin")}</span>
                        </div>
                        <div className="bg-base-200 border border-base-300 rounded-lg p-3 flex items-start gap-2 text-sm text-base-content">
                            <span>💡</span>
                            <span>{t("howto.m7h_note_antivirus")}</span>
                        </div>
                    </div>
                </div>

                {/* ── Section 3: Other notes ── */}
                <div className="bg-base-200 border-l-4 border-base-300 p-6 rounded-r-lg">
                    <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-4">
                        <span>📌</span>
                        <span>{t("howto.sect3_title")}</span>
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-warning text-xl">⚠️</div>
                                <div>
                                    <h3 className="font-semibold text-warning mb-1">{t("howto.sect3_admin_title")}</h3>
                                    <p className="text-warning">{t("howto.sect3_admin_desc")}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="text-center pt-4">
                    <Link to="/" className="btn btn-primary btn-wide">{t("howto.btn_back")}</Link>
                </div>
            </div>
        </div>
    );
}
