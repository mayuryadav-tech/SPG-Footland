import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '../types';
import { SafeImage } from './SafeImage';
import { CarouselSkeleton } from './Skeletons';

interface CarouselProps {
  banners: Banner[];
  loading?: boolean;
}

export function Carousel({ banners, loading = false }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = banners.length;

  const goNext = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (currentIndex >= count && count > 0) {
      setCurrentIndex(0);
    }
  }, [count, currentIndex]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = window.setInterval(goNext, 4000);
    return () => window.clearInterval(timer);
  }, [paused, count, goNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(delta) > 40) {
      if (delta > 0) goNext();
      else goPrev();
    }
  };

  if (loading) {
    return <CarouselSkeleton />;
  }

  if (count === 0) {
    return null;
  }

  return (
    <section
      aria-label="Featured footwear promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full overflow-hidden bg-slate-950"
    >
      <div className="relative h-[420px] sm:h-[490px] lg:h-[540px] w-full">
        {banners.map((banner, index) => {
          const isActive = index === currentIndex;
          const isExternal = banner.linkUrl.startsWith('http://') || banner.linkUrl.startsWith('https://');
          return (
            <div
              key={banner.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <SafeImage
                src={banner.imageUrl}
                alt={banner.headline}
                eager={index === 0}
                className="h-full w-full object-cover object-center"
              />
              {/* Measured navy contrast scrim */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

              <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-16 sm:justify-center sm:pb-0 sm:px-8 lg:px-10">
                <div className="max-w-2xl">
                  <p className="font-mono text-xs font-semibold tracking-wider text-orange-400 tabular-nums">
                    Featured Drop 0{index + 1} / 0{count}
                  </p>
                  <h1 className="mt-2.5 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem] text-balance">
                    {banner.headline}
                  </h1>
                  {banner.subtext && (
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">
                      {banner.subtext}
                    </p>
                  )}
                  <div className="mt-7">
                    {isExternal ? (
                      <a
                        href={banner.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors whitespace-nowrap"
                      >
                        <span>Shop Now</span>
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <Link
                        to={banner.linkUrl || '/'}
                        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors whitespace-nowrap"
                      >
                        <span>Shop Now</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Previous / Next Controls */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous banner"
            className="absolute left-3 sm:left-5 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-xs ring-1 ring-white/20 hover:bg-orange-500 hover:ring-orange-500 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next banner"
            className="absolute right-3 sm:right-5 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-xs ring-1 ring-white/20 hover:bg-orange-500 hover:ring-orange-500 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dot Indicators */}
          <div
            className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5"
            role="tablist"
            aria-label="Carousel slide indicators"
          >
            {banners.map((banner, index) => {
              const active = index === currentIndex;
              return (
                <button
                  key={banner.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Show banner ${index + 1}: ${banner.headline}`}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2.5 rounded-full transition-all duration-200 ${
                    active ? 'w-8 bg-orange-500' : 'w-2.5 bg-white/45 hover:bg-white/80'
                  }`}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
