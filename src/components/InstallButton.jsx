import React, { useState, useEffect } from 'react';
import { Download, X, Share2, Plus } from 'lucide-react';

/**
 * Smart Install Button — handles PWA install across platforms:
 *  - Android/Chrome → triggers native install prompt
 *  - iOS Safari    → shows "Add to Home Screen" instructions
 *  - Already installed → hides itself
 */
const InstallButton = ({ variant = 'primary', className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Detect if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    // Capture Android install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detect when user actually installs
    const installedHandler = () => setIsInstalled(true);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setDeferredPrompt(null);
    } else {
      // Fallback: show generic instructions
      setShowIOSGuide(true);
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

      {/* iOS / Fallback Install Guide Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#ede9fe] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Download size={28} className="text-[#7c3aed]" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">Install Pasal Manager</h3>
              <p className="text-sm text-gray-500">Add to your home screen for app-like experience</p>
            </div>

            {isIOS ? (
              <div className="space-y-4">
                <div className="bg-[#f5f3ff] rounded-2xl p-4 border border-[#ede9fe]">
                  <div className="font-bold text-[#5b21b6] mb-3 flex items-center gap-2">
                    🍎 On iPhone / iPad (Safari)
                  </div>
                  <ol className="space-y-3 text-sm text-gray-700">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                      <span>Tap the <strong className="inline-flex items-center gap-1"><Share2 size={14} className="text-[#7c3aed]" /> Share</strong> button at the bottom of Safari</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                      <span>Scroll down and tap <strong className="inline-flex items-center gap-1"><Plus size={14} className="text-[#7c3aed]" /> Add to Home Screen</strong></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                      <span>Tap <strong>Add</strong> in the top right corner</span>
                    </li>
                  </ol>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  ⚠️ Make sure you're using <strong>Safari</strong>, not Chrome on iPhone
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#f5f3ff] rounded-2xl p-4 border border-[#ede9fe]">
                  <div className="font-bold text-[#5b21b6] mb-3">📱 To install this app:</div>
                  <ol className="space-y-3 text-sm text-gray-700">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                      <span>Tap the <strong>⋮ menu</strong> in your browser (top-right)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                      <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                      <span>Tap <strong>Install</strong> — done! ✅</span>
                    </li>
                  </ol>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  💡 Tip: Works best in Chrome, Edge, or Safari
                </p>
              </div>
            )}

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-5 bg-[#7c3aed] hover:bg-[#5b21b6] text-white font-bold py-3 rounded-xl transition-all"
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
