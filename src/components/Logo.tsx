import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  linkTo?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  showText = true, 
  linkTo,
  onClick 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const LogoContent = () => (
    <div className={`flex items-center ${className}`}>
      <div className="relative group">
        <img 
          src="/images/logo.png" 
          alt="Stylica.ai Logo" 
          className={`${sizeClasses[size]} object-contain transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg`}
        />
        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
      </div>
      {showText && (
        <span className={`ml-2 ${textSizeClasses[size]} font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent transition-all duration-300 hover:from-purple-700 hover:to-blue-700`}>
          Stylica.ai
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link 
        to={linkTo} 
        className="inline-block transition-transform duration-200 hover:scale-105"
        onClick={onClick}
      >
        <LogoContent />
      </Link>
    );
  }

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className="inline-block transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg"
      >
        <LogoContent />
      </button>
    );
  }

  return <LogoContent />;
};

export default Logo;