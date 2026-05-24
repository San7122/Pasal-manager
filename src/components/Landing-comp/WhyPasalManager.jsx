import React from 'react';
import { Mic, QrCode, Languages, MessageCircle, WifiOff, Lock, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Mic,
    accent: 'from-[#7c3aed] to-[#a855f7]',
    bg: 'bg-[#ede9fe]',
    iconColor: 'text-[#7c3aed]',
    title: 'Voice Entry',
    badge: 'Just Speak',
    description: 'Say "500 cash sale, milk powder" and it auto-records. Works in Hindi, English & Nepali.',
    highlight: '"500 cash sale, kurti"',
  },
  {
    icon: QrCode,
    accent: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50',
    iconColor: 'text-green-600',
    title: 'QR Payment Collection',
    badge: '🇮🇳 🇳🇵 Both',
    description: 'Generate instant QR codes for any amount. Customer scans → you get paid → auto-recorded.',
    highlight: 'UPI · eSewa · Khalti · Fonepay',
  },
  {
    icon: Languages,
    accent: 'from-[#1e1147] to-[#7c3aed]',
    bg: 'bg-[#f5f3ff]',
    iconColor: 'text-[#5b21b6]',
    title: 'India & Nepal Ready',
    badge: '🇮🇳 🇳🇵 Bilingual',
    description: 'English, हिंदी, नेपाली UI. ₹ Rupee + रू NPR currencies. BS Calendar built-in.',
    highlight: 'GPay · PhonePe · Paytm · IME Pay',
  },
  {
    icon: MessageCircle,
    accent: 'from-[#25D366] to-green-600',
    bg: 'bg-green-50',
    iconColor: 'text-[#25D366]',
    title: 'WhatsApp PDF Bills',
    badge: '1-Tap Share',
    description: 'Generate clean A5 PDF receipts and send via WhatsApp — customer gets a real bill, not text.',
    highlight: 'PDF · Print · Share',
  },
  {
    icon: WifiOff,
    accent: 'from-orange-500 to-red-500',
    bg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    title: 'Works Offline',
    badge: 'No Internet',
    description: 'Add sales, track stock, generate bills — all without internet. Auto-syncs when online.',
    highlight: '100% offline-ready',
  },
  {
    icon: Lock,
    accent: 'from-slate-700 to-slate-900',
    bg: 'bg-slate-50',
    iconColor: 'text-slate-700',
    title: 'Bank-Level Privacy',
    badge: 'Local-First',
    description: 'Your shop data stays on your phone. PIN-lock, biometric unlock, no cloud surveillance.',
    highlight: 'Your data · Your control',
  },
];

const WhyPasalManager = () => {
  return (
    <div className="py-14 px-5 sm:py-20 sm:px-6 lg:py-24 bg-[#1e1147] relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #a78bfa 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#7c3aed]/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#a78bfa]/15 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold mb-4 border border-white/20">
            <Sparkles size={14} /> Why Pasal Manager
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-tighter mb-3 leading-[1.05]">
            Built for shops,<br/>
            <span className="bg-gradient-to-r from-[#a855f7] to-[#c4b5fd] bg-clip-text text-transparent">
              not generic businesses.
            </span>
          </h2>
          <p className="text-lg text-[#c4b5fd] font-medium max-w-2xl mx-auto">
            Features designed specifically for Indian & Nepali shopkeepers.
            No corporate fluff — just what your shop actually needs.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Icon + Badge */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-14 h-14 ${f.bg} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon size={26} className={f.iconColor} strokeWidth={2.2} />
                  </div>
                  <span className="text-xs font-bold bg-white/10 text-white/80 px-2.5 py-1 rounded-full border border-white/10">
                    {f.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                  {f.title}
                </h3>

                {/* Description */}
                <p className="text-[#c4b5fd] leading-relaxed mb-4 text-sm">
                  {f.description}
                </p>

                {/* Highlight chip */}
                <div className={`inline-block px-3 py-1.5 rounded-lg bg-gradient-to-r ${f.accent} text-white text-xs font-bold shadow-md`}>
                  {f.highlight}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <a
            href="/app.html"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1e1147] rounded-2xl font-bold text-base hover:bg-[#ede9fe] hover:shadow-2xl transition-all active:scale-95"
          >
            Try all features free →
          </a>
          <p className="text-[#c4b5fd] text-sm mt-4 font-medium">
            No credit card · No signup · Works on any phone or laptop
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhyPasalManager;
