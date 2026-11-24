interface LogoProps {
  shopName?: string;
  logoUrl?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({
  shopName = 'SPG Footland',
  logoUrl = '',
  variant = 'dark',
  size = 'md',
}: LogoProps) {
  const iconBox =
    size === 'sm' ? 'h-8 w-8 rounded-lg' : size === 'lg' ? 'h-11 w-11 rounded-xl' : 'h-9 w-9 rounded-lg';
  const textSize =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${shopName} logo`}
          referrerPolicy="no-referrer"
          className={`${iconBox} object-contain bg-white p-0.5`}
        />
      ) : (
        <span
          className={`${iconBox} inline-flex items-center justify-center ${
            variant === 'light'
              ? 'bg-orange-500 ring-1 ring-white/15'
              : 'bg-slate-900 ring-1 ring-slate-900/10'
          }`}
        >
          <svg
            viewBox="0 0 64 64"
            className="h-6 w-6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M9 39.5C9 36.8 10.9 34.7 13.6 34.2L24.5 32.1L31.4 21.4C32.5 19.7 34.8 19.3 36.4 20.6L39.6 23.1C41.4 24.5 43.6 25.3 45.9 25.3H48.5C51.5 25.3 54 27.8 54 30.8V40.5C54 42.7 52.2 44.5 50 44.5H13C10.8 44.5 9 42.7 9 40.5V39.5Z"
              fill={variant === 'light' ? '#FFFFFF' : '#F97316'}
            />
            <path
              d="M11 45.5H52.5V48.5C52.5 50.2 51.1 51.5 49.5 51.5H14C12.3 51.5 11 50.2 11 48.5V45.5Z"
              fill={variant === 'light' ? '#0F172A' : '#FFFFFF'}
            />
            <path
              d="M27.5 31L33 35.5"
              stroke={variant === 'light' ? '#F97316' : '#0F172A'}
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <path
              d="M32.5 26.5L37.5 30.5"
              stroke={variant === 'light' ? '#F97316' : '#0F172A'}
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      <span
        className={`font-display font-extrabold tracking-tight ${textSize} ${
          variant === 'light' ? 'text-white' : 'text-slate-900'
        }`}
      >
        {shopName.startsWith('SPG ') ? (
          <>
            <span>SPG </span>
            <span className={variant === 'light' ? 'text-orange-400' : 'text-orange-500'}>
              {shopName.slice(4)}
            </span>
          </>
        ) : (
          shopName
        )}
      </span>
    </span>
  );
}
