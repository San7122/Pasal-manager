import React from 'react';
import { Smartphone } from 'lucide-react';

const PaymentApps = () => (
  <div className="py-14 px-6 bg-white border-b border-gray-100">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-gray-500 font-semibold text-sm uppercase tracking-wide">
          <Smartphone size={16} className="text-[#7c3aed]" />
          One QR · All Payment Apps · India & Nepal
        </div>
      </div>

      {/* App badges grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">

        {/* India apps */}
        {[
          { name: 'GPay',     emoji: '🇮🇳', bg: 'bg-blue-50',    color: 'text-blue-700',    sub: 'India' },
          { name: 'PhonePe',  emoji: '🇮🇳', bg: 'bg-[#ede9fe]',  color: 'text-[#5b21b6]',   sub: 'India' },
          { name: 'Paytm',    emoji: '🇮🇳', bg: 'bg-sky-50',     color: 'text-sky-700',     sub: 'India' },
          { name: 'BHIM UPI', emoji: '🇮🇳', bg: 'bg-orange-50',  color: 'text-orange-700',  sub: 'India' },
          { name: 'eSewa',    emoji: '🇳🇵', bg: 'bg-green-50',   color: 'text-green-700',   sub: 'Nepal' },
          { name: 'Khalti',   emoji: '🇳🇵', bg: 'bg-[#ede9fe]',  color: 'text-[#5b21b6]',   sub: 'Nepal' },
          { name: 'Fonepay',  emoji: '🇳🇵', bg: 'bg-red-50',     color: 'text-red-700',     sub: 'Nepal' },
        ].map((app, i) => (
          <div
            key={i}
            className={`${app.bg} rounded-2xl p-4 text-center hover:scale-105 transition-transform cursor-default`}
          >
            <div className="text-2xl mb-1">{app.emoji}</div>
            <div className={`font-black text-sm ${app.color}`}>{app.name}</div>
            <div className="text-xs text-gray-500 font-semibold mt-0.5 uppercase tracking-wide">{app.sub}</div>
          </div>
        ))}
      </div>

      <div className="text-center mt-6 text-sm text-gray-500 font-medium">
        Plus Cash, Card, and any local payment method — record everything in one place
      </div>
    </div>
  </div>
);

export default PaymentApps;
