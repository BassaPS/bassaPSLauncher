import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export default function AnalysisPage() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
            <div className="w-full bg-base-100 shadow-sm rounded-lg p-8 space-y-8">
                <h1 className="text-xl font-bold text-base-content text-center">
                    {t("analysis.title")}
                </h1>

                <div className="bg-success/10 border-l-4 border-success/30 p-6 rounded-r-lg">
                    <h2 className="text-lg font-bold text-success flex items-center gap-2 mb-4">
                        <span>🔬</span>
                        <span>{t("analysis.sect1_title")}</span>
                    </h2>
                    
                    <div className="space-y-4 text-success">
                        <div className="flex items-start gap-3">
                            <div className="text-success text-lg">⚡</div>
                            <div>
                                <p className="mb-2">
                                    <span className="font-semibold text-success">{t("analysis.sect1_p1_pre")}</span>
                                    {t("analysis.sect1_p1_mid")}
                                    <span className="text-info font-mono bg-base-200 px-2 py-1 rounded">{t("analysis.sect1_p1_highlight")}</span>
                                    {t("analysis.sect1_p1_post")}
                                </p>
                                <p className="text-sm">{t("analysis.sect1_p2")}</p>
                            </div>
                        </div>
                        
                        <div className="bg-base-100 border border-success/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-success text-lg">📁</span>
                                <span className="font-semibold text-success">{t("analysis.sect1_github")}</span>
                            </div>
                            <a
                                href="https://github.com/hessiser/veritas"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-info font-mono break-all"
                            >
                                https://github.com/hessiser/veritas
                            </a>
                        </div>
                    </div>
                </div>

                <div className="bg-base-200 border-l-4 border-base-300 p-6 rounded-r-lg">
                    <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-4">
                        <span>🌐</span>
                        <span>{t("analysis.sect2_title")}</span>
                    </h2>
                    
                    <div className="space-y-4">
                        <p className="text-base-content">
                            {t("analysis.sect2_desc")}
                        </p>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-base-content/80 text-lg">🏆</span>
                                    <span className="font-semibold text-base-content">{t("analysis.sect2_master")}</span>
                                </div>
                                <a
                                    href="https://sranalysis.punklorde.org"
                                    className="link link-accent font-mono text-sm break-all"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    https://sranalysis.punklorde.org
                                </a>
                            </div>
                            
                            <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-base-content/80 text-lg">🔄</span>
                                    <span className="font-semibold text-base-content">{t("analysis.sect2_backup")}</span>
                                </div>
                                <a
                                    href="https://firefly-sranalysis.vercel.app/"
                                    className="link link-accent font-mono text-sm break-all"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    https://firefly-sranalysis.vercel.app
                                </a>
                            </div>
                        </div>
                        
                        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <div className="text-warning text-lg">💡</div>
                                <p className="text-warning text-sm">
                                    <strong>{t("analysis.sect2_tip_pre")}</strong>{t("analysis.sect2_tip_post")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-error/10 border-l-4 border-error/30 p-6 rounded-r-lg">
                    <h2 className="text-lg font-bold text-error flex items-center gap-2 mb-4">
                        <span>⚠️</span>
                        <span>{t("analysis.sect3_title")}</span>
                    </h2>
                    
                    <div className="bg-base-100 border border-error/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-error text-xl">📋</div>
                            <div>
                                <h3 className="font-semibold text-error mb-2">{t("analysis.sect3_subtitle")}</h3>
                                <p className="text-error mb-2">
                                    {t("analysis.sect3_desc")}
                                </p>
                                <div className="bg-error/10 p-3 rounded-lg">
                                    <p className="text-error font-mono text-sm">
                                        {t("analysis.sect3_rename")}<code className="bg-error/10 px-1 py-0.5 rounded">veritas.dll</code> → <code className="bg-error/10 px-1 py-0.5 rounded">astrolabe.dll</code>
                                    </p>
                                    <p className="text-error text-sm mt-1">
                                        {t("analysis.sect3_place")}<code className="bg-error/10 px-1 py-0.5 rounded">astrolabe.dll</code>{t("analysis.sect3_place_post")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-base-200 border-l-4 border-base-300 p-6 rounded-r-lg">
                    <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-4">
                        <span>🛠️</span>
                        <span>{t("analysis.sect4_title")}</span>
                    </h2>
                    
                    <div className="space-y-6">
                        <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                            <h3 className="font-semibold text-base-content mb-3 flex items-center gap-2">
                                <span className="text-base-content/80">🚀</span>
                                <span>{t("analysis.sect4_sub1")}</span>
                            </h3>
                            <div className="space-y-2 text-base-content">
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-base-content/80">1.</span>
                                    <p>{t("analysis.sect4_sub1_step1_pre")}<span className="font-semibold">{t("analysis.sect4_sub1_step1_game")}</span>{t("analysis.sect4_sub1_step1_mid")}<span className="font-semibold">{t("analysis.sect4_sub1_step1_server")}</span>{t("analysis.sect4_sub1_step1_post")}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-base-content/80">2.</span>
                                    <p>{t("analysis.sect4_sub1_step2")}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-base-content/80">3.</span>
                                    <p>{t("analysis.sect4_sub1_step3_pre")}<strong>{t("analysis.sect4_sub1_step3_conn")}</strong>{t("analysis.sect4_sub1_step3_mid1")}<strong>{t("analysis.sect4_sub1_step3_type")}</strong>{t("analysis.sect4_sub1_step3_mid2")}<strong>{t("analysis.sect4_sub1_step3_btn")}</strong>{t("analysis.sect4_sub1_step3_post")}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-base-content/80">4.</span>
                                    <p>{t("analysis.sect4_sub1_step4")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                            <h3 className="font-semibold text-base-content mb-3 flex items-center gap-2">
                                <span className="text-base-content/80">🌐</span>
                                <span>{t("analysis.sect4_sub2")}</span>
                            </h3>
                            <div className="space-y-2 text-base-content">
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-base-content/80">1.</span>
                                    <p>{t("analysis.sect4_sub2_step1_pre")}<span className="font-semibold">{t("analysis.sect4_sub2_step1_game")}</span>{t("analysis.sect4_sub2_step1_mid")}<span className="font-semibold">{t("analysis.sect4_sub2_step1_server")}</span>{t("analysis.sect4_sub2_step1_post")}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-base-content/80">2.</span>
                                    <p>{t("analysis.sect4_sub2_step2")}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-base-content/80">3.</span>
                                    <p>{t("analysis.sect4_sub2_step3_pre")}<strong>{t("analysis.sect4_sub2_step3_conn")}</strong>{t("analysis.sect4_sub2_step3_mid1")}<strong>{t("analysis.sect4_sub2_step3_type")}</strong>{t("analysis.sect4_sub2_step3_mid2")}<strong>{t("analysis.sect4_sub2_step3_btn")}</strong>{t("analysis.sect4_sub2_step3_post")}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-5 text-base-content/80">4.</span>
                                    <p>{t("analysis.sect4_sub2_step4")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-6">
                    <Link to="/" className="btn btn-primary btn-wide">{t("analysis.btn_back")}</Link>
                </div>
            </div>
        </div>
    );
}