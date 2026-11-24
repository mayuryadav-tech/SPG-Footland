import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Database } from 'lucide-react';
import { Carousel } from '../components/Carousel';
import { CategorySection } from '../components/CategorySection';
import { ProductGridSkeleton } from '../components/Skeletons';
import { useSite } from '../context/SiteContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { getBanners } from '../services/catalogueService';
import type { Banner } from '../types';

export function HomePage() {
  const { siteInfo, categories, loading: loadingSite, error: siteError } = useSite();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [bannerError, setBannerError] = useState<string | null>(null);

  useDocumentMeta(
    `${siteInfo.shopName} — Athletic & Everyday Footwear Catalogue`,
    'Shop top-selling sneakers, sports shoes, formal shoes, casual shoes, sandals, slippers, boots, and kids footwear at SPG Footland.'
  );

  useEffect(() => {
    let mounted = true;
    setLoadingBanners(true);
    setBannerError(null);

    getBanners(true)
      .then((activeBanners) => {
        if (mounted) setBanners(activeBanners);
      })
      .catch((err) => {
        if (mounted) setBannerError(err instanceof Error ? err.message : 'Unable to load banners.');
      })
      .finally(() => {
        if (mounted) setLoadingBanners(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isEmptyCatalogue = !loadingSite && !loadingBanners && categories.length === 0 && banners.length === 0;

  return (
    <div>
      {/* Hero Carousel directly below Navbar */}
      {bannerError ? (
        <div className="bg-slate-900 px-6 py-12 text-center text-sm text-red-300">
          Unable to load promotional banners right now.
        </div>
      ) : (
        <Carousel banners={banners} loading={loadingBanners} />
      )}

      {/* Quick Category Jump Strip */}
      {categories.length > 0 && (
        <div className="border-b border-slate-200 bg-slate-900">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3.5 sm:px-6 lg:px-8">
            <span className="mr-2 text-xs font-semibold text-slate-400 whitespace-nowrap shrink-0">
              Browse:
            </span>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-orange-500 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty Catalogue Guidance (First Run Before Admin Seeding) */}
      {isEmptyCatalogue && (
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-orange-400">
              <Database className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Your SPG Footland catalogue is ready to launch
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              No footwear collections or banners have been published in Firestore yet. Sign in to
              the Admin Panel and use the one-click <strong>Seed Sample Data</strong> tool to load
              all 8 categories, 5 hero banners, and 64 sample products immediately.
            </p>
            <div className="mt-7 flex justify-center">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
              >
                <span>Open Admin Setup</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Error State */}
      {siteError && (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Unable to load footwear categories from Firestore. Please check your connection and reload.
          </div>
        </div>
      )}

      {/* Loading Skeleton while categories initialize */}
      {loadingSite && (
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-12">
          <div className="space-y-4">
            <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
            <ProductGridSkeleton count={6} />
          </div>
        </div>
      )}

      {/* Separate Category Section for EVERY footwear type */}
      {!loadingSite &&
        categories.map((category, idx) => (
          <CategorySection key={category.id} category={category} index={idx} />
        ))}
    </div>
  );
}
