import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  width?: number | string;
  height?: number | string;
  withBadge?: boolean;
  alt?: string;
  variant?: 'badge' | 'icon';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size,
  width,
  height,
  withBadge,
  alt = 'Playlist Plug',
  variant = 'badge'
}) => {
  const computedHeight = height || size || 38;
  const isSquare = variant === 'icon';

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none group transition-transform duration-200 hover:scale-[1.03] ${className}`}
      title="Playlist Plug"
      style={{
        height: typeof computedHeight === 'number' ? `${computedHeight}px` : computedHeight,
        width: isSquare
          ? (typeof computedHeight === 'number' ? `${computedHeight}px` : computedHeight)
          : (width ? (typeof width === 'number' ? `${width}px` : width) : 'auto')
      }}
    >
      <img
        src={isSquare ? '/favicon.svg' : '/logo.svg'}
        alt={alt}
        className="h-full w-auto max-w-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,168,38,0.25)]"
      />
    </div>
  );
};
