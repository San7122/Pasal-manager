import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#faf5ff] pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand Section */}
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo-icon.svg" alt="Pasal Manager" className="w-11 h-11 rounded-xl" />
              <span className="text-2xl font-black text-gray-900 tracking-tighter">Pasal Manager</span>
            </div>
            <p className="text-gray-500 font-medium leading-relaxed mb-6">
              Complete shop management in your pocket. Made for India & Nepal.
            </p>

          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6">Features</h4>
            <ul className="space-y-4 text-gray-500 font-bold">
              <li><a href="#" className="hover:text-black transition-colors">Daily Sales</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Udhaar Book</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Stock Manager</a></li>
              <li><a href="#" className="hover:text-black transition-colors">P&L Reports</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6">Company</h4>
            <ul className="space-y-4 text-gray-500 font-bold">
              <li><a href="#" className="hover:text-black transition-colors">Mission</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6">Stay Updated</h4>
            <p className="text-gray-500 font-medium mb-4 text-sm">Join 5,000+ shopkeepers using Pasal Manager.</p>
            <form className="relative" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#ede9fe] transition-all shadow-sm"
              />
              <button className="absolute right-2 top-2 p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors">
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm font-bold">
            © 2026 Pasal Manager. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-gray-400 text-sm font-bold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Systems Operational
            </span>
            <span className="text-gray-400 text-sm font-bold">India & Nepal 🇮🇳 🇳🇵</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;