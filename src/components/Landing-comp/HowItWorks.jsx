import React from 'react';
import { UserPlus, Package2, TrendingUp, ArrowRight, Rocket } from 'lucide-react';

const steps = [
  {
    n: '01',
    icon: UserPlus,
    title: 'Sign up free',
    description: 'No credit card. Start as guest with just your shop name. Takes 10 seconds.',
  },
  {
    n: '02',
    icon: Package2,
    title: 'Add your stock',
    description: 'Add items with name, qty & price. Auto-generates barcodes you can print.',
  },
  {
    n: '03',
    icon: TrendingUp,
    title: 'Start selling',
    description: 'Record sales in 3 seconds. Track udhaar, send bills via WhatsApp.',
  },
];

const HowItWorks = () => (
  <div className="py-14 px-5 sm:py-20 sm:px-6 lg:py-24 bg-gradient-to-b from-[#faf5ff] to-white">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-[#ede9fe] text-[#5b21b6] px-4 py-2 rounded-full text-sm font-bold mb-4">
          <Rocket size={14} /> Get started in 3 steps
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-gray-900 tracking-tighter mb-3">
          From zero to <span className="text-[#7c3aed]">selling smarter</span>
        </h2>
        <p className="text-lg text-gray-500 font-medium">Under 2 minutes. No tutorials needed.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 relative">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 -right-4 z-10">
                  <ArrowRight size={28} className="text-[#c4b5fd]" strokeWidth={2.5} />
                </div>
              )}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 h-full hover:border-[#7c3aed] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-5xl font-black text-[#7c3aed] opacity-30 leading-none">{s.n}</div>
                  <div className="w-14 h-14 bg-[#ede9fe] rounded-2xl flex items-center justify-center ml-auto">
                    <Icon size={26} className="text-[#7c3aed]" strokeWidth={2.2} />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">{s.title}</h3>
                <p className="text-gray-600 leading-relaxed">{s.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <a
          href="/app.html"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#7c3aed] text-white rounded-2xl font-bold text-base hover:bg-[#5b21b6] hover:shadow-2xl hover:shadow-[#7c3aed]/30 transition-all active:scale-95"
        >
          Start your free account →
        </a>
      </div>
    </div>
  </div>
);

export default HowItWorks;
