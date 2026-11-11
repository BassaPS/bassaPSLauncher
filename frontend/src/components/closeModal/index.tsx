import ModalFrame from "../modalFrame";
import { motion } from "motion/react"
import { AppService } from "@bindings/cyrene-launcher/internal/app-service"
import { toast } from "react-toastify"
import useSettingStore from "@/stores/settingStore"
import { useTranslation } from "react-i18next"

export default function CloseModal({
    isOpen,
    onClose
}: {
    isOpen: boolean
    onClose: () => void
}) {

    const { closingOption, setClosingOption } = useSettingStore()
    const { t } = useTranslation()

    return (
        <ModalFrame open={isOpen} onClose={onClose} label={t("close.title")}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="relative w-[90%] max-w-md bg-base-100 backdrop-blur-xl text-base-content rounded-lg border border-base-300 shadow-sm "
            >
                <div className="border-b border-base-300 px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-xl text-base-content">
                        {t("close.title")}
                    </h3>
                    <motion.button
                        transition={{ duration: 0.2 }}
                        className="btn btn-circle btn-sm bg-base-200 hover:bg-base-300 border border-base-300 text-base-content/80"
                        onClick={onClose}
                    >
                        ✕
                    </motion.button>
                </div>

                <div className="px-6 pt-4 pb-6 space-y-4">
                    <p className="text-base text-base-content/70">
                        {t("close.description")}
                    </p>

                    <div className="flex items-center gap-2">
                        <input
                            id="dontAskAgain"
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={!closingOption.isAsk}
                            onChange={(e) => setClosingOption({ isMinimize: closingOption.isMinimize, isAsk: !e.target.checked })}
                        />
                        <label htmlFor="dontAskAgain" className="text-sm text-base-content/70 cursor-pointer">
                            {t("close.dont_ask")}
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                            className="btn btn-primary border-none shadow-sm   transition-shadow"
                            onClick={async () => {
                                onClose()
                                const [success, message] = await AppService.HideApp()
                                if (!success) toast.error(message)
                                if (!closingOption.isAsk) {
                                    setClosingOption({ isMinimize: true, isAsk: false })
                                }
                            }}
                        >
                            {t("close.minimize")}
                        </button>
                        <button
                            className="btn bg-base-100 hover:bg-error/10 border border-error/30 text-error hover:text-error hover:border-error/30 transition-all"
                            onClick={async () => {
                                onClose()
                                const [success, message] = await AppService.CloseApp()
                                if (!success) toast.error(message)
                                if (!closingOption.isAsk) {
                                    setClosingOption({ isMinimize: false, isAsk: false })
                                }
                            }}
                        >
                            {t("close.close")}
                        </button>
                    </div>
                </div>
            </motion.div>
        </ModalFrame>
    )
}
