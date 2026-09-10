import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  withBadge?: boolean;
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 40,
  withBadge = true,
  alt = 'Brand Logo'
}) => {
  return (
    <div
      className={`relative flex items-center justify-center flex-shrink-0 select-none group transition-transform duration-200 hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
      title="Submit Plug"
    >
      {withBadge ? (
        <div className="w-full h-full rounded-xl bg-[#191919] border border-[#333333] p-1.5 flex items-center justify-center shadow-md shadow-black/40 aspect-square">
          <img
            src="/logo.svg"
            alt={alt}
            width={size}
            height={size}
            className="w-full h-full object-contain aspect-square filter drop-shadow-[0_2px_8px_rgba(190,30,47,0.3)]"
          />
        </div>
      ) : (
        <img
          src="/logo.svg"
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-contain aspect-square filter drop-shadow-[0_2px_8px_rgba(190,30,47,0.3)]"
        />
      )}
    </div>
  );
};
