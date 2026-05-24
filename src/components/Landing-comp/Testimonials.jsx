import React from 'react';
import { Star, Quote, Heart } from 'lucide-react';

const testimonials = [
  {
    name: 'Ajay Thakur',
    role: 'Black Horse Shoes',
    location: 'Kathmandu, Nepal',
    initial: 'A',
    bg: 'bg-[#1e1147]/10',
    badgeColor: 'text-[#1e1147]',
    text: 'जुत्ता पसलमा हरेक size, model, र qty track गर्नु धेरै झन्झट थियो। अब Pasal Manager ले barcode auto generate गर्छ — print गरेर लगाइदियो। Stock count गर्न २ घण्टा लाग्ने काम अब ५ मिनेटमा हुन्छ।',
    rating: 4.8,
  },
  {
    name: 'AB Collection',
    role: 'Shoe shop',
    location: 'Dharan, Sunsari, Nepal',
    initial: 'AB',
    bg: 'bg-pink-100',
    badgeColor: 'text-pink-700',
    text: 'जुत्ता पसलमा हरेक model र size को track राख्न गाह्रो हुन्थ्यो। अब barcode स्कान गरेर बेच्न मिल्छ। WhatsApp मा PDF bill पठाउने सुविधा धेरै राम्रो छ — customers professional मान्छन्।',
    rating: 4.5,
  },
  {
    name: 'Rakesh Patel',
    role: 'Garment shop owner',
    location: 'Surat, Gujarat',
    initial: 'R',
    bg: 'bg-orange-100',
    badgeColor: 'text-orange-700',
    text: 'मेरी सबसे बड़ी टेंशन उधार वाली थी। अब WhatsApp पर एक tap में reminder जाता है, और customers जल्दी pay करते हैं। Profit 30% बढ़ा है।',
    rating: 4.8,
  },
  {
    name: 'Sita Maharjan',
    role: 'Kirana shop',
    location: 'Lalitpur, Nepal',
    initial: 'S',
    bg: 'bg-[#ede9fe]',
    badgeColor: 'text-[#5b21b6]',
    text: 'नेपाली में काम गर्न मिल्छ अनि BS Calendar छ — यो धेरै राम्रो छ। मेरो दैनिक हिसाब अब फोनमा। पैसा गन्न समय बच्यो।',
    rating: 4.5,
  },
  {
    name: 'Mohan Kumar',
    role: 'Footwear store',
    location: 'Lucknow, UP',
    initial: 'M',
    bg: 'bg-green-100',
    badgeColor: 'text-green-700',
    text: 'Voice entry is a game changer for me. Just speak — "500 cash sale" — and it\'s recorded. Even my dad who can\'t type uses it easily.',
    rating: 4.8,
  },
  {
    name: 'Priya Sharma',
    role: 'Cosmetics store',
    location: 'Pune, Maharashtra',
    initial: 'P',
    bg: 'bg-rose-100',
    badgeColor: 'text-rose-700',
    text: 'UPI QR code direct from app! Customer scans, pays, sale auto-records. No more "amount kitna hai?" confusion. 5-star tool!',
    rating: 4.8,
  },
];

// Render stars with half-star support
const renderStars = (rating) => {
  const stars = [];
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const filledCount = hasHalf ? full : Math.round(rating);
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(<Star key={i} size={16} className="text-yellow-400" fill="currentColor" />);
    } else if (i === full && hasHalf) {
      // Half-filled star using gradient
      stars.push(
        <div key={i} className="relative">
          <Star size={16} className="text-gray-200" fill="currentColor" />
          <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
            <Star size={16} className="text-yellow-400" fill="currentColor" />
          </div>
        </div>
      );
    } else {
      stars.push(<Star key={i} size={16} className="text-gray-200" fill="currentColor" />);
    }
  }
  return stars;
};

const Testimonials = () => (
  <div className="py-14 px-5 sm:py-20 sm:px-6 lg:py-24 bg-white">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-[#ede9fe] text-[#5b21b6] px-4 py-2 rounded-full text-sm font-bold mb-4">
          <Heart size={14} fill="currentColor" /> Loved by shopkeepers
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-gray-900 tracking-tighter mb-3">
          What shop owners <span className="text-[#7c3aed]">are saying</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-3xl p-8 hover:border-[#7c3aed] hover:shadow-xl transition-all duration-300 relative"
          >
            <Quote size={32} className="text-[#ede9fe] absolute top-6 right-6" fill="currentColor" />

            {/* Stars + numeric rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                {renderStars(t.rating)}
              </div>
              <span className="text-sm font-bold text-gray-700">{t.rating.toFixed(1)}</span>
            </div>

            {/* Quote */}
            <p className="text-gray-700 leading-relaxed mb-6 text-base font-medium">
              "{t.text}"
            </p>

            {/* Person */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <div className={`w-12 h-12 ${t.bg} rounded-full flex items-center justify-center font-black ${t.badgeColor||'text-gray-700'} ${t.initial.length>1?'text-sm':'text-lg'} flex-shrink-0`}>
                {t.initial}
              </div>
              <div>
                <div className="font-bold text-gray-900">{t.name}</div>
                <div className="text-xs text-gray-500">{t.role} · {t.location}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Testimonials;
