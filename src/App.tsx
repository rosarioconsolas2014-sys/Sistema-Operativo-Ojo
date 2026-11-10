import React, { useState } from 'react';
import { OSProvider, useOS } from './context/OSContext';
import { Desktop } from './components/Desktop/Desktop';
import { WindowManager } from './components/WindowManager/WindowManager';
import { Taskbar } from './components/Taskbar/Taskbar';
import { LockScreen } from './components/System/LockScreen';
import { PowerOverlay } from './components/System/PowerOverlay';
import { NotificationToast } from './components/System/NotificationToast';
import { AuthModal } from './components/System/AuthModal';

function DesktopSimulatorContent() {
  const { currentUser, authLoading, isAuthModalOpen, closeAuthModal } = useOS();
  const [guestDismissed, setGuestDismissed] = useState(false);

  // Show AuthModal if user is not authenticated and hasn't dismissed, or if explicitly opened
  const showAuth = (!currentUser && !guestDismissed && !authLoading) || isAuthModalOpen;

  return (
    <div className="relative h-screen w-screen overflow-hidden select-none bg-slate-900 font-sans">
      {/* Windows 11 Desktop Layer */}
      <Desktop />

      {/* Windows Floating Window Manager Layer */}
      <WindowManager />

      {/* Windows 11 Taskbar & System Tray */}
      <Taskbar />

      {/* Toast Notifications */}
      <NotificationToast />

      {/* System Lock Screen (when locked) */}
      <LockScreen />

      {/* System Power States (restarting, sleep, shutdown) */}
      <PowerOverlay />

      {/* Firebase Authentication Modal */}
      {showAuth && (
        <AuthModal
          onSuccess={() => {
            setGuestDismissed(true);
            closeAuthModal();
          }}
          onContinueAsGuest={() => {
            setGuestDismissed(true);
            closeAuthModal();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <OSProvider>
      <DesktopSimulatorContent />
    </OSProvider>
  );
}
