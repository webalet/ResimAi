import React from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrencySymbol, getPrice, formatPrice, PricePackage } from '../utils/currency';

interface PriceDisplayProps {
  package: PricePackage;
  className?: string;
  showCredits?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  package: pkg, 
  className = '', 
  showCredits = true 
}) => {
  const { i18n, t } = useTranslation();
  
  const price = getPrice(pkg, i18n.language);
  const formattedPrice = formatPrice(price, i18n.language);
  
  return (
    <div className={`price-display ${className}`}>
      {showCredits && (
        <div className="text-sm text-gray-600 mb-1">
          {pkg.credits} {t('pricing.credits')}
        </div>
      )}
      <div className="text-2xl font-bold text-gray-900">
        {formattedPrice}
      </div>
    </div>
  );
};

export default PriceDisplay;