import { useEffect, useState } from 'react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  eager?: boolean;
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  eager = false,
}: SafeImageProps) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200/80 to-slate-100 text-slate-400 ${className}`}
      >
        <svg
          viewBox="0 0 64 64"
          className="h-12 w-12 opacity-60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M9 39.5C9 36.8 10.9 34.7 13.6 34.2L24.5 32.1L31.4 21.4C32.5 19.7 34.8 19.3 36.4 20.6L39.6 23.1C41.4 24.5 43.6 25.3 45.9 25.3H48.5C51.5 25.3 54 27.8 54 30.8V40.5C54 42.7 52.2 44.5 50 44.5H13C10.8 44.5 9 42.7 9 40.5V39.5Z"
            fill="currentColor"
          />
          <rect x="11" y="46" width="41" height="4" rx="2" fill="currentColor" opacity="0.65" />
        </svg>
        {fallbackTitle && (
          <span className="mt-2 max-w-[80%] truncate text-xs font-medium text-slate-500">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
