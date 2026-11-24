import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDownWideNarrow, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { FilterSidebar } from '../components/FilterSidebar';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { ProductGridSkeleton } from '../components/Skeletons';
import { useSite } from '../context/SiteContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { getCategoryBySlug, getProductsByCategory } from '../services/catalogueService';
import type { Category, Product, ProductFilters, SortOption } from '../types';
import { getEffectivePrice, getTimestampMillis } from '../utils/formatters';

const EMPTY_FILTERS: ProductFilters = {
  brands: [],
  minPrice: '',
  maxPrice: '',
  sizes: [],
  colors: [],
  genders: [],
};

const PAGE_INCREMENT = 9;

export function CategoryPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { categories } = useSite();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('most-sold');
  const [visibleCount, setVisibleCount] = useState(PAGE_INCREMENT);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useDocumentMeta(
    category ? `${category.name} — SPG Footland` : 'Footwear Collection — SPG Footland',
    category?.description || 'Browse our footwear collection in UK sizes with instant WhatsApp enquiry.'
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setFilters(EMPTY_FILTERS);
    setSortBy('most-sold');
    setVisibleCount(PAGE_INCREMENT);

    const cachedCat = categories.find((c) => c.slug === slug) || null;

    Promise.all([
      cachedCat ? Promise.resolve(cachedCat) : getCategoryBySlug(slug),
      getProductsByCategory(slug),
    ])
      .then(([cat, prods]) => {
        if (!active) return;
        setCategory(cat);
        setProducts(prods);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load category.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, categories]);

  const availableBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort(),
    [products]
  );

  const availableSizes = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.sizes))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [products]
  );

  const availableColors = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.colors))).sort(),
    [products]
  );

  const filteredAndSorted = useMemo(() => {
    const filtered = products.filter((p) => {
      const effectivePrice = getEffectivePrice(p.price, p.discountPrice);
      if (filters.brands.length > 0 && !filters.brands.includes(p.brand)) return false;
      if (filters.genders.length > 0 && !filters.genders.includes(p.gender)) return false;
      if (filters.sizes.length > 0 && !p.sizes.some((s) => filters.sizes.includes(s))) return false;
      if (filters.colors.length > 0 && !p.colors.some((c) => filters.colors.includes(c))) return false;
      if (filters.minPrice !== '' && effectivePrice < filters.minPrice) return false;
      if (filters.maxPrice !== '' && effectivePrice > filters.maxPrice) return false;
      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      const priceA = getEffectivePrice(a.price, a.discountPrice);
      const priceB = getEffectivePrice(b.price, b.discountPrice);
      switch (sortBy) {
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'newest':
          return getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
        case 'most-sold':
        default:
          return b.unitsSold - a.unitsSold;
      }
    });
    return sorted;
  }, [products, filters, sortBy]);

  const displayedProducts = filteredAndSorted.slice(0, visibleCount);
  const remaining = Math.max(0, filteredAndSorted.length - displayedProducts.length);

  const activeFilterCount =
    filters.brands.length +
    filters.sizes.length +
    filters.colors.length +
    filters.genders.length +
    (filters.minPrice !== '' ? 1 : 0) +
    (filters.maxPrice !== '' ? 1 : 0);

  if (!loading && !category && !error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-extrabold text-slate-900">Category not found</h1>
        <p className="mt-2 text-slate-600">
          The footwear category you requested could not be located.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 pb-20">
      {/* Category Hero Banner */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {category?.bannerUrl && (
          <SafeImage
            src={category.bannerUrl}
            alt={category.name}
            eager
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-orange-400 font-medium">{category?.name || slug}</span>
          </nav>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            {category?.name || 'Loading collection...'}
          </h1>
          {category?.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
              {category.description}
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="font-mono text-xs text-orange-600 tabular-nums">
                  ({activeFilterCount})
                </span>
              )}
            </button>
            <p className="text-sm text-slate-600 font-mono tabular-nums">
              {loading
                ? 'Loading products...'
                : `${filteredAndSorted.length} ${filteredAndSorted.length === 1 ? 'pair' : 'pairs'} available`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ArrowDownWideNarrow className="h-4 w-4 text-slate-500" />
            <label htmlFor="category-sort" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Sort by
            </label>
            <select
              id="category-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="most-sold">Most Sold</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>

        {/* Sidebar + Product Grid */}
        <div className="flex items-start gap-8">
          <FilterSidebar
            filters={filters}
            onChange={(next) => {
              setFilters(next);
              setVisibleCount(PAGE_INCREMENT);
            }}
            onReset={() => {
              setFilters(EMPTY_FILTERS);
              setVisibleCount(PAGE_INCREMENT);
            }}
            availableBrands={availableBrands}
            availableSizes={availableSizes}
            availableColors={availableColors}
            mobileOpen={mobileFiltersOpen}
            onCloseMobile={() => setMobileFiltersOpen(false)}
          />

          <div className="min-w-0 flex-1">
            {loading ? (
              <ProductGridSkeleton count={6} />
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
                {error}
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  No footwear matches these filters
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Try widening your price range or clearing a few brand, size, or colour filters.
                </p>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {displayedProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      showBestSeller={sortBy === 'most-sold' && index < 3}
                    />
                  ))}
                </div>

                {remaining > 0 && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_INCREMENT)}
                      className="rounded-lg border border-slate-900 bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                      Load More ({remaining} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
