export interface PricePackage {
  id: string;
  credits: number;
  price_usd: number;
  price_try: number;
}

export const PRICE_PACKAGES: PricePackage[] = [
  { id: 'basic', credits: 10, price_usd: 3, price_try: 100 },
  { id: 'standard', credits: 25, price_usd: 7.5, price_try: 250 },
  { id: 'premium', credits: 50, price_usd: 15, price_try: 500 },
  { id: 'pro', credits: 100, price_usd: 30, price_try: 1000 },
  { id: 'business', credits: 250, price_usd: 75, price_try: 2500 },
  { id: 'enterprise', credits: 500, price_usd: 150, price_try: 5000 }
];

export const getCurrencySymbol = (language: string): string => {
  return language === 'tr' ? '₺' : '$';
};

export const getPrice = (packageItem: PricePackage, language: string): number => {
  return language === 'tr' ? packageItem.price_try : packageItem.price_usd;
};

export const formatPrice = (price: number, language: string): string => {
  const currency = getCurrencySymbol(language);
  if (language === 'tr') {
    return `${price}${currency}`;
  } else {
    return `${currency}${price}`;
  }
};

export const formatNumber = (num: number, language: string): string => {
  if (language === 'tr') {
    return num.toLocaleString('tr-TR');
  } else {
    return num.toLocaleString('en-US');
  }
};