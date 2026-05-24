import React, { useState, useEffect } from 'react';
import { Download, X, Share2, Plus, AlertTriangle } from 'lucide-react';

/**
 * Smart Install Button — handles PWA install across platforms:
 *  - Android/Chrome → triggers native install prompt
 *  - iOS Safari    → shows "Add to Home Screen" instructions
 *  - iOS Chrome    → warns user to switch to Safari
 *  - Already installed → hides itself
 */
const InstallButton = ({ variant = 'primary', className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSChrome, setIsIOSChrome] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const iOSChrome = iOS && /CriOS/.test(ua); // Chrome on iOS
    setIsIOS(iOS);
    setIsIOSChrome(iOSChrome);

    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => setIsInstalled(true);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleClick = async () => {
    if (isIOS) {
      setShowGuide(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setDeferredPrompt(null);
    } else {
      setShowGuide(true);
    }
  };

  if (isInstalled) return null;

  const baseStyles = variant === 'primary'
    ? 'bg-[#7c3aed] text-white hover:bg-[#5b21b6] shadow-lg shadow-[#7c3aed]/30'
    : 'bg-white text-[#1e1147] hover:bg-gray-50 border-2 border-white';

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 ${baseStyles} ${className}`}
      >
        <Download size={16} />
        Install App
      </button>

      {/* Install Guide Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
              aria-label="Close"
            >
              <X size={18} className="text-gray-600" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#ede9fe] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Download size={28} className="text-[#7c3aed]" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">Install Pasal Manager</h3>
              <p className="text-sm text-gray-500">Add to home screen for app-like experience</p>
            </div>

            {/* iOS Chrome warning — they cannot install at all */}
            {isIOSChrome && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-4">
                <div className="flex gap-3 items-start">
                  <AlertTriangle size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <div className="font-bold mb-1">⚠️ Chrome on iPhone can't install apps</div>
                    <div className="text-amber-800">Please open this page in <strong>Safari</strong> instead, then try Install again.</div>
                    <button
                      onClick={() => { window.location.href = 'x-safari-' + window.location.href; }}
                      className="mt-2 text-amber-700 underline font-semibold"
                    >
                      Try to open in Safari →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isIOS && !isIOSChrome && (
              <div>
                <div className="bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-2xl p-5 border border-[#ddd6fe] mb-3">
                  <div className="font-bold text-[#5b21b6] mb-4 flex items-center gap-2 text-sm">
                    🍎 SAFARI ON IPHONE / IPAD
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3 items-start">
                      <span className="w-8 h-8 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-black text-sm flex-shrink-0">1</span>
                      <div className="flex-1 pt-1">
                        <div className="text-sm text-gray-800 mb-2">Tap the <strong>Share button</strong> at the bottom of Safari</div>
                        <div className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                          <Share2 size={18} className="text-[#007AFF]" />
                          <span className="text-xs font-semibold text-gray-700">Share button</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <span className="w-8 h-8 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-black text-sm flex-shrink-0">2</span>
                      <div className="flex-1 pt-1">
                        <div className="text-sm text-gray-800 mb-2">Scroll down and tap <strong>"Add to Home Screen"</strong></div>
                        <div className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                          <Plus size={18} className="text-[#007AFF]" strokeWidth={2.5} />
                          <span className="text-xs font-semibold text-gray-700">Add to Home Screen</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <span className="w-8 h-8 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-black text-sm flex-shrink-0">3</span>
                      <div className="flex-1 pt-1">
                        <div className="text-sm text-gray-800 mb-2">Tap <strong>"Add"</strong> in the top right</div>
                        <div className="inline-flex items-center gap-2 bg-[#007AFF] px-4 py-2 rounded-lg shadow-sm">
                          <span className="text-xs font-bold text-white">Add</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex gap-2 items-center">
                  <span className="text-lg">✅</span>
                  <p className="text-xs text-green-800 font-medium">App icon appears on your home screen instantly!</p>
                </div>
              </div>
            )}

            {!isIOS && (
              <div className="bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-2xl p-5 border border-[#ddd6fe]">
                <div className="font-bold text-[#5b21b6] mb-4 text-sm">📱 ON YOUR DEVICE</div>
                <ol className="space-y-3 text-sm text-gray-800">
                  <li className="flex gap-3 items-start">
                    <span className="w-7 h-7 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                    <span>Tap the <strong>⋮ menu</strong> in your browser</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="w-7 h-7 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                    <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="w-7 h-7 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                    <span>Tap <strong>Install</strong> — done! ✅</span>
                  </li>
                </ol>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="w-full mt-5 bg-[#7c3aed] hover:bg-[#5b21b6] text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </>
  );
};

export default InstallButton;
