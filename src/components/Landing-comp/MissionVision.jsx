import React from 'react';
import { Flame, Zap, TrendingUp, Shield } from "lucide-react";

const PhoneMockup = ({ src, alt, width = 280 }) => (
  <div className="relative mx-auto" style={{ width: `${width}px` }}>
    <div className="relative bg-[#1e1147] rounded-[44px] p-3 shadow-2xl">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1e1147] rounded-b-2xl z-10 flex items-center justify-center">
        <div className="w-12 h-1.5 bg-black rounded-full"></div>
      </div>
      <div className="bg-white rounded-[34px] overflow-hidden aspect-[9/19]">
        <img src={src} alt={alt} className="w-full h-full object-cover object-top" />
      </div>
    </div>
    <div className="absolute -inset-x-4 -bottom-6 h-12 bg-[#7c3aed]/30 blur-2xl rounded-full -z-10"></div>
  </div>
);

const MissionVision = () => {
    return (
        <div className="py-32 px-6 overflow-hidden bg-gradient-to-b from-white via-[#faf5ff] to-white">
            <div className="max-w-7xl mx-auto space-y-40">

                {/* ───────────────── OUR MISSION ───────────────── */}
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Phone mockups stacked */}
                    <div className="relative order-2 lg:order-1 flex justify-center items-center min-h-[600px]">
                        {/* Decorative blob */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/15 via-[#a78bfa]/10 to-transparent rounded-[40px] blur-3xl -z-10"></div>

                        {/* Front phone */}
                        <div className="relative z-20">
                            <PhoneMockup
                                src="/tool-screens/mobile/today.png"
                                alt="Today's Sales Dashboard"
                                width={280}
                            />
                        </div>

                        {/* Back phone — slightly rotated and offset */}
                        <div className="absolute right-0 top-12 z-10 transform rotate-[8deg] opacity-90 hidden md:block">
                            <PhoneMockup
                                src="/tool-screens/mobile/udhaar.png"
                                alt="Udhaar Tracking"
                                width={240}
                            />
                        </div>

                        {/* Back phone — left side */}
                        <div className="absolute left-0 bottom-8 z-10 transform -rotate-[8deg] opacity-90 hidden md:block">
                            <PhoneMockup
                                src="/tool-screens/mobile/stock.png"
                                alt="Stock Management"
                                width={240}
                            />
                        </div>

                        {/* Floating stat badges */}
                        <div className="absolute -top-2 right-4 lg:right-12 bg-white px-4 py-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2.5 transform rotate-3 z-30">
                            <div className="w-9 h-9 bg-[#ede9fe] rounded-xl flex items-center justify-center">
                                <Zap size={18} className="text-[#7c3aed]" fill="currentColor" />
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Speed</div>
                                <div className="text-sm font-black text-gray-900">3 sec entry</div>
                            </div>
                        </div>

                        <div className="absolute -bottom-2 left-4 lg:left-12 bg-[#1e1147] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 transform -rotate-2 z-30">
                            <Flame size={18} className="text-orange-400" />
                            <div>
                                <div className="text-[10px] opacity-70 font-semibold uppercase tracking-wide">Trusted by</div>
                                <div className="text-sm font-black">5,000+ shops</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Copy */}
                    <div className="order-1 lg:order-2 space-y-6">
                        <div className="inline-flex items-center gap-2 bg-[#ede9fe] text-[#5b21b6] px-4 py-2 rounded-full text-sm font-bold">
                            <Shield size={14} /> Our Mission
                        </div>
                        <h2 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-[1.05]">
                            Operate like a pro,<br/>
                            <span className="text-[#7c3aed]">run beyond limits.</span>
                        </h2>
                        <p className="text-lg text-gray-600 leading-relaxed font-medium max-w-xl">
                            Empowering modern shop owners with smarter tools to manage sales,
                            inventory, credit, and growth — all in one powerful platform, right in your pocket.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <a href="/app.html" className="inline-flex items-center gap-2 px-8 py-4 bg-[#7c3aed] text-white rounded-2xl font-bold text-base hover:bg-[#5b21b6] hover:shadow-2xl hover:shadow-[#7c3aed]/30 transition-all active:scale-95">
                                Start selling smarter →
                            </a>
                            <a href="/app.html" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-2xl font-bold text-base hover:border-gray-400 transition-all">
                                See it live
                            </a>
                        </div>
                    </div>
                </div>

                {/* ───────────────── OUR VISION ───────────────── */}
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Copy */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 bg-[#ede9fe] text-[#5b21b6] px-4 py-2 rounded-full text-sm font-bold">
                            <TrendingUp size={14} /> Our Vision
                        </div>
                        <h2 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-[1.05]">
                            Every shop deserves<br/>
                            <span className="text-[#7c3aed]">a digital katha.</span>
                        </h2>
                        <p className="text-lg text-gray-600 leading-relaxed font-medium max-w-xl">
                            We envision a world where every small shopkeeper has professional tools
                            right on their phone — making shop management simple, transparent, and data-driven.
                        </p>

                        {/* Mini feature list */}
                        <ul className="space-y-3 pt-2">
                            {[
                                'Works offline — no internet needed',
                                'Free forever for individual shops',
                                'Available in English, Hindi & Nepali',
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-700">
                                    <span className="w-5 h-5 rounded-full bg-[#7c3aed] flex items-center justify-center flex-shrink-0">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    </span>
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right: Phone mockup with floating screenshot */}
                    <div className="relative flex justify-center items-center min-h-[600px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/15 via-[#7c3aed]/10 to-transparent rounded-[40px] blur-3xl -z-10"></div>

                        {/* Main phone */}
                        <div className="relative z-20 transform rotate-[2deg]">
                            <PhoneMockup
                                src="/tool-screens/mobile/bill.png"
                                alt="Digital Bill Creation"
                                width={290}
                            />
                        </div>

                        {/* Secondary phone behind */}
                        <div className="absolute left-2 top-20 z-10 transform -rotate-[6deg] opacity-85 hidden md:block">
                            <PhoneMockup
                                src="/tool-screens/mobile/pl.png"
                                alt="P&L Reports"
                                width={230}
                            />
                        </div>

                        {/* Floating growth badge */}
                        <div className="absolute -top-2 -right-2 lg:right-8 bg-white px-4 py-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2.5 transform rotate-3 z-30">
                            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                                <TrendingUp size={18} className="text-green-600" />
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Growth</div>
                                <div className="text-sm font-black text-gray-900">+34% this month</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MissionVision;
