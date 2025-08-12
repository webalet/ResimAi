import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const currentLang = i18n.language || 'tr';



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={`/${currentLang}`} className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">ResimAI</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8 ml-16">
              <button
                onClick={() => {
                  if (location.pathname === `/${currentLang}` || location.pathname === '/') {
                    const featuresSection = document.getElementById('features');
                    if (featuresSection) {
                      featuresSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else {
                    window.location.href = `/${currentLang}#features`;
                  }
                }}
                className="text-gray-700 hover:text-purple-600 text-sm font-medium transition-colors cursor-pointer"
              >
                {t('navigation.features')}
              </button>
              <button
                onClick={() => {
                  if (location.pathname === `/${currentLang}/pricing` || location.pathname.endsWith('/pricing')) {
                    const pricingSection = document.getElementById('pricing-cards');
                    if (pricingSection) {
                      pricingSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else {
                    window.location.href = `/${currentLang}/pricing#pricing-cards`;
                  }
                }}
                className="text-gray-700 hover:text-purple-600 text-sm font-medium transition-colors cursor-pointer"
              >
                {t('navigation.pricing')}
              </button>
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              
              {user ? (
                <Link
                  to={`/${currentLang}/dashboard`}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  {t('common.goToDashboard')}
                </Link>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to={`/${currentLang}/login`}
                    className="text-gray-700 hover:text-purple-600 text-sm font-medium transition-colors"
                  >
                    {t('navigation.login')}
                  </Link>
                  <Link
                    to={`/${currentLang}/register`}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    {t('navigation.register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">ResimAI</span>
              </div>
              <p className="text-gray-400 mb-4">
                {t('home.footer.description')}
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase mb-4">
                {t('home.footer.product')}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to={`/${currentLang}`} className="text-gray-400 hover:text-white transition-colors">
                    {t('home.footer.features')}
                  </Link>
                </li>
                <li>
                  <Link to={`/${currentLang}/pricing`} className="text-gray-400 hover:text-white transition-colors">
                    {t('home.footer.pricing')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase mb-4">
                {t('home.footer.support')}
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    {t('home.footer.helpCenter')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    {t('home.footer.contact')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8">
            <p className="text-center text-gray-400">
              {t('home.footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;