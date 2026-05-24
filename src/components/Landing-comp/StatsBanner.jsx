import React from 'react';
import { Store, Banknote, Layers, Globe } from 'lucide-react';

const stats = [
  { icon: Store,    value: '5,000+', label: 'Shops trust us', color: 'text-[#7c3aed]' },
  { icon: Banknote, value: '₹50Cr+', label: 'Tracked monthly', color: 'text-green-600' },
  { icon: Layers,   value: '12',     label: 'Powerful features', color: 'text-orange-600' },
  { icon: Globe,    value: '3',      label: 'Languages supported', color: 'text-blue-600' },
];

const StatsBanner = () => (
  <div className="py-16 px-6 bg-white border-y border-gray-100">
    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-50 mb-3">
              <Icon size={22} className={s.color} />
            </div>
            <div className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter">{s.value}</div>
            <div className="text-sm text-gray-500 font-medium mt-1">{s.label}</div>
          </div>
        );
      })}
    </div>
  </div>
);

export default StatsBanner;
