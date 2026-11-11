import { BentoGrid } from "@/components/ui/magic/bento-grid";
import { MagicCard } from "@/components/ui/magic/magic-card";
import { SplitShowcase } from "@/components/ui/obsidian/split-showcase";
import { useNavigate } from "@tanstack/react-router";
import { AccountService } from '@bindings/cyrene-launcher/internal/account-service';
import { useEffect, useRef, useState } from 'react';
import { Play, Menu, FolderOpen, MessageCircleQuestionMark, Download, PowerOff } from 'lucide-react';
import { AppService } from '@bindings/cyrene-launcher/internal/app-service';
import { FSService } from '@bindings/cyrene-launcher/internal/fs-service';
import { March7thHoneyService } from '@bindings/cyrene-launcher/internal/march7thhoney-service';
import { toast } from 'react-toastify';
import path from 'path-browserify'
import useSettingStore, { DEFAULT_PATCH_URL, honeyChannelFromTarget, resolveServerBaseUrl, LOCAL_SERVER_URL, type HoneyServerChannel } from '@/stores/settingStore';
import useModalStore from '@/stores/modalStore';
import useLauncherStore from '@/stores/launcherStore';
import useAccountStore from '@/stores/accountStore';
import { motion } from 'motion/react';
import { Link } from '@tanstack/react-router';
import {
    CheckUpdateGenshinServer,
    CheckUpdateHoneyServer,
    CheckUpdateLauncher,
    GENSHIN_INJECTOR_PATH,
    GENSHIN_SERVER_MANIFEST,
    GENSHIN_SERVER_ROOT,
    honeyServerExe,
    sleep,
    UpdateGenshinServer,
    UpdateHoneyServer,
    UpdateLauncher,
} from '@/helper';
import UpdateModal from '@/components/updateModal';
import { BackgroundSelector } from '@/components/backgroudModal';
import NewsWidget from '@/components/newsWidget';
import { useTranslation } from 'react-i18next';

