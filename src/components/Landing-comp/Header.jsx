import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { language, changeLanguage, t } = useLanguage();

  // Add scroll listener to change background opacity
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`absolute top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'py-4' : 'py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <nav className={`flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300 ${
          isScrolled 
          ? 'bg-white/70 backdrop-blur-xl shadow-lg border border-white/40' 
          : 'bg-transparent'
        }`}>
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 group cursor-pointer">
           <img src="/logo-icon.svg" alt="Pasal Manager" className="w-9 h-9 rounded-lg" />
           <span className="text-white font-black text-xl">Pasal Manager</span>
          </div>


          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 rounded-full transition-all"
              >
                <Globe size={18} />
                <span className="text-sm font-bold uppercase">{language}</span>
              </button>
              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded-2xl shadow-xl border border-gray-200 z-50">
                  <button
                    onClick={() => {
                      changeLanguage('en');
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full text-left px-6 py-3 rounded-t-2xl font-bold hover:bg-gray-100 transition-all ${
                      language === 'en' ? 'bg-[#ede9fe] text-[#5b21b6]' : ''
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('hi');
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full text-left px-6 py-3 font-bold hover:bg-gray-100 transition-all ${
                      language === 'hi' ? 'bg-[#ede9fe] text-[#5b21b6]' : ''
                    }`}
                  >
                    हिन्दी
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('ne');
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full text-left px-6 py-3 rounded-b-2xl font-bold hover:bg-gray-100 transition-all ${
                      language === 'ne' ? 'bg-[#ede9fe] text-[#5b21b6]' : ''
                    }`}
                  >
                    नेपाली
                  </button>
                </div>
              )}
            </div>

            <a href="/app.html" className="bg-black text-white text-sm font-black px-6 py-2.5 rounded-full flex items-center gap-2 hover:shadow-xl transform active:scale-95 transition-all">
              {t('logIn')} <ArrowRight size={14} />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        
      </div>
    </header>
  );
};

export default Header;