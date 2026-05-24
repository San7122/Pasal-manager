import React, { createContext, useState, useContext } from 'react'

const LanguageContext = createContext()

const translations = {
  en: {
    logIn: 'Log In',
    signUp: 'Sign Up',
    welcome: 'Welcome',
    shopManagement: 'Shop Management',
    trackSales: 'Track Sales',
    manageCosts: 'Manage Costs',
    creditTracking: 'Credit Tracking',
    inventory: 'Inventory',
    startNow: 'Start Now',
    features: 'Features',
    about: 'About',
    contact: 'Contact',
    getStarted: 'Get Started',
    trustedByShopkeepers: 'Trusted by Shopkeepers',
    smartBusiness: 'Smart Business',
    startHere: 'Start Here',
    completeShopManagement: 'Complete shop management in your pocket',
    ourMission: 'Our Mission',
    ourVision: 'Our Vision',
    missionText: 'Empower every shopkeeper with the tools they need to manage their business efficiently',
    visionText: 'A world where every small shop owner can compete with large retailers using technology',
    features_title: 'Powerful Features',
    dailySales: 'Daily Sales Tracking',
    creditManagement: 'Credit Management',
    stockManagement: 'Stock Management',
    analytics: 'Analytics',
  },
  ne: {
    logIn: 'लग इन',
    signUp: 'साइन अप',
    welcome: 'स्वागत छ',
    shopManagement: 'दोकान व्यवस्थापन',
    trackSales: 'बिक्रय ट्र्याक गर्नुहोस्',
    manageCosts: 'लागत व्यवस्थापन',
    creditTracking: 'क्रेडिट ट्र्याकिङ',
    inventory: 'सूची',
    startNow: 'अहीले सुरु गर्नुहोस्',
    features: 'विशेषताहरू',
    about: 'बारेमा',
    contact: 'संपर्क',
    getStarted: 'सुरु गर्नुहोस्',
    trustedByShopkeepers: 'दोकानदारहरूले विश्वास गर्छन्',
    smartBusiness: 'स्मार्ट व्यवसाय',
    startHere: 'यहाँ सुरु गर्नुहोस्',
    completeShopManagement: 'आपके जेब में पूर्ण दुकान प्रबंधन',
    ourMission: 'हाम्रो मिशन',
    ourVision: 'हाम्रो दृष्टि',
    missionText: 'प्रत्येक दोकानदारलाई उनीहरूको व्यवसाय प्रभावकारी रूपमा व्यवस्थापन गर्न आवश्यक उपकरणहरूको साथ सशक्त बनाउनुहोस्',
    visionText: 'एक संसार जहाँ प्रत्येक सानो दोकान मालिक प्रযुक्तिको प्रयोग गरेर ठुला खुद्रा विक्रेताहरूसँग प्रतिस्पर्धा गर्न सक्छन्',
    features_title: 'शक्तिशाली सुविधाहरू',
    dailySales: 'दैनिक बिक्रय ट्र्याकिङ',
    creditManagement: 'क्रेडिट व्यवस्थापन',
    stockManagement: 'स्टक व्यवस्थापन',
    analytics: 'विश्लेषण',
  },
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en')

  const changeLanguage = (lang) => {
    setLanguage(lang)
  }

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ne' : 'en')
  }

  const t = (key) => translations[language]?.[key] || key

  return (
    <LanguageContext.Provider value={{ language, setLanguage, changeLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
