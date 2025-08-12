import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    
    // URL'yi güncelle
    const currentPath = location.pathname;
    let newPath = currentPath;
    
    // Mevcut dil prefix'ini kaldır
    if (currentPath.startsWith('/tr') || currentPath.startsWith('/en')) {
      newPath = currentPath.substring(3) || '/';
    }
    
    // Yeni dil prefix'ini ekle
    newPath = `/${lng}${newPath === '/' ? '' : newPath}`;
    
    navigate(newPath);
  };

  const currentLanguage = i18n.language || 'tr';

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-gray-600" />
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => changeLanguage('tr')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              currentLanguage === 'tr'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="lang-switcher-tr"
          >
            TR
          </button>
          <button
            onClick={() => changeLanguage('en')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              currentLanguage === 'en'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="lang-switcher-en"
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;