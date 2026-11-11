import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { ToastContainer } from 'react-toastify'
import { useGlobalEvents } from '@/hooks';
import useModalStore from '@/stores/modalStore';;
import SettingModal from '@/components/settingModal';
import CloseModal from '@/components/closeModal';
import Header from '@/components/header';
import LoginGate from '@/components/loginGate';
import { MotionConfig } from 'motion/react'
import { BlurFade } from '@/components/ui/magic/blur-fade'
import { useTheme } from '@/hooks/useTheme'

export const Route = createRootRoute({
    component: RootLayout
})

function RootLayout() {
    const { setIsOpenCloseModal, isOpenCloseModal, isOpenSettingModal, setIsOpenSettingModal } = useModalStore()
    const location = useLocation()

    useTheme();
    useGlobalEvents();

    return (
        <MotionConfig reducedMotion="user">
            <a className="bassaps-skip-link" href="#main-content">本文へスキップ</a>
            <Header />

            <div className="bassaps-content min-h-[78vh]" id="main-content" role="main" tabIndex={-1}>
                <BlurFade key={location.pathname} duration={0.28} offset={0} blur="2px"><Outlet /></BlurFade>
            </div>

            <CloseModal isOpen={isOpenCloseModal} onClose={() => setIsOpenCloseModal(false)} />
            <SettingModal isOpen={isOpenSettingModal} onClose={() => setIsOpenSettingModal(false)} />
            <LoginGate />
            <ToastContainer />
        </MotionConfig>
    )
}