export default function LauncherPage() {
    const navigate = useNavigate();
    const {
        gamePath, setGamePath, setGameDir,
        genshinGamePath, genshinGameDir, genshinServerDir, genshinServerVersion,
        setGenshinGamePath, setGenshinGameDir, setGenshinServerDir,
        gameDir, background, gameProfile,
        serverTarget, patchTargetUrl, proxyPort, honeyTestServerVersion, honeyProdServerVersion,
        rsaPatch, rsaKey, webRedirect, webHosts,
    } = useSettingStore()
    const { user, setSkipped } = useAccountStore()
    const { t } = useTranslation()
    const [visibleBackground, setVisibleBackground] = useState(background)
    const [isBackgroundBlackout, setIsBackgroundBlackout] = useState(false)
    const currentBackgroundRef = useRef(background)
    const backgroundTimerRef = useRef<number | null>(null)
    const {
        isOpenDownloadDataModal, isOpenUpdateDataModal, isOpenSelfUpdateModal,
        isOpenHoneyDownloadModal, isOpenHoneyUpdateModal, honeyModalChannel, honeyModalVersion,
        setIsOpenDownloadDataModal, setIsOpenUpdateDataModal, setIsOpenSelfUpdateModal,
        setIsOpenHoneyDownloadModal, setIsOpenHoneyUpdateModal,
        openHoneyDownloadModal, openHoneyUpdateModal,
    } = useModalStore()
    const {
        isLoading, downloadType, serverReady, isDownloading,
        serverRunning, gameRunning, progressDownload, downloadSpeed,
        updateData, setLauncherVersion, setIsLoading, setDownloadType,
        setServerReady, setPatchReady, setIsDownloading,
        setServerRunning, setGameRunning, setUpdateData,
    } = useLauncherStore()
    const isGenshin = gameProfile === "genshin"
    const isStarRail = gameProfile === "starrail"
    const genshinServerRoot = genshinServerDir || GENSHIN_SERVER_ROOT
    const selectedHoneyChannel = honeyChannelFromTarget(serverTarget)
    const honeyServerVersionFor = (channel: HoneyServerChannel) => channel === "prod" ? honeyProdServerVersion : honeyTestServerVersion
    const honeyDirectoryFor = (channel: HoneyServerChannel) => channel === "prod" ? "server_prod" : "server"
    const honeyChannelLabel = (channel: HoneyServerChannel) => t(`setting.server_channel_${channel}`)

    useEffect(() => {
        if (background === currentBackgroundRef.current) return
        if (backgroundTimerRef.current) {
            window.clearTimeout(backgroundTimerRef.current)
        }
        setIsBackgroundBlackout(true)
        backgroundTimerRef.current = window.setTimeout(() => {
            currentBackgroundRef.current = background
            setVisibleBackground(background)
            backgroundTimerRef.current = window.setTimeout(() => {
                setIsBackgroundBlackout(false)
                backgroundTimerRef.current = null
            }, 60)
        }, 320)
        return () => {
            if (backgroundTimerRef.current) {
                window.clearTimeout(backgroundTimerRef.current)
                backgroundTimerRef.current = null
            }
        }
    }, [background])

    const widgetLinks = gameProfile === "starrail"
        ? [
            { tooltip: "Firefly SRAnalysis", href: "https://sranalysis.punklorde.org", img: "https://sranalysis.punklorde.org/ff-sranalysis.png" },
            { tooltip: "Firefly SRTools",    href: "https://srtools.punklorde.org",    img: "https://srtools.punklorde.org/ff-srtool.png" },
            { tooltip: "Amazing's SRTools", href: "https://srtools.neonteam.dev",      img: "https://icons.duckduckgo.com/ip3/srtools.neonteam.dev.ico" },
        ]
        : []

    const openExternal = async (url: string) => {
        try { await AppService.OpenURL(url) }
        catch { window.open(url, "_blank") }
    }

    // Check if the Genshin server package exists on disk; Star Rail only needs a game path.
    useEffect(() => {
        const check = async () => {
            if (isGenshin) {
                const serverRoot = genshinServerDir || GENSHIN_SERVER_ROOT
                const manifestPath = genshinServerDir ? `${serverRoot}/cyrene-manifest.json` : GENSHIN_SERVER_MANIFEST
                const injectorPath = genshinServerDir ? `${serverRoot}/native/bin/YsrpgInjector.exe` : GENSHIN_INJECTOR_PATH
                setServerReady(await FSService.FileExists(manifestPath) && await FSService.FileExists(injectorPath))
                setServerRunning(await FSService.IsGenshinServerRunning())
                setPatchReady(genshinGamePath !== "")
                return
            }
            setPatchReady(gamePath !== "")
        }
        check()
    }, [isGenshin, gamePath, genshinGamePath, genshinServerDir])

    // Startup: check launcher update, then server/proxy updates.
    useEffect(() => {
        const checkStartUp = async () => {
            const [_, version] = await AppService.GetCurrentLauncherVersion()
            setLauncherVersion(version)
            const launcherData = await CheckUpdateLauncher()
            if (launcherData.isUpdate) {
                setUpdateData({
                    server: { isUpdate: false, isExists: false, version: "" },
                    proxy: { isUpdate: false, isExists: false, version: "" },
                    patch: { isUpdate: false, isExists: false, version: "" },
                    launcher: launcherData,
                })
                setIsOpenSelfUpdateModal(true)
                return
            }

            if (isGenshin) {
                const existsGenshinGame = await FSService.FileExists(genshinGamePath)
                if (!existsGenshinGame) {
                    setGameRunning(false)
                    setGenshinGamePath("")
                    setGenshinGameDir("")
                }
                const serverRoot = genshinServerDir || GENSHIN_SERVER_ROOT
                const manifestPath = genshinServerDir ? `${serverRoot}/cyrene-manifest.json` : GENSHIN_SERVER_MANIFEST
                const injectorPath = genshinServerDir ? `${serverRoot}/native/bin/YsrpgInjector.exe` : GENSHIN_INJECTOR_PATH
                const existsGenshinServer = await FSService.FileExists(manifestPath) && await FSService.FileExists(injectorPath)
                let genshinServerData = {
                    isUpdate: false,
                    isExists: existsGenshinServer,
                    version: genshinServerVersion,
                }
                if (existsGenshinServer) {
                    if (!genshinServerDir) {
                        setGenshinServerDir(GENSHIN_SERVER_ROOT)
                    }
                    genshinServerData = await CheckUpdateGenshinServer(genshinServerVersion)
                }
                setUpdateData({
                    server: genshinServerData,
                    proxy:  { isUpdate: false, isExists: true, version: "" },
                    patch:  { isUpdate: false, isExists: true, version: "" },
                    launcher: launcherData,
                })
                setServerReady(genshinServerData.isExists)
                setServerRunning(await FSService.IsGenshinServerRunning())
                setPatchReady(genshinGamePath !== "")
                if (genshinServerData.isUpdate) {
                    setIsOpenUpdateDataModal(true)
                }
                return
            }

            const exitGame = await FSService.FileExists(gamePath)
            if (!exitGame) { setGameRunning(false); setGamePath(""); setGameDir("") }

            // Star Rail proxy mode: no asset to download or update check.
            setUpdateData({
                server: { isUpdate: false, isExists: true, version: "" },
                proxy:  { isUpdate: false, isExists: true, version: "" },
                patch:  { isUpdate: false, isExists: true, version: "" },
                launcher: launcherData,
            })
            setPatchReady(gamePath !== "")
        }
        checkStartUp()
    }, [isGenshin]);

    // Local server: prompt download if missing, otherwise auto-check for updates.
    useEffect(() => {
        if (isGenshin || !selectedHoneyChannel) return
        let cancelled = false
        ;(async () => {
            const exists = await FSService.FileExists(honeyServerExe(selectedHoneyChannel))
            if (cancelled) return
            if (!exists) { openHoneyDownloadModal(selectedHoneyChannel); return }
            const data = await CheckUpdateHoneyServer(selectedHoneyChannel, honeyServerVersionFor(selectedHoneyChannel))
            if (cancelled || !data.isUpdate) return
            setUpdateData({ ...useLauncherStore.getState().updateData, server: { isUpdate: true, isExists: true, version: data.version } })
            openHoneyUpdateModal(selectedHoneyChannel, data.version)
        })()
        return () => { cancelled = true }
    }, [serverTarget, gameProfile, honeyTestServerVersion, honeyProdServerVersion])

    const handlePickFile = async () => {
        try {
            setIsLoading(true)
            const basePath = await FSService.PickFile("exe")
            if (basePath.endsWith("StarRail.exe") || basePath.endsWith("launcher.exe")) {
                const normalized = basePath.replace(/\\/g, '/')
                const folderPath = path.dirname(normalized)
                const exists = await FSService.DirExists(`${folderPath}/StarRail_Data/StreamingAssets/DesignData/Windows`)
                if (!exists) { toast.error(t("home.error_game_dir")) }
                else { setGamePath(basePath); setGameDir(folderPath); toast.success(t("home.game_path_success")) }
            } else { toast.error(t("home.error_file_type")) }
        } catch (err: any) { toast.error(t("home.toast_pick_folder_error"), err) }
        finally { setIsLoading(false) }
    }

    const handlePickGenshinFile = async () => {
        try {
            setIsLoading(true)
            const folderPath = await FSService.PickFolder()
            if (!folderPath) return
            const normalized = folderPath.replace(/\\/g, '/')
            const gameExe = `${normalized}/YuanShen.exe`
            const gameDataDir = `${normalized}/YuanShen_Data`
            const exeExists = await FSService.FileExists(gameExe)
            const dataDirExists = await FSService.DirExists(gameDataDir)
            if (exeExists && dataDirExists) {
                setGenshinGamePath(gameExe)
                setGenshinGameDir(normalized)
                setPatchReady(true)
                toast.success(t("home.genshin_path_success"))
            } else { toast.error(t("home.error_genshin_file_type")) }
        } catch (err: any) { toast.error(t("home.toast_pick_folder_error"), err) }
        finally { setIsLoading(false) }
    }

    const handleStartGenshin = async () => {
        if (!genshinGamePath || gameRunning) return
        let startedServer = false
        try {
            setIsLoading(true)
            if (!serverRunning) {
                const [serverOk, serverErr] = await FSService.StartGenshinServer()
                if (!serverOk) { toast.error(t("home.toast_start_server_failed") + serverErr); return }
                setServerRunning(true)
                startedServer = true
                await sleep(1200)
                if (!useLauncherStore.getState().serverRunning) {
                    toast.error(t("home.toast_start_server_failed") + "server exited immediately")
                    return
                }
            }

            const [gameOk, gameErr] = await FSService.StartGenshinGame(genshinGamePath)
            if (!gameOk) {
                if (startedServer) {
                    await FSService.StopGenshinServer()
                    setServerRunning(false)
                }
                toast.error(t("home.toast_start_game_failed") + gameErr)
                return
            }
            setGameRunning(true)
        } catch (err: any) {
            toast.error(t("home.toast_start_game_error") + err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStopGenshinServer = async () => {
        if (!serverRunning) return
        try {
            const [ok, err] = await FSService.StopGenshinServer()
            if (!ok) { toast.error(t("home.toast_start_server_failed") + err); return }
            setServerRunning(false)
        } catch (err: any) {
            toast.error(t("home.toast_start_server_failed") + err)
        }
    }

    const handleStartGame = async () => {
        if (!gamePath || gameRunning) return
        try {
            setIsLoading(true)
            if (gamePath.endsWith("launcher.exe")) {
                toast.error(t("home.toast_march7th_needs_starrail"))
                return
            }

            let target = DEFAULT_PATCH_URL
            if (serverTarget === "custom") {
                target = patchTargetUrl || DEFAULT_PATCH_URL
            } else if (selectedHoneyChannel) {
                if (!user) {
                    toast.error(t("account.login_required"))
                    setSkipped(false)
                    return
                }
                const [sok, serr] = await March7thHoneyService.StartLocalServer(selectedHoneyChannel)
                if (!sok) {
                    if (serr === "server_not_found") { openHoneyDownloadModal(selectedHoneyChannel); return }
                    const msg =
                        serr === "not_logged_in" ? t("account.login_required") :
                        serr === "server_not_ready" ? t("home.toast_local_server_not_ready") :
                        t("home.toast_start_server_failed") + serr
                    toast.error(msg)
                    return
                }
                target = LOCAL_SERVER_URL
            }

            const [ok, err] = await March7thHoneyService.Start(gamePath, target, proxyPort, {
                rsaPatch, rsaKey, webRedirect, webHosts,
            })
            if (!ok) { toast.error(t("home.toast_start_game_failed") + err); return }
            setGameRunning(true)
        } catch (err: any) { toast.error(t("home.toast_start_game_error"), err) }
        finally { setIsLoading(false) }
    }

    const handleStartCurrentGame = async () => {
        if (isGenshin) {
            await handleStartGenshin()
            return
        }
        await handleStartGame()
    }

    const handlePickCurrentGameFile = async () => {
        if (isGenshin) {
            await handlePickGenshinFile()
            return
        }
        await handlePickFile()
    }

    const handleOpenServerFolder = async () => {
        if (!selectedHoneyChannel) {
            toast.error(t("home.toast_not_local_server_mode"))
            return
        }
        const [ok, err] = await March7thHoneyService.OpenLocalServerFolder(selectedHoneyChannel)
        if (ok) return
        const msg =
            err === "server_folder_missing" ? t("home.toast_server_folder_missing", { directory: honeyDirectoryFor(selectedHoneyChannel) }) :
            err === "server_folder_empty" ? t("home.toast_server_folder_empty", { directory: honeyDirectoryFor(selectedHoneyChannel) }) :
            t("home.toast_start_server_failed") + err
        toast.error(msg)
    }

    const handleOpenDownloadDataModal = async () => {
        if (isGenshin) {
            const serverData = await CheckUpdateGenshinServer(genshinServerVersion)
            if (!serverData.version) {
                toast.error("No Genshin server package was found in the GitHub release.")
                return
            }
            setUpdateData({
                ...updateData,
                server: serverData,
                proxy: { isUpdate: false, isExists: true, version: "" },
                patch: { isUpdate: false, isExists: true, version: "" },
            })
        }
        setIsOpenDownloadDataModal(true)
    }

    const handlerUpdateData = async () => {
        setIsDownloading(true)
        if (isGenshin) {
            try {
                let serverData = updateData.server
                if (!serverData.version) {
                    serverData = await CheckUpdateGenshinServer(genshinServerVersion)
                }
                if (!serverData.version) {
                    toast.error("No Genshin server package was found in the GitHub release.")
                    return
                }
                const ok = await UpdateGenshinServer(serverData.version)
                setServerReady(ok)
                if (ok) {
                    setUpdateData({
                        ...updateData,
                        server: { isUpdate: false, isExists: true, version: serverData.version },
                        proxy: { isUpdate: false, isExists: true, version: "" },
                        patch: { isUpdate: false, isExists: true, version: "" },
                    })
                }
            } catch (err: any) {
                toast.error("Genshin server package update failed: " + err)
            } finally {
                setDownloadType("")
                setIsDownloading(false)
            }
            return
        }
        if (updateData.launcher.isUpdate) {
            await UpdateLauncher(updateData.launcher.version)
            setUpdateData({ ...updateData, launcher: { isUpdate: false, isExists: true, version: updateData.launcher.version } })
            setIsOpenSelfUpdateModal(true)
        }
        setDownloadType(""); setIsDownloading(false)
    }

    const handleHoneyServer = async (channel: HoneyServerChannel, requestedVersion = "") => {
        setIsDownloading(true)
        try {
            let version = requestedVersion
            if (!version) { version = (await CheckUpdateHoneyServer(channel, honeyServerVersionFor(channel))).version }
            if (!version) { toast.error(t("setting.honey_server_none", { channel: honeyChannelLabel(channel) })); return }
            const ok = await UpdateHoneyServer(version, channel)
            if (ok) setUpdateData({ ...updateData, server: { isUpdate: false, isExists: true, version } })
        } catch (err: any) {
            toast.error(t("home.toast_honey_update_failed", { channel: honeyChannelLabel(channel), error: String(err) }))
        } finally {
            setDownloadType(""); setIsDownloading(false)
        }
    }

    useEffect(() => {
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpenDownloadDataModal(false)
                setIsOpenUpdateDataModal(false)
                setIsOpenSelfUpdateModal(false)
                setIsOpenHoneyDownloadModal(false)
                setIsOpenHoneyUpdateModal(false)
            }
        }
        window.addEventListener('keydown', handleEscKey)
        return () => window.removeEventListener('keydown', handleEscKey)
    }, [isOpenDownloadDataModal, isOpenUpdateDataModal, isOpenSelfUpdateModal]);

    return (
        <div className="bassaps-home bassaps-page">
            <header className="bassaps-page-heading">
                <div><h1>ライブラリ</h1><p>ゲームの起動と接続設定</p></div>
                <BackgroundSelector />
            </header>
            <BentoGrid className="bassaps-library-grid">
                <MagicCard className="bassaps-game-card" aria-label="選択中のゲーム">
                    <div className={`bassaps-game-cover ${isBackgroundBlackout ? 'is-changing' : ''}`}>
                        <img src={visibleBackground === "bg-17.jpg" ? "/bg-17-1200.webp" : visibleBackground} srcSet={visibleBackground === "bg-17.jpg" ? "/bg-17-640.webp 640w, /bg-17-1200.webp 1200w" : undefined} sizes="(max-width: 760px) 100vw, 70vw" alt="" width={1200} height={600} fetchPriority="high" onError={e => { e.currentTarget.removeAttribute("srcset"); if (!e.currentTarget.src.endsWith("/bg-17.jpg")) e.currentTarget.src = "/bg-17.jpg"; }} />
                        <div className="bassaps-game-cover-label"><span>{isGenshin ? 'GENSHIN IMPACT' : 'HONKAI: STAR RAIL'}</span><h2>{isGenshin ? '原神' : '崩壊：スターレイル'}</h2></div>
                    </div>
                    <div className="bassaps-game-footer">
                        <div className="bassaps-game-state" role="status"><span className={`bassaps-status-dot ${gameRunning ? 'is-running' : ''}`} /><div><strong>{gameRunning ? 'ゲーム起動中' : (isGenshin ? genshinGamePath : gamePath) ? '起動できます' : 'ゲームファイルを選択'}</strong><small>{isGenshin ? 'ローカルサーバー' : 'BASSAPS Launcher'}</small></div></div>
            {/* Bottom action bar */}
            <div className="bassaps-launch-actions flex items-center gap-2">
                <div className="dropdown dropdown-top dropdown-end">
                    <motion.button
                        type="button"
                        aria-label="Game actions"
                        className="btn btn-circle btn-md bg-base-100 backdrop-blur-md border border-base-300 hover:bg-base-300 text-base-content cursor-pointer shadow-sm "
                    >
                        <Menu className="w-5 h-5" />
                    </motion.button>
                    <ul tabIndex={0} className="dropdown-content menu bg-base-100 backdrop-blur-xl border border-base-300 rounded-lg z-20 w-52 p-2 shadow-sm  mb-2">
                        <li>
                            <button onClick={handlePickCurrentGameFile}>
                                {isGenshin ? t("home.menu_change_genshin_path") : t("home.menu_change_path")}
                            </button>
                        </li>
                        {isStarRail && (
                            <>
                                <li><button disabled={!gameDir} onClick={() => gameDir && FSService.OpenFolder(gameDir + "/StarRail_Data/Persistent/Audio/AudioPackage/Windows")}>{t("home.menu_open_voice")}</button></li>
                                <li><button onClick={handleOpenServerFolder}>{t("home.menu_open_server")}</button></li>
                            </>
                        )}
                        {isGenshin && (
                            <>
                                <li><button disabled={!serverReady} onClick={() => serverReady && FSService.OpenFolder(genshinServerRoot)}>{t("home.menu_open_genshin_server")}</button></li>
                                <li><button disabled={!serverReady} onClick={() => serverReady && FSService.OpenFolder(`${genshinServerRoot}/data`)}>{t("home.menu_open_genshin_logs")}</button></li>
                                <li><button disabled={!genshinGameDir} onClick={() => genshinGameDir && FSService.OpenFolder(genshinGameDir)}>{t("home.menu_open_genshin_folder")}</button></li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Primary action button */}
                {isDownloading ? (
                    <button
                        disabled
                        className="btn btn-lg font-bold btn-primary border-none shadow-sm  cursor-not-allowed"
                    >
                        <Play className="w-5 h-5" />
                        {t("home.status_wait")}
                    </button>
                ) : isGenshin ? (
                    !serverReady ? (
                        <motion.button
                            className="btn btn-lg font-bold btn-primary border-none shadow-sm "
                            onClick={handleOpenDownloadDataModal}
                        >
                            <Download className="w-5 h-5" />
                            {t("home.btn_download")}
                        </motion.button>
                    ) : serverRunning ? (
                        <motion.button
                            className="btn btn-lg font-bold btn-error border-none shadow-sm "
                            onClick={handleStopGenshinServer}
                            title={t("home.tip_close_genshin_server")}
                            aria-label={t("home.tip_close_genshin_server")}
                        >
                            <PowerOff className="w-5 h-5" />
                            {t("home.btn_close_server")}
                        </motion.button>
                    ) : genshinGamePath === "" ? (
                        <motion.button
                            className="btn btn-lg font-bold btn-primary border-none shadow-sm "
                            onClick={handlePickGenshinFile}
                        >
                            <FolderOpen className="w-5 h-5" />
                            {isLoading ? t("home.btn_selecting") : t("home.btn_select_genshin")}
                        </motion.button>
                    ) : (
                        <motion.button
                            className="btn btn-lg font-bold btn-primary border-none shadow-sm "
                            disabled={isLoading || gameRunning}
                            onClick={handleStartCurrentGame}
                        >
                            <Play className="w-5 h-5" />
                            {isLoading ? t("home.btn_selecting") : gameRunning ? t("home.btn_game_running") : t("home.btn_start_genshin")}
                        </motion.button>
                    )
                ) : gamePath === "" ? (
                    <motion.button
                        className="btn btn-lg font-bold btn-primary border-none shadow-sm "
                        disabled={isLoading}
                        onClick={handlePickCurrentGameFile}
                    >
                        <FolderOpen className="w-5 h-5" />
                        {isLoading ? t("home.btn_selecting") : t("home.btn_select_game")}
                    </motion.button>
                ) : (
                    <motion.button
                        className="btn btn-lg font-bold btn-primary border-none shadow-sm "
                        disabled={isLoading || gameRunning}
                            onClick={handleStartCurrentGame}
                    >
                        <Play className="w-5 h-5" />
                        {isLoading ? t("home.btn_selecting") : gameRunning ? t("home.btn_game_running") : t("home.btn_start_game")}
                    </motion.button>
                )}
            </div>

                    </div>
                </MagicCard>
                <aside className="bassaps-library-side">
                    <section className="bassaps-panel bassaps-connection-panel">
                        <div className="bassaps-panel-heading"><h2>接続先</h2><button className="bassaps-text-button" onClick={() => useModalStore.getState().setIsOpenSettingModal(true)}>変更</button></div>
                        <span className="bassaps-badge">{isGenshin ? 'ローカル' : selectedHoneyChannel ? 'ローカル' : serverTarget === 'custom' ? 'カスタム' : 'BASSAPS'}</span>
                        <p className="bassaps-server-address">{isGenshin ? 'GENSHIN / LOCAL' : resolveServerBaseUrl(serverTarget, patchTargetUrl)}</p>
                        <div className="bassaps-detail-row"><span>アカウント</span><strong>{user?.name || '未ログイン'}</strong></div>
                    </section>
                    <section className="bassaps-panel bassaps-path-panel">
                        <h2>ゲームファイル</h2>
                        <p className="bassaps-file-path" title={isGenshin ? genshinGamePath : gamePath}>{(isGenshin ? genshinGamePath : gamePath) || 'まだ設定されていません'}</p>
                        <button className="btn btn-sm btn-outline" disabled={isLoading || gameRunning} onClick={handlePickCurrentGameFile}><FolderOpen size={14} />ファイルを選択</button>
                    </section>
                    <Link to="/howto" className="bassaps-guide-link"><MessageCircleQuestionMark size={17} /><span>セットアップガイド</span><span aria-hidden="true">↗</span></Link>
                </aside>
            </BentoGrid>
            {isStarRail && <div className="bassaps-home-secondary"><NewsWidget /><section className="bassaps-tools-panel"><h2>関連ツール</h2>{widgetLinks.map(link => <button key={link.href} onClick={() => openExternal(link.href)}>{link.tooltip}<span aria-hidden="true">↗</span></button>)}</section></div>}

            <SplitShowcase compact className="bassaps-split-showcase" items={[
                { id: 'guide', title: <h2 className="font-semibold">セットアップガイド</h2>, description: 'ゲームの選択、接続設定、困ったときの確認手順。', href: '/howto', target: '_self', onClick: event => { event.preventDefault(); void navigate({ to: '/howto' }); } },
                { id: 'account', title: <h2 className="font-semibold">アカウント登録</h2>, description: '登録サイトを開きます。既存のアカウントも引き続き利用できます。', href: '#account-registration', target: '_self', onClick: event => { event.preventDefault(); void AccountService.GetWebBaseURL().then(base => openExternal(base + '/register')).catch(() => toast.error('登録サイトを開けませんでした。')); } },
            ]} />
            {/* Download progress */}
            {isDownloading && !updateData.launcher.isUpdate && (isGenshin || (isStarRail && selectedHoneyChannel)) && (
                <div className="bassaps-progress-panel fixed bottom-6 left-1/2 -translate-x-1/2 z-10 w-[55vw] bg-base-100 backdrop-blur-xl border border-base-300 rounded-lg p-4 shadow-sm ">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-base-content/65">{downloadType}</span>
                            <div className="flex gap-3">
                                <span className="text-base-content/80 font-semibold">{downloadSpeed}</span>
                                <span className="text-base-content font-bold">{progressDownload.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="relative w-full bg-base-300 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                                className="h-full bg-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressDownload}%` }}
                                transition={{ type: "tween", ease: "linear", duration: 0.03 }}
                            />
                            <motion.div
                                className="absolute inset-0 bg-primary"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                            />
                        </div>
                        <p className="text-center text-xs text-base-content/60">
                            {progressDownload < 100 ? t("home.status_wait") : t("home.status_complete")}
                        </p>
                    </div>
                </div>
            )}

            {isDownloading && updateData.launcher.isUpdate && (
                <div className="bassaps-progress-panel fixed bottom-6 left-1/2 -translate-x-1/2 z-10 w-[55vw] bg-base-100 backdrop-blur-xl border border-base-300 rounded-lg p-4 shadow-sm  text-center">
                    {["update:launcher:downloading", "update:launcher:success", "update:launcher:failed"].includes(downloadType) && (
                        <span className={`font-bold text-xl ${
                            downloadType === "update:launcher:downloading" ? "text-warning" :
                            downloadType === "update:launcher:success"    ? "text-success" : "text-error"
                        }`}>
                            {downloadType === "update:launcher:downloading" && t("home.status_updating_launcher")}
                            {downloadType === "update:launcher:success"    && t("home.status_update_success")}
                            {downloadType === "update:launcher:failed"     && t("home.status_update_failed")}
                        </span>
                    )}
                </div>
            )}

            {/* Modals */}
            <UpdateModal
                isOpen={isOpenUpdateDataModal}
                onClose={() => setIsOpenUpdateDataModal(false)}
                title={isGenshin ? t("home.modal_genshin_update_title") : t("home.modal_update_title")}
                message={isGenshin ? t("home.modal_genshin_update_msg") : t("home.modal_update_msg")}
                buttons={[
                    { text: t("home.btn_no"),  onClick: () => setIsOpenUpdateDataModal(false), variant: "outline" },
                    { text: t("home.btn_yes"), onClick: async () => { setIsOpenUpdateDataModal(false); await handlerUpdateData() }, variant: "primary" }
                ]}
            />
            <UpdateModal
                isOpen={isOpenDownloadDataModal}
                onClose={() => setIsOpenDownloadDataModal(false)}
                title={isGenshin ? t("home.modal_genshin_download_title") : t("home.modal_download_title")}
                message={isGenshin ? t("home.modal_genshin_download_msg") : t("home.modal_download_msg")}
                buttons={[
                    { text: t("home.btn_download"), onClick: async () => { setIsOpenDownloadDataModal(false); await handlerUpdateData() }, variant: "primary" }
                ]}
            />
            <UpdateModal
                isOpen={isOpenSelfUpdateModal}
                onClose={() => setIsOpenSelfUpdateModal(false)}
                title={t("home.modal_self_update_title")}
                message={t("home.modal_self_update_msg")}
                buttons={[
                    { text: t("home.btn_no"),  onClick: () => setIsOpenSelfUpdateModal(false), variant: "outline" },
                    { text: t("home.btn_yes"), onClick: async () => { setIsOpenSelfUpdateModal(false); await handlerUpdateData() }, variant: "primary" }
                ]}
            />
            <UpdateModal
                isOpen={isOpenHoneyDownloadModal}
                onClose={() => setIsOpenHoneyDownloadModal(false)}
                title={t("home.modal_honey_download_title", { channel: honeyChannelLabel(honeyModalChannel) })}
                message={t("home.modal_honey_download_msg", { channel: honeyChannelLabel(honeyModalChannel) })}
                buttons={[
                    { text: t("home.btn_no"),       onClick: () => setIsOpenHoneyDownloadModal(false), variant: "outline" },
                    { text: t("home.btn_download"), onClick: async () => { setIsOpenHoneyDownloadModal(false); await handleHoneyServer(honeyModalChannel, honeyModalVersion) }, variant: "primary" }
                ]}
            />
            <UpdateModal
                isOpen={isOpenHoneyUpdateModal}
                onClose={() => setIsOpenHoneyUpdateModal(false)}
                title={t("home.modal_honey_update_title", { channel: honeyChannelLabel(honeyModalChannel) })}
                message={t("home.modal_honey_update_msg", { channel: honeyChannelLabel(honeyModalChannel) })}
                buttons={[
                    { text: t("home.btn_no"),  onClick: () => setIsOpenHoneyUpdateModal(false), variant: "outline" },
                    { text: t("home.btn_yes"), onClick: async () => { setIsOpenHoneyUpdateModal(false); await handleHoneyServer(honeyModalChannel, honeyModalVersion) }, variant: "primary" }
                ]}
            />
        </div>
    )
}
