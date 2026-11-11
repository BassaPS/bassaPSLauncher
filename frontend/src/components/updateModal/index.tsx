import ModalFrame from "../modalFrame";
import { motion } from "motion/react"

interface UpdateModalProps {
    isOpen: boolean
    title: string
    message: string
    buttons: {
      text: string
      onClick: () => Promise<void> | void
      variant?: "primary" | "error" | "outline"
    }[]
    onClose: () => void
  }

export default function UpdateModal({ isOpen, title, message, buttons, onClose }: UpdateModalProps) {
  if (!isOpen) return null

  return (
    <ModalFrame open={isOpen} onClose={onClose} label={title}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="relative w-[90%] max-w-lg bg-base-100 backdrop-blur-xl text-base-content rounded-lg border border-base-300 shadow-sm "
      >
        <motion.button
          transition={{ duration: 0.2 }}
          className="btn btn-circle btn-sm bg-base-200 hover:bg-base-300 border border-base-300 text-base-content/80 absolute right-3 top-3"
          onClick={onClose}
        >
          ✕
        </motion.button>

        <div className="border-b border-base-300 px-6 py-4 mb-4">
          <h3 className="font-bold text-lg text-base-content">
            {title}
          </h3>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-6">
            <p className="text-base-content/70 text-base">{message}</p>
          </div>

          <div className="flex justify-end gap-3">
            {buttons.map((btn, idx) => (
              <motion.button
                key={idx}
                className={`btn ${
                  btn.variant === "primary"
                    ? "btn-primary border-none shadow-sm "
                    : btn.variant === "error"
                    ? "bg-base-100 hover:bg-error/10 border border-error/30 text-error"
                    : "bg-base-100 hover:bg-base-300 border border-base-300 text-base-content/80"
                }`}
                onClick={btn.onClick}
              >
                {btn.text}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </ModalFrame>
  )
}
