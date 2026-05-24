import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'Is Pasal Manager really free?',
    a: 'Yes — 100% free forever for individual shops. No credit card needed. We make it free because we believe every small shopkeeper deserves professional tools.',
  },
  {
    q: 'Do I need an internet connection?',
    a: 'No! Pasal Manager works completely offline. You can add sales, track stock, and generate bills without any internet. Data syncs automatically when you go online.',
  },
  {
    q: 'Is my shop data safe and private?',
    a: 'Yes. Your data is stored locally on your device first. We use PIN lock, biometric unlock, and bank-level encryption. We never sell your data — ever.',
  },
  {
    q: 'Does it work in my language?',
    a: 'Pasal Manager supports English, Hindi (हिंदी), and Nepali (नेपाली). Switch anytime from Settings. Voice entry works in all three too.',
  },
  {
    q: 'What payment apps does it support?',
    a: '🇮🇳 India: Generate UPI QR codes for PhonePe, GPay, Paytm, and any UPI app. 🇳🇵 Nepal: Generate QR codes for eSewa, Khalti, Fonepay, and IME Pay. Plus send bills as PDF via WhatsApp with one tap.',
  },
  {
    q: 'What if I have multiple shops?',
    a: 'Pasal Manager supports multi-branch mode. Switch between shop locations easily, each with its own sales, stock, and reports.',
  },
];

const FAQ = () => {
  const [open, setOpen] = useState(0);
  return (
    <div className="py-14 px-5 sm:py-20 sm:px-6 lg:py-24 bg-gradient-to-b from-white to-[#faf5ff]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#ede9fe] text-[#5b21b6] px-4 py-2 rounded-full text-sm font-bold mb-4">
            <HelpCircle size={14} /> FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-gray-900 tracking-tighter mb-3">
            Questions? <span className="text-[#7c3aed]">We've got answers.</span>
          </h2>
          <p className="text-lg text-gray-500 font-medium">Everything you need to know before getting started</p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                  isOpen ? 'border-[#7c3aed] shadow-lg' : 'border-gray-200'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left"
                >
                  <span className="font-bold text-gray-900 text-lg">{f.q}</span>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isOpen ? 'bg-[#7c3aed] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <p className="text-gray-500 mb-4">Still have questions?</p>
          <a
            href="/app.html"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#7c3aed] text-white rounded-2xl font-bold text-base hover:bg-[#5b21b6] hover:shadow-2xl hover:shadow-[#7c3aed]/30 transition-all active:scale-95"
          >
            Try it free now →
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
