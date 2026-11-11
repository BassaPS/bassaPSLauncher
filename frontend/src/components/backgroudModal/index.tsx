import ModalFrame from "../modalFrame";

import { useEffect, useState, useRef } from 'react'
import { X, Image as ImageIcon, Plus, Upload, Check } from 'lucide-react'
import useSettingStore from '@/stores/settingStore'
import Cropper from 'react-easy-crop'
import getCroppedImg from '@/utils/cropImage'
import { useTranslation } from 'react-i18next'
import { toast } from "react-toastify"
import { motion } from 'motion/react'

const GENSHIN_BACKGROUND = "bg-columbina.jpg"
const SHOW_GENSHIN_PROFILE = false

const initialImages = {
  "bg-columbina": "bg-columbina.jpg",
  "bg-17": "bg-17.jpg",
  "bg-11": "bg-11.jpeg",
  "bg-1": "bg-1.jpeg",
  "bg-2": "bg-2.png",
  "bg-3": "bg-3.png",
  "bg-6": "bg-6.png",
  "bg-7": "bg-7.jpeg",
  "bg-8": "bg-8.png",
  "bg-9": "bg-9.jpeg",
  "bg-10": "bg-10.jpg",
  "bg-12": "bg-12.jpg",
  "bg-13": "bg-13.jpg",
  "bg-16": "bg-16.jpg",
}

export const BackgroundSelector = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [croppingImage, setCroppingImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const {
    background, setBackground,
    starRailBackground, setStarRailBackground,
    gameProfile, setGameProfile,
    extraBackgrounds, setExtraBackgrounds,
  } = useSettingStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  const handleSelect = (img: string) => {
    setIsOpen(false)
    setBackground(img)
    if (gameProfile === "starrail") {
      setStarRailBackground(img)
    }
  }

  const handleGameSelect = (profile: "genshin" | "starrail") => {
    setGameProfile(profile)
    if (profile === "genshin") {
      setBackground(GENSHIN_BACKGROUND)
      return
    }
    setBackground(starRailBackground || "bg-17.jpg")
  }

  useEffect(() => {
    if (SHOW_GENSHIN_PROFILE || gameProfile !== "genshin") return
    setGameProfile("starrail")
    setBackground(starRailBackground || "bg-17.jpg")
  }, [gameProfile, setBackground, setGameProfile, starRailBackground])

  const isImageUrl = (url: string) => {
    return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url)
  }
  const handleAddUrl = () => {
    const url = newUrl.trim()
    if (!url) {
      return
    }

    if (!isImageUrl(url)) {
      toast.error(t("background.invalid_url"))
      return
    }

    setCroppingImage(url)
    setNewUrl('')
  }

  const handleRemoveExtra = (url: string) => {
    setExtraBackgrounds(extraBackgrounds.filter(bg => bg !== url))
  }

  const handleUploadFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setCroppingImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async () => {
    if (!croppingImage || !croppedAreaPixels) return
    const croppedBase64 = await getCroppedImg(croppingImage, croppedAreaPixels)
    setExtraBackgrounds([croppedBase64, ...extraBackgrounds])
    setCroppingImage(null)
  }

  const allBackgrounds = [...extraBackgrounds, ...Object.values(initialImages)]

  return (
    <div className="bassaps-background-controls flex items-center justify-end gap-2">
      <div className="flex items-center gap-2">
        {([
          ...(SHOW_GENSHIN_PROFILE ? [{ id: "genshin" as const, icon: "game-genshin.png", label: t("home.game_profile_genshin") }] : []),
          { id: "starrail", icon: "game-starrail.png", label: t("home.game_profile_starrail") },
        ] as const).map((game) => {
          const isActive = gameProfile === game.id
          return (
            <div key={game.id} className="tooltip tooltip-right" data-tip={game.label}>
              <motion.button
                type="button"
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                onClick={() => handleGameSelect(game.id)}
                className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 bg-base-100 backdrop-blur-md shadow-sm  transition-all duration-200 ${
                  isActive
                    ? "border-base-300 ring-2 ring-base-300"
                    : "border-base-300 hover:border-base-300"
                }`}
                aria-label={game.label}
              >
                <img
                  src={game.icon}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                  draggable={false}
                />
              </motion.button>
            </div>
          )
        })}
      </div>

      <div className="tooltip tooltip-right" data-tip={t("background.select_bg")}>
        <button
          aria-label={t("background.select_bg")}
          className="btn btn-ghost btn-circle border border-base-300"
          onClick={() => setIsOpen(true)}
        >
          <ImageIcon size={22} className="transition-all duration-300 group-hover:rotate-6 group-hover:scale-110" />
        </button>
      </div>

      {isOpen && (
        <ModalFrame open={isOpen} onClose={() => setIsOpen(false)} label={t("background.choose_bg")}>
          <div className="bg-base-100 backdrop-blur-xl text-base-content rounded-lg shadow-sm  border border-base-300 p-6 w-[90%] max-w-2xl relative">
            <button className="btn btn-ghost btn-circle absolute top-3 right-3" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-4">{t("background.choose_bg")}</h2>

            {/* Add via URL */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder={t("background.paste_url")}
                className="input input-bordered w-full text-info"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <button className="btn btn-success flex items-center gap-1" onClick={handleAddUrl}>
                <Plus size={16} /> {t("background.add")}
              </button>
            </div>

            {/* Upload from computer */}
            <div className="flex mb-4">
              <button
                className="btn btn-warning flex items-center gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} /> {t("background.upload_from_computer")}
              </button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUploadFile(file)
                  e.target.value = ''
                }}
              />
            </div>

            {/* Crop Modal */}
            {(croppingImage != null && croppingImage != "") && (
              <div className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-black/70 p-4">
                <div className="relative w-full max-w-5xl h-150 bg-base-200 rounded-lg">
                  <Cropper
                    image={croppingImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={16 / 9}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                  />
                  <button
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 btn btn-success"
                    onClick={handleCropComplete}
                  >
                    <Check size={20} /> {t("background.done")}
                  </button>
                  <button
                    className="absolute top-2 right-2 btn btn-ghost btn-circle"
                    onClick={() => setCroppingImage(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {allBackgrounds.map((value, i) => {
                const isExtra = i < extraBackgrounds.length
                return (
                  <div
                    key={i}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${value === background ? 'border-base-300 shadow-sm ' : 'border-transparent hover:border-base-300'
                      }`}
                    onClick={() => handleSelect(value)}
                  >
                    <img src={value} alt={`bg-${i}`} loading="lazy" className="w-full h-28 object-cover" />
                    {isExtra && (
                      <button
                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveExtra(value)
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </ModalFrame>
      )}
    </div>
  )
}
