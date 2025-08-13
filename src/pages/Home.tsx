import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Users, Zap, Shield, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'tr';

  const features = [
    {
      icon: Sparkles,
      title: t('home.features.ai.title'),
      description: t('home.features.ai.description')
    },
    {
      icon: Users,
      title: t('home.features.categories.title'),
      description: t('home.features.categories.description')
    },
    {
      icon: Zap,
      title: t('home.features.fast.title'),
      description: t('home.features.fast.description')
    },
    {
      icon: Shield,
      title: t('home.features.secure.title'),
      description: t('home.features.secure.description')
    }
  ];

  const testimonials = [
    {
      name: t('home.testimonials.customer1.name'),
      role: t('home.testimonials.customer1.role'),
      content: t('home.testimonials.customer1.content'),
      rating: 5
    },
    {
      name: t('home.testimonials.customer2.name'),
      role: t('home.testimonials.customer2.role'),
      content: t('home.testimonials.customer2.content'),
      rating: 5
    },
    {
      name: t('home.testimonials.customer3.name'),
      role: t('home.testimonials.customer3.role'),
      content: t('home.testimonials.customer3.content'),
      rating: 5
    }
  ];

  return (
    <div className="bg-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('home.hero.title')}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {' '}{t('home.hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex justify-center">
              {user ? (
                <Link
                  to={`/${currentLang}/dashboard`}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center"
                >
                  {t('common.goToDashboard')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to={`/${currentLang}/login`}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center"
                  >
                    {t('navigation.login')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to={`/${currentLang}/register`}
                    className="bg-white border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-50 transition-all duration-200 flex items-center justify-center"
                  >
                    {t('navigation.register')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.examples.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('home.examples.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Corporate Photo Example */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">{t('home.examples.corporate.title')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img 
                      src="/images/ornek.jpg" 
                      alt="Orijinal Fotoğraf" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-600 font-medium">{t('home.examples.original')}</p>
                  </div>
                  <div className="text-center">
                    <img 
                      src="/images/ornek.jpg" 
                      alt="AI İşlenmiş Kurumsal" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-purple-600 font-medium">{t('home.examples.aiProcessed')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Creative Portrait Example */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">{t('home.examples.corporate.title')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img 
                      src="/images/ornek.jpg" 
                      alt="Orijinal Fotoğraf" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-600 font-medium">{t('home.examples.original')}</p>
                  </div>
                  <div className="text-center">
                    <img 
                      src="/images/ornek.jpg" 
                      alt="AI İşlenmiş Yaratıcı" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-green-600 font-medium">{t('home.examples.aiProcessed')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar Creator Example */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">{t('home.examples.outfit.title')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img 
                      src="/images/ornek.jpg" 
                      alt="Orijinal Fotoğraf" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-600 font-medium">{t('home.examples.original')}</p>
                  </div>
                  <div className="text-center">
                    <img 
                      src="/images/ornek.jpg" 
                      alt="AI İşlenmiş Avatar" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-indigo-600 font-medium">{t('home.examples.aiProcessed')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Outfit Change Example */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">{t('home.examples.outfit.title')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img 
                      src="/images/ornek.jpg" 
                      alt="Orijinal Fotoğraf" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-600 font-medium">{t('home.examples.original')}</p>
                  </div>
                  <div className="text-center">
                    <img 
                      src="/images/ornek.jpg" 
                      alt="AI İşlenmiş Elbise" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-orange-600 font-medium">{t('home.examples.aiProcessed')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Change Example */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">{t('home.examples.background.title')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img 
                      src="/images/ornek.jpg" 
                      alt="Orijinal Fotoğraf" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-600 font-medium">{t('home.examples.original')}</p>
                  </div>
                  <div className="text-center">
                    <img 
                      src="/images/ornek.jpg" 
                      alt="AI İşlenmiş Arkaplan" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-teal-600 font-medium">{t('home.examples.aiProcessed')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skin Correction Example */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">{t('home.examples.skin.title')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img 
                      src="/images/ornek.jpg" 
                      alt="Orijinal Fotoğraf" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-600 font-medium">{t('home.examples.original')}</p>
                  </div>
                  <div className="text-center">
                    <img 
                      src="/images/ornek.jpg" 
                      alt="AI İşlenmiş Cilt" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-pink-600 font-medium">{t('home.examples.aiProcessed')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-12">
            {user ? (
              <Link
                to={`/${currentLang}/dashboard`}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 inline-flex items-center"
              >
                {t('common.tryNow')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to={`/${currentLang}/login`}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 inline-flex items-center"
                >
                  {t('navigation.login')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to={`/${currentLang}/register`}
                  className="bg-white border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-50 transition-all duration-200 inline-flex items-center"
                >
                  {t('navigation.register')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.testimonials.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('home.testimonials.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">\"{testimonial.content}\"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
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
            {t('home.cta.subtitle')}
          </p>
          <Link
            to={user ? `/${currentLang}/dashboard` : `/${currentLang}/register`}
            className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            {user ? t('common.goToDashboard') : t('common.startNow')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>


    </div>
  );
};

export default Home;