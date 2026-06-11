import React from 'react';
import defaultLogo from '../assets/images/regenerated_image_1781182006041.png';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  src?: string;
  imgClassName?: string;
}

export default function Logo({ className = '', showText = true, size = 'md', src, imgClassName = '' }: LogoProps) {
  const sizes = {
    sm: 'h-8 md:h-10',
    md: 'h-10 md:h-12 lg:h-14',
    lg: 'h-20 md:h-24 lg:h-32'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={src || defaultLogo} 
        alt="NextFlippers" 
        className={imgClassName ? `${imgClassName} object-contain` : `${sizes[size]} w-auto object-contain`}
      />
    </div>
  );
}
