import React, { useState, useEffect } from 'react';
import { Check, Crown, Zap, Star, CreditCard } from 'lucide-react';
import { StripePrice } from '../../shared/types';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'sonner';
import { cn } from '../utils/cn';

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      // Mock data for now - will be replaced with API call
      setTimeout(() => {
        setPrices([
          {
            id: 'price_starter',
            amount: 10000, // 100 TL
            currency: 'try',
            credits: 10,
            popular: false
          },
          {
            id: 'price_pro',
            amount: 22500, // 225 TL
            currency: 'try',
            credits: 25,
            popular: true
          },
          {
            id: 'price_premium',
            amount: 48000, // 480 TL
            currency: 'try',
            credits: 60,
            popular: false
          },
          {
            id: 'price_enterprise',
            amount: 105000, // 1050 TL
            currency: 'try',
            credits: 150,
            popular: false
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Prices loading failed:', error);
      toast.error('Fiyatlar yüklenirken hata oluştu');
      setLoading(false);
    }
  };

  const handlePurchase = async (priceId: string) => {
    if (!user) {
      toast.error('Satın alma için giriş yapmanız gerekiyor');
      return;
    }

    setProcessingPayment(priceId);
    
    try {
      // Mock payment process - will be replaced with Stripe integration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const price = prices.find(p => p.id === priceId);
      if (price) {
        toast.success(`${price.credits} kredi başarıyla satın alındı!`);
        // Here we would update the user's credits in the context
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Ödeme sırasında hata oluştu');
    } finally {
      setProcessingPayment(null);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0
    }).format(amount / 100);
  };

  const getPricePerCredit = (amount: number, credits: number) => {
    const pricePerCredit = (amount / 100) / credits;
    return pricePerCredit.toFixed(2);
  };

  const getPlanIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Zap className="h-6 w-6" />;
      case 1:
        return <Star className="h-6 w-6" />;
      case 2:
        return <Crown className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const getPlanName = (index: number) => {
    switch (index) {
      case 0:
        return 'Başlangıç';
      case 1:
        return 'Profesyonel';
      case 2:
        return 'Premium';
      default:
        return 'Kurumsal';
    }
  };

  const getPlanDescription = (index: number) => {
    switch (index) {
      case 0:
        return 'Bireysel kullanım için ideal';
      case 1:
        return 'Küçük işletmeler için';
      case 2:
        return 'Yoğun kullanım için';
      default:
        return 'Büyük ekipler için';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Fiyatlar yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Kredi Paketleri
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          AI destekli fotoğraf işleme için kredi satın alın. Her işlem 1 kredi tüketir.
        </p>
      </div>

      {/* Current Credits */}
      {user && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Mevcut Krediniz
              </h3>
              <p className="text-gray-600">
                Hesabınızda <span className="font-bold text-purple-600">{user.credits}</span> kredi bulunuyor
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {prices.map((price, index) => (
          <div
            key={price.id}
            className={cn(
              'relative bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg',
              price.popular
                ? 'border-purple-500 ring-2 ring-purple-100'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            {price.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  En Popüler
                </span>
              </div>
            )}
            
            <div className="p-6">
              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className={cn(
                  'inline-flex p-3 rounded-lg mb-4',
                  price.popular
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-gray-600'
                )}>
                  {getPlanIcon(index)}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {getPlanName(index)}
                </h3>
                <p className="text-gray-600 text-sm">
                  {getPlanDescription(index)}
                </p>
              </div>
              
              {/* Price */}
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatPrice(price.amount, price.currency)}
                </div>
                <div className="text-lg font-semibold text-purple-600 mb-2">
                  {price.credits} Kredi
                </div>
                <div className="text-sm text-gray-500">
                  Kredi başına {getPricePerCredit(price.amount, price.credits)} ₺
                </div>
              </div>
              
              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {price.credits} adet fotoğraf işleme
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Tüm kategoriler dahil
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Yüksek çözünürlük çıktı
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Hızlı işleme (2-5 dk)
                </div>
                {index >= 1 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Öncelikli destek
                  </div>
                )}
                {index >= 2 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Toplu işleme
                  </div>
                )}

              </div>
              
              {/* Purchase Button */}
              <button
                onClick={() => handlePurchase(price.id)}
                disabled={processingPayment === price.id}
                className={cn(
                  'w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center',
                  price.popular
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800',
                  processingPayment === price.id && 'opacity-50 cursor-not-allowed'
                )}
              >
                {processingPayment === price.id ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Satın Al
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Sık Sorulan Sorular
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Krediler ne kadar süre geçerli?
            </h4>
            <p className="text-gray-600 text-sm">
              Satın aldığınız krediler süresiz olarak hesabınızda kalır ve istediğiniz zaman kullanabilirsiniz.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Her işlem kaç kredi tüketir?
            </h4>
            <p className="text-gray-600 text-sm">
              Her fotoğraf işleme işlemi 1 kredi tüketir. Başarısız işlemler için kredi iadesi yapılır.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Hangi ödeme yöntemleri kabul ediliyor?
            </h4>
            <p className="text-gray-600 text-sm">
              Kredi kartı, banka kartı ve havale ile ödeme yapabilirsiniz. Tüm ödemeler güvenli Stripe altyapısı ile işlenir.
            </p>
          </div>
          

        </div>
      </div>

      {/* Contact Section */}
      <div className="text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-8">
        <h3 className="text-2xl font-bold mb-4">
          Daha fazla krediye mi ihtiyacınız var?
        </h3>
        <p className="text-purple-100 mb-6">
          Kurumsal çözümler ve özel fiyatlandırma için bizimle iletişime geçin.
        </p>
        <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          İletişime Geç
        </button>
      </div>
    </div>
  );
};

export default Subscription;