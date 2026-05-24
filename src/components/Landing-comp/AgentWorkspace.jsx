import React, { useState } from 'react';
import {
  TrendingUp, Users, Package, Receipt, BarChart3, BookOpen,
  Check, UserCircle, Briefcase, Wallet, CreditCard, LineChart, Sparkles
} from 'lucide-react';

const PhoneMockup = ({ src, alt }) => (
  <div className="relative mx-auto" style={{ width: '300px' }}>
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

const AgentWorkspace = () => {
  const [activeTab, setActiveTab] = useState('Sales');

  const features = {
    Sales: {
      label: 'Daily Sales',
      icon: <TrendingUp size={16} />,
      title: 'Fast sales entry',
      subtitle: 'Done in 3 seconds',
      description: 'Record sales with just a few taps. Track Cash, UPI, PhonePe, GPay, Paytm, or Card payments separately.',
      bullets: ['Quick 3-second entry', 'Multiple payment modes', 'Live profit tracking'],
      screenshot: '/tool-screens/mobile/today.png',
    },
    Katha: {
      label: 'Katha (History)',
      icon: <BookOpen size={16} />,
      title: 'Complete daily history',
      subtitle: 'See every transaction',
      description: 'Browse any past day with date navigation. View all sales, expenses, returns in one daily view.',
      bullets: ['Date-by-date navigation', 'Complete daily journal', 'Search & filter entries'],
      screenshot: '/tool-screens/mobile/katha.png',
    },
    Udhaar: {
      label: 'Udhaar Book',
      icon: <Users size={16} />,
      title: 'Track customer credit',
      subtitle: 'Never lose track',
      description: 'Digital ledger of all customer credit. Send WhatsApp reminders in one tap to get paid faster.',
      bullets: ['One-tap WhatsApp reminders', 'Due date tracking', 'Bulk overdue reminders'],
      screenshot: '/tool-screens/mobile/udhaar.png',
    },
    Stock: {
      label: 'Stock Manager',
      icon: <Package size={16} />,
      title: 'Inventory control',
      subtitle: 'Auto-generated barcodes',
      description: 'Manage item names, sizes, quantities, and prices. Auto-generates barcodes you can print and scan.',
      bullets: ['Auto barcode generation', 'Low-stock alerts', 'Printable labels (8/page)'],
      screenshot: '/tool-screens/mobile/stock.png',
    },
    Expenses: {
      label: 'Expenses',
      icon: <BarChart3 size={16} />,
      title: 'Track every cost',
      subtitle: 'Categorized expenses',
      description: 'Record daily expenses (rent, staff, utilities) and track costs to maximize profits.',
      bullets: ['Categorized tracking', 'Daily/weekly view', 'Auto-deducted from profit'],
      screenshot: '/tool-screens/mobile/expense.png',
    },
    Bill: {
      label: 'Digital Bill',
      icon: <Receipt size={16} />,
      title: 'Professional bills',
      subtitle: 'Send PDF via WhatsApp',
      description: 'Generate clean A5 PDF receipts instantly. Share via WhatsApp or print as needed.',
      bullets: ['A5 PDF receipts', 'Send PDF via WhatsApp', 'Print-ready format'],
      screenshot: '/tool-screens/mobile/bill.png',
    },
    Customers: {
      label: 'Customers',
      icon: <UserCircle size={16} />,
      title: 'Customer database',
      subtitle: 'Know your buyers',
      description: 'Save customer details with phone, address, and notes. View their entire purchase & udhaar history.',
      bullets: ['Full purchase history', 'WhatsApp from contact', 'Notes & tags'],
      screenshot: '/tool-screens/mobile/customers.png',
    },
    Staff: {
      label: 'Staff Book',
      icon: <Briefcase size={16} />,
      title: 'Manage employees',
      subtitle: 'Attendance & salary',
      description: 'Track staff attendance, salary advances, and payments. Complete employee ledger per worker.',
      bullets: ['Daily attendance', 'Advance tracking', 'Monthly salary calc'],
      screenshot: '/tool-screens/mobile/staff.png',
    },
    Cashbook: {
      label: 'Cash Book',
      icon: <Wallet size={16} />,
      title: 'Daily cash flow',
      subtitle: 'Money in, money out',
      description: 'Track every rupee that enters or leaves your shop. See real-time cash balance anytime.',
      bullets: ['Real-time balance', 'In/Out entries', 'Daily reconciliation'],
      screenshot: '/tool-screens/mobile/cashbook.png',
    },
    EMI: {
      label: 'EMI & Loans',
      icon: <CreditCard size={16} />,
      title: 'EMI tracking',
      subtitle: 'For shops doing finance',
      description: 'Track EMI plans you offer customers and loans you owe. Auto-calculate interest & schedules.',
      bullets: ['EMI calculator', 'Loan schedule', 'Auto-due reminders'],
      screenshot: '/tool-screens/mobile/emi.png',
    },
    Reports: {
      label: 'P&L Reports',
      icon: <LineChart size={16} />,
      title: 'Profit & loss reports',
      subtitle: '6-month overview',
      description: 'See your business health at a glance. Export reports for your CA, bank, or accountant.',
      bullets: ['6-month overview', 'Daily/monthly view', 'Export to CSV / PDF'],
      screenshot: '/tool-screens/mobile/pl.png',
    },
    Dashboard: {
      label: 'Analytics',
      icon: <BarChart3 size={16} />,
      title: 'Visual analytics',
      subtitle: 'Charts & trends',
      description: 'Interactive charts showing sales trends, top items, payment mode breakdowns and growth.',
      bullets: ['Sales trend charts', 'Top items ranking', 'Payment breakdowns'],
      screenshot: '/tool-screens/mobile/dashboard.png',
    },
  };

  const current = features[activeTab];

  return (
    <div className="py-14 px-5 sm:py-20 sm:px-6 lg:py-24 bg-gradient-to-b from-white via-[#faf5ff] to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#ede9fe] text-[#5b21b6] px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Sparkles size={14} /> All 12 features
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-gray-900 tracking-tighter mb-3">
            Everything you need.<br/>
            <span className="text-[#7c3aed]">Nothing you don't.</span>
          </h2>
          <p className="text-lg text-gray-500 font-medium">Simple. Fast. Offline-ready.</p>
        </div>

        {/* Tabs — wrap to multiple rows */}
        <div className="flex flex-wrap justify-center gap-2 mb-14 max-w-5xl mx-auto p-2 bg-white rounded-3xl border border-gray-200 shadow-sm">
          {Object.keys(features).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all ${
                activeTab === key
                  ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/30'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {features[key].icon}
              <span>{features[key].label}</span>
            </button>
          ))}
        </div>

        {/* Feature showcase */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[480px] lg:min-h-[600px]">
          {/* Left: Copy */}
          <div className="space-y-6" key={activeTab}>
            <div>
              <h3 className="text-3xl sm:text-4xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-[1.05] mb-3">
                {current.title}
              </h3>
              <p className="text-xl font-bold text-[#7c3aed]">{current.subtitle}</p>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed font-medium max-w-md">
              {current.description}
            </p>

            <ul className="space-y-3 pt-2">
              {current.bullets.map((bullet, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <span className="w-6 h-6 rounded-full bg-[#ede9fe] flex items-center justify-center flex-shrink-0">
                    <Check size={14} className="text-[#7c3aed]" strokeWidth={3} />
                  </span>
                  <span className="font-medium">{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <a
                href="/app.html"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#7c3aed] text-white rounded-2xl font-bold text-base hover:bg-[#5b21b6] hover:shadow-2xl hover:shadow-[#7c3aed]/30 transition-all active:scale-95"
              >
                Try {current.label} →
              </a>
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div className="flex justify-center lg:justify-end" key={`phone-${activeTab}`}>
            <div className="animate-fade-in">
              <PhoneMockup src={current.screenshot} alt={current.title} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default AgentWorkspace;
