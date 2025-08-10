import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Users, Zap, Shield, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Sparkles,
      title: 'AI Destekli İşleme',
      description: 'En gelişmiş AI teknolojisi ile profesyonel fotoğraf işleme'
    },
    {
      icon: Users,
      title: 'Çoklu Kategori',
      description: 'Kurumsal, LinkedIn, Yaratıcı, Avatar ve Arka Plan seçenekleri'
    },
    {
      icon: Zap,
      title: 'Hızlı İşlem',
      description: 'Dakikalar içinde profesyonel sonuçlar alın'
    },
    {
      icon: Shield,
      title: 'Güvenli & Gizli',
      description: 'Fotoğraflarınız güvenli şekilde işlenir ve saklanır'
    }
  ];

  const testimonials = [
    {
      name: 'Ahmet Yılmaz',
      role: 'Pazarlama Müdürü',
      content: 'LinkedIn profilim için harika fotoğraflar elde ettim. Çok profesyonel görünüyor!',
      rating: 5
    },
    {
      name: 'Elif Kaya',
      role: 'Grafik Tasarımcı',
      content: 'Yaratıcı portre kategorisi tam aradığım şeydi. Sonuçlar muhteşem!',
      rating: 5
    },
    {
      name: 'Mehmet Demir',
      role: 'İnsan Kaynakları',
      content: 'Kurumsal fotoğraflarımız için mükemmel bir çözüm. Herkese tavsiye ederim.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">ResimAI</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Özellikler
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
                Yorumlar
              </a>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Fiyatlar</Link>
            </nav>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              AI ile Profesyonel
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {' '}Fotoğraf İşleme
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Yapay zeka teknolojisi ile fotoğraflarınızı profesyonel kalitede işleyin. 
              Sadece 10 TL'den başlayan fiyatlarla, 1 ücretsiz kredi ile hemen deneyin!
            </p>
            <div className="flex justify-center">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center"
              >
                {user ? 'Dashboard\'a Git' : 'Ücretsiz Başla'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI ile Dönüşüm Örnekleri
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Yapay zeka teknolojimizin gücünü gerçek örneklerle keşfedin
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Corporate Photo Example */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Kurumsal Fotoğraf</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img 
                      src="https://via.placeholder.com/300x300/6366f1/ffffff?text=Orijinal" 
                      alt="Orijinal Fotoğraf" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-600 font-medium">Orijinal</p>
                  </div>
                  <div className="text-center">
                    <img 
                      src="https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Kurumsal" 
                      alt="AI İşlenmiş Kurumsal" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-purple-600 font-medium">AI İşlenmiş</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Creative Portrait Example */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Yaratıcı Portre</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img 
                      src="https://via.placeholder.com/300x300/6366f1/ffffff?text=Orijinal" 
                      alt="Orijinal Fotoğraf" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-600 font-medium">Orijinal</p>
                  </div>
                  <div className="text-center">
                    <img 
                      src="https://via.placeholder.com/300x300/10b981/ffffff?text=Yaratici" 
                      alt="AI İşlenmiş Yaratıcı" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-green-600 font-medium">AI İşlenmiş</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar Creator Example */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Avatar Oluşturucu</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img 
                      src="https://via.placeholder.com/300x300/6366f1/ffffff?text=Orijinal" 
                      alt="Orijinal Fotoğraf" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-600 font-medium">Orijinal</p>
                  </div>
                  <div className="text-center">
                    <img 
                      src="https://via.placeholder.com/300x300/6366f1/ffffff?text=Avatar" 
                      alt="AI İşlenmiş Avatar" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-indigo-600 font-medium">AI İşlenmiş</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Outfit Change Example */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Elbise Değişimi</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img 
                      src="https://via.placeholder.com/300x300/6366f1/ffffff?text=Orijinal" 
                      alt="Orijinal Fotoğraf" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-600 font-medium">Orijinal</p>
                  </div>
                  <div className="text-center">
                    <img 
                      src="https://via.placeholder.com/300x300/f97316/ffffff?text=Elbise" 
                      alt="AI İşlenmiş Elbise" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-orange-600 font-medium">AI İşlenmiş</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Change Example */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Arkaplan Değiştirme</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img 
                      src="https://via.placeholder.com/300x300/6366f1/ffffff?text=Orijinal" 
                      alt="Orijinal Fotoğraf" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-600 font-medium">Orijinal</p>
                  </div>
                  <div className="text-center">
                    <img 
                      src="https://via.placeholder.com/300x300/14b8a6/ffffff?text=Arkaplan" 
                      alt="AI İşlenmiş Arkaplan" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-teal-600 font-medium">AI İşlenmiş</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skin Correction Example */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Cilt Düzeltme</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img 
                      src="https://via.placeholder.com/300x300/6366f1/ffffff?text=Orijinal" 
                      alt="Orijinal Fotoğraf" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-gray-600 font-medium">Orijinal</p>
                  </div>
                  <div className="text-center">
                    <img 
                      src="https://via.placeholder.com/300x300/ec4899/ffffff?text=Cilt" 
                      alt="AI İşlenmiş Cilt" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm text-pink-600 font-medium">AI İşlenmiş</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 inline-flex items-center"
            >
              {user ? 'Hemen Dene' : 'Ücretsiz Başla'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Neden ResimAI?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              En gelişmiş AI teknolojisi ile fotoğraf işleme deneyimini yeniden tanımlıyoruz
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
              Müşteri Yorumları
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Binlerce memnun kullanıcımızın deneyimlerini keşfedin
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
                <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
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
            Profesyonel Fotoğraflarınızı Bugün Oluşturun
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            1 ücretsiz kredi ile başlayın, sonrasında sadece 10 TL/resim ile devam edin
          </p>
          <Link
            to={user ? "/dashboard" : "/register"}
            className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            {user ? 'Dashboard\'a Git' : 'Hemen Başla'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">ResimAI</span>
              </div>
              <p className="text-gray-400">
                AI destekli profesyonel fotoğraf işleme platformu
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Ürün</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Özellikler</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fiyatlar</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Destek</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Durum</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Yasal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Gizlilik</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Şartlar</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Çerezler</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ResimAI. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;