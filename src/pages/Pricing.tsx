import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Pricing: React.FC = () => {
  const { user } = useAuth();

  const plans = [
    {
      name: 'Ücretsiz',
      price: '0',
      period: 'kredi paketi',
      description: 'Başlamak için mükemmel',
      features: [
        '1 görsel işleme kredisi',
        'Tüm kategoriler (Kurumsal fotoğraf, Yaratıcı portre, Avatar oluşturucu, Elbise değişimi, Arkaplan değiştirme, Cilt düzeltme)',
        'Standart kalite',
        'Email destek',
        'Temel stiller'
      ],
      buttonText: 'Ücretsiz Başla',
      popular: false,
      credits: 1
    },
    {
      name: 'Starter',
      price: '100',
      period: 'kredi paketi',
      description: 'Küçük projeler için',
      features: [
        '10 görsel işleme kredisi',
        'Tüm kategoriler erişimi',
        'Standart kalite',
        'Email destek',
        'Temel stiller'
      ],
      buttonText: 'Starter Paketi',
      popular: false,
      credits: 10
    },
    {
      name: 'Professional',
      price: '225',
      period: 'kredi paketi',
      description: 'Profesyoneller için ideal',
      features: [
        '25 görsel işleme kredisi',
        'Tüm kategoriler erişimi',
        'Yüksek kalite çıktı',
        'Öncelikli destek',
        'Gelişmiş stiller'
      ],
      buttonText: 'Professional Paketi',
      popular: true,
      credits: 25
    },
    {
      name: 'Premium',
      price: '480',
      period: 'kredi paketi',
      description: 'Yoğun kullanım için',
      features: [
        '60 görsel işleme kredisi',
        'Tüm kategoriler erişimi',
        'Ultra yüksek kalite',
        'Öncelikli destek',
        'Gelişmiş stiller',
        'Toplu işleme'
      ],
      buttonText: 'Premium Paketi',
      popular: false,
      credits: 60
    },
    {
      name: 'Corporate',
      price: '1050',
      period: 'kredi paketi',
      description: 'Büyük ekipler için',
      features: [
        '150 görsel işleme kredisi',
        'Tüm kategoriler + özel stiller',
        'Ultra yüksek kalite',
        '7/24 destek',
        'Özel entegrasyonlar',
        'Toplu işleme'
      ],
      buttonText: 'Corporate Paketi',
      popular: false,
      credits: 150
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link to="/" className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">ResimAI</span>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Size Uygun
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {' '}Kredi Paketini Seçin
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            İhtiyaçlarınıza göre tasarlanmış esnek kredi paketleri. Her resim işleme 1 kredi harcar.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-purple-50">
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
                    ⭐ EN POPÜLER ⭐
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
                      <span className="text-5xl font-extrabold text-gray-900">₺{plan.price}</span>
                      <span className="text-gray-500 ml-2 text-lg">/{plan.period}</span>
                    </div>
                    {plan.credits && (
                      <div className={`inline-block mt-3 px-4 py-2 rounded-full text-sm font-semibold ${
                        plan.popular 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {plan.credits} Kredi
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
                      to={user ? "/dashboard" : "/register"}
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
              Sıkça Sorulan Sorular
            </h2>
          </div>
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Kredi sistemi nasıl çalışır?
              </h3>
              <p className="text-gray-600">
                Her görsel işleme işlemi 1 kredi harcar. Satın aldığınız krediler hesabınıza anında eklenir ve süresiz olarak kullanabilirsiniz.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Krediler ne kadar süre geçerli?
              </h3>
              <p className="text-gray-600">
                Satın aldığınız krediler süresizdir ve hesabınızda kalır. İstediğiniz zaman kullanabilirsiniz.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hangi ödeme yöntemlerini kabul ediyorsunuz?
              </h3>
              <p className="text-gray-600">
                Kredi kartı, banka kartı ve PayPal ile ödeme yapabilirsiniz. Tüm ödemeler güvenli SSL şifreleme ile korunmaktadır.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Hemen Başlayın
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Ücretsiz hesap oluşturun ve AI destekli fotoğraf işleme deneyimini yaşayın
          </p>
          <Link
            to={user ? "/dashboard" : "/register"}
            className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            {user ? 'Dashboard\'a Git' : 'Ücretsiz Başla'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Pricing;