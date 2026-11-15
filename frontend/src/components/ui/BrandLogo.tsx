import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  withConnect?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  animated,
  withConnect = true,
}) => {
  const sizeClasses = {
    sm: 'text-[18px] sm:text-[20px] tracking-[-0.9px]',
    md: 'text-[22px] sm:text-[25px] tracking-[-1.1px]',
    lg: 'text-[25px] sm:text-[28px] tracking-[-1.3px]',
    xl: 'text-[30px] sm:text-[34px] tracking-[-1.5px]',
  };

  return (
    <span
      className={`font-brand font-extrabold text-[#102641] select-none inline-flex items-baseline leading-none ${sizeClasses[size]} ${className}`}
    >
      <span>Sterling</span>
      {withConnect && (
        <span className="text-[#087b63] font-bold ml-1">Connect</span>
      )}
    </span>
  );
};
