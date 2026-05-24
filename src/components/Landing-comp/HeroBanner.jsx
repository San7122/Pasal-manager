import React from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';

const HeroBanner = () => {
    const { t } = useLanguage();
    return (
        <div className="relative w-full min-h-[600px] lg:h-[80vh] overflow-hidden bg-black flex items-center">

            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2071"
                    alt="Team Collaboration"
                    className="w-full h-full object-cover"
                />
                {/* The "Aurora" Gradient Overlay: Deep blue to vibrant purple/pink */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#1e1147]/90 via-[#5b21b6]/70 to-transparent"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center">

                {/* Left Side: Content */}
                <div className="text-white">
                    {/* Rating Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 mb-8">
                        <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} fill="currentColor" />
                            ))}
                        </div>
                        <span className="text-xs font-bold tracking-wide uppercase">{t('trustedByShopkeepers')}</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
                        <span><span className="text-amber-300">S</span>mart <span className="text-amber-300">B</span>usiness</span>
                        <br />
                        <span><span className="text-amber-300">S</span>tart <span className="text-amber-300">H</span>ere</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-blue-50 font-medium max-w-md leading-relaxed mb-10 opacity-90">
                        Complete shop management in your pocket.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <a href="/app.html" className="px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl active:scale-95">
                            {t('getStarted')}
                        </a>
                    </div>
                </div>

                {/* Right Side: Floating Dashboard Preview */}
                {/* Right Side: Floating Dashboard Preview */}
                <div className="hidden lg:flex justify-end relative">
                    <div className="relative group">
                        {/* Main "Glass" Card */}
                        <div className="w-[500px] bg-white/90 backdrop-blur-2xl rounded-[32px] p-8 shadow-2xl border border-white/50 transform rotate-3 transition-transform duration-500 group-hover:rotate-0">

                            {/* Header Info */}
                            <div className="flex items-center gap-4 mb-8">
                                <img src="/logo-icon.svg" alt="Pasal Manager" className="w-14 h-14 rounded-2xl shadow-lg" />

                                <div>
                                    <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">Shop Status</h4>
                                    <p className="text-gray-500 font-bold text-sm italic">"Today's sales dashboard..."</p>
                                </div>
                            </div>

                            {/* Grid of 6: Value Metrics */}
                            <div className="grid grid-cols-2 gap-4">

                                {/* Metric 1 */}
                                <div className="p-4 bg-[#f5f3ff] rounded-[24px] border border-[#ede9fe] flex flex-col justify-center transform hover:scale-105 transition-transform cursor-default">
                                    <span className="text-[10px] font-black text-[#a78bfa] uppercase tracking-widest mb-1">Sales</span>
                                    <h5 className="text-lg font-black text-gray-900 leading-none">Daily Entry</h5>
                                    <p className="text-[10px] text-[#5b21b6] font-bold mt-2">3 seconds</p>
                                </div>

                                {/* Metric 2 */}
                                <div className="p-4 bg-blue-50 rounded-[24px] border border-blue-100 flex flex-col justify-center transform hover:scale-105 transition-transform cursor-default">
                                    <span className="text-[10px] font-black text-[#a78bfa] uppercase tracking-widest mb-1">Credit</span>
                                    <h5 className="text-lg font-black text-gray-900 leading-none">Udhaar Book</h5>
                                    <p className="text-[10px] text-[#5b21b6] font-bold mt-2">Never lose track</p>
                                </div>

                                {/* Metric 3 */}
                                <div className="p-4 bg-emerald-50 rounded-[24px] border border-emerald-100 flex flex-col justify-center transform hover:scale-105 transition-transform cursor-default">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Inventory</span>
                                    <h5 className="text-lg font-black text-gray-900 leading-none">Stock Manager</h5>
                                    <p className="text-[10px] text-emerald-600 font-bold mt-2">Low-stock alerts</p>
                                </div>

                                {/* Metric 4 */}
                                <div className="p-4 bg-orange-50 rounded-[24px] border border-[#f5f3ff] flex flex-col justify-center transform hover:scale-105 transition-transform cursor-default">
                                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Expenses</span>
                                    <h5 className="text-lg font-black text-gray-900 leading-none">Track Costs</h5>
                                    <p className="text-[10px] text-orange-600 font-bold mt-2">Categorized</p>
                                </div>

                                {/* Metric 5 */}
                                <div className="p-4 bg-[#f5f3ff] rounded-[24px] border border-[#ede9fe] flex flex-col justify-center transform hover:scale-105 transition-transform cursor-default">
                                    <span className="text-[10px] font-black text-[#a78bfa] uppercase tracking-widest mb-1">Reports</span>
                                    <h5 className="text-lg font-black text-gray-900 leading-none">P&L Report</h5>
                                    <p className="text-[10px] text-[#5b21b6] font-bold mt-2">6-month view</p>
                                </div>

                                {/* Metric 6 */}
                                <div className="p-4 bg-[#f5f3ff] rounded-[24px] border border-[#ede9fe] flex flex-col justify-center transform hover:scale-105 transition-transform cursor-default">
                                    <span className="text-[10px] font-black text-[#a78bfa] uppercase tracking-widest mb-1">Digital</span>
                                    <h5 className="text-lg font-black text-gray-900 leading-none">Create Bills</h5>
                                    <p className="text-[10px] text-[#5b21b6] font-bold mt-2">Share on WhatsApp</p>
                                </div>

                            </div>

                            {/* Floating Bottom Badge */}
                            <div className="absolute -bottom-6 -right-6 bg-[#5b21b6] text-white px-8 py-4 rounded-[20px] font-black shadow-2xl flex items-center gap-3 transform hover:scale-110 transition-transform">
                                LIVE OPS <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></div>
                            </div>
                        </div>

                        {/* Background decorative glow */}
                        <div className="absolute -inset-6 bg-gradient-to-r from-[#a78bfa] via-[#a78bfa] to-[#a78bfa] rounded-[40px] blur-3xl opacity-20 -z-10"></div>
                    </div>
                </div>

            </div>

            {/* Bottom Fade out */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#faf5ff] to-transparent z-20"></div>
        </div>
    );
};

export default HeroBanner;