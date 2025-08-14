import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  // Dil bazlı para birimi ve fiyat sistemi
  const isEnglish = i18n.language === 'en';
  const currency = isEnglish ? '$' : '₺';
  
  // Doğrudan TL/USD fiyatları
  const pricePackages = [
    {
      credits: 1,
      price_try: 0,
      price_usd: 0
    },
    {
      credits: 10,
      price_try: 100,
      price_usd: 3
    },
    {
      credits: 25,
      price_try: 250,
      price_usd: 7.5
    },
    {
      credits: 60,
      price_try: 600,
      price_usd: 18
    },
    {
      credits: 150,
      price_try: 1500,
      price_usd: 45
    }
  ];
  
  const plans = [
    {
      name: t('pricing.packages.basic.name'),
      price: (isEnglish ? pricePackages[0]?.price_usd : pricePackages[0]?.price_try)?.toString() ?? '0',
      period: t('pricing.credits'),
      description: t('pricing.packages.basic.description'),
      features: [
        t('pricing.features.oneCredit'),
        t('pricing.features.allCategories'),
        t('pricing.features.standardQuality'),
        t('pricing.features.emailSupport'),
        t('pricing.features.basicStyles')
      ],
      buttonText: t('common.startFree'),
      popular: false,
      credits: pricePackages[0]?.credits ?? 0
    },
    {
      name: t('pricing.packages.standard.name'),
      price: (isEnglish ? pricePackages[1]?.price_usd : pricePackages[1]?.price_try)?.toString() ?? '0',
      period: t('pricing.credits'),
      description: t('pricing.packages.standard.description'),
      features: [
        t('pricing.features.tenCredits'),
        t('pricing.features.allCategoriesAccess'),
        t('pricing.features.standardQuality'),
        t('pricing.features.emailSupport'),
        t('pricing.features.basicStyles')
      ],
      buttonText: t('pricing.selectPlan'),
      popular: false,
      credits: pricePackages[1]?.credits ?? 0
    },
    {
      name: t('pricing.packages.premium.name'),
      price: (isEnglish ? pricePackages[2]?.price_usd : pricePackages[2]?.price_try)?.toString() ?? '0',
      period: t('pricing.credits'),
      description: t('pricing.packages.premium.description'),
      features: [
        t('pricing.features.twentyFiveCredits'),
        t('pricing.features.allCategoriesAccess'),
        t('pricing.features.highQuality'),
        t('pricing.features.prioritySupport'),
        t('pricing.features.advancedStyles')
      ],
      buttonText: t('pricing.selectPlan'),
      popular: true,
      credits: pricePackages[2]?.credits ?? 0
    },
    {
      name: t('pricing.packages.pro.name'),
      price: (isEnglish ? pricePackages[3]?.price_usd : pricePackages[3]?.price_try)?.toString() ?? '0',
      period: t('pricing.credits'),
      description: t('pricing.packages.pro.description'),
      features: [
        t('pricing.features.sixtyCredits'),
        t('pricing.features.allCategoriesAccess'),
        t('pricing.features.ultraHighQuality'),
        t('pricing.features.prioritySupport'),
        t('pricing.features.advancedStyles'),
        t('pricing.features.batchProcessing')
      ],
      buttonText: t('pricing.selectPlan'),
      popular: false,
      credits: pricePackages[3]?.credits ?? 0
    },
    {
      name: t('pricing.packages.business.name'),
      price: (isEnglish ? pricePackages[4]?.price_usd : pricePackages[4]?.price_try)?.toString() ?? '0',
      period: t('pricing.credits'),
      description: t('pricing.packages.business.description'),
      features: [
        t('pricing.features.oneHundredFiftyCredits'),
        t('pricing.features.allCategoriesPlusCustom'),
        t('pricing.features.ultraHighQuality'),
        t('pricing.features.twentyFourSevenSupport'),
        t('pricing.features.customIntegrations'),
        t('pricing.features.batchProcessing')
      ],
      buttonText: t('pricing.selectPlan'),
      popular: false,
      credits: pricePackages[4]?.credits ?? 0
    }
  ];

  const currentLang = i18n.language || 'tr';

  // Handle anchor scroll on page load
  useEffect(() => {
    if (window.location.hash === '#pricing-cards') {
      setTimeout(() => {
        const pricingSection = document.getElementById('pricing-cards');
        if (pricingSection) {
          pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t('pricing.title')}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {' '}{t('pricing.titleHighlight')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section id="pricing-cards" className="py-20 bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 ${
                  plan.popular 
                    ? 'ring-4 ring-purple-200 scale-105 transform hover:scale-110' 
                    : 'hover:scale-105 transform'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 text-white text-center py-3 text-sm font-bold tracking-wide">
                    ⭐ {t('pricing.mostPopular')} ⭐
                  </div>
                )}
                <div className={`p-8 ${plan.popular ? 'pt-16' : 'pt-8'} h-full flex flex-col`}>
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-600'
                    }`}>
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>
                  
                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-extrabold text-gray-900">{currency}{plan.price}</span>
                      <span className="text-gray-500 ml-2 text-lg">/{plan.period}</span>
                    </div>
                    {plan.credits && (
                      <div className={`inline-block mt-3 px-4 py-2 rounded-full text-sm font-semibold ${
                        plan.popular 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {plan.credits} {t('pricing.credits')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                            plan.popular 
                              ? 'bg-purple-100' 
                              : 'bg-green-100'
                          }`}>
                            <Check className={`h-4 w-4 ${
                              plan.popular 
                                ? 'text-purple-600' 
                                : 'text-green-600'
                            }`} />
                          </div>
                          <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-auto">
                    <Link
                      to={user ? `/${currentLang}/dashboard` : `/${currentLang}/register`}
                      className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                          : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800'
                      }`}
                    >
                      {plan.buttonText}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('pricing.faq.title')}
            </h2>
          </div>
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('pricing.faq.question1')}
              </h3>
              <p className="text-gray-600">
                {t('pricing.faq.answer1')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('pricing.faq.question2')}
              </h3>
              <p className="text-gray-600">
                {t('pricing.faq.answer2')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('pricing.faq.question3')}
              </h3>
              <p className="text-gray-600">
                {t('pricing.faq.answer3')}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('home.cta.title')}
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            {t('pricing.cta.subtitle')}
          </p>
          <Link
            to={user ? `/${currentLang}/dashboard` : `/${currentLang}/register`}
            className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            {user ? t('common.goToDashboard') : t('common.startFree')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Pricing;