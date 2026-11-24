import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  Layers,
  MessageCircle,
  ShieldCheck,
  Store,
  X,
  ZoomIn,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { ProductDetailSkeleton } from '../components/Skeletons';
import { useSite } from '../context/SiteContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { getProductById, getRelatedProducts } from '../services/catalogueService';
import type { Product } from '../types';
import {
  buildWhatsAppEnquiryUrl,
  COLOR_SWATCH_MAP,
  formatINR,
  getDiscountPercent,
  getEffectivePrice,
} from '../utils/formatters';

export function ProductDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { siteInfo, categories } = useSite();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [zoomOpen, setZoomOpen] = useState(false);

  useDocumentMeta(
    product ? `${product.brand} ${product.name}` : 'Product Details',
    product?.description || 'View full footwear specifications and enquire on WhatsApp at SPG Footland.'
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setActiveImageIndex(0);

    getProductById(id)
      .then(async (item) => {
        if (!active) return;
        setProduct(item);
        if (item) {
          setSelectedSize(item.sizes[0] || '');
          setSelectedColor(item.colors[0] || '');
          const rel = await getRelatedProducts(item.categorySlug, item.id, 4);
          if (active) setRelated(rel);
        } else {
          setRelated([]);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load product details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-extrabold text-slate-900">
          {error ? 'Unable to load product' : 'Product not found'}
        </h1>
        <p className="mt-2 text-slate-600">
          {error || 'This footwear item may have been removed or is no longer available.'}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
        >
          Return to Catalogue
        </Link>
      </div>
    );
  }

  const category = categories.find((c) => c.slug === product.categorySlug);
  const images = product.images.length > 0 ? product.images : [''];
  const currentImage = images[activeImageIndex] || images[0];
  const effectivePrice = getEffectivePrice(product.price, product.discountPrice);
  const discountPercent = getDiscountPercent(product.price, product.discountPrice);

  const stockStatus =
    product.stock <= 0
      ? { label: 'Out of Stock', tone: 'text-red-700 bg-red-50 border-red-200' }
      : product.stock <= 5
        ? {
            label: `Low Stock — Only ${product.stock} pairs left`,
            tone: 'text-amber-800 bg-amber-50 border-amber-200',
          }
        : { label: 'In Stock — Ready for Pickup / Dispatch', tone: 'text-emerald-800 bg-emerald-50 border-emerald-200' };

  const whatsappUrl = buildWhatsAppEnquiryUrl({
    whatsappNumber: siteInfo.whatsapp || siteInfo.phone,
    productName: product.name,
    brand: product.brand,
    priceText: formatINR(effectivePrice),
    selectedSize,
    selectedColor,
    productUrl: window.location.href,
  });

  return (
    <div className="bg-white pb-20">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            to={`/category/${product.categorySlug}`}
            className="hover:text-slate-900 transition-colors"
          >
            {category?.name || product.categorySlug.replace(/-/g, ' ')}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-slate-900">{product.name}</span>
        </nav>

        {/* Main 2-Column Product Layout */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left: Multi-Image Gallery with Zoom */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
            <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <SafeImage
                src={currentImage}
                alt={`${product.brand} ${product.name}`}
                eager
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
              />
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                aria-label="Zoom product image"
                className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-950/80 px-3 py-2 text-xs font-semibold text-white backdrop-blur-xs hover:bg-orange-500 transition-colors"
              >
                <ZoomIn className="h-4 w-4" />
                <span>Zoom</span>
              </button>
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                    className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-100 transition-all ${
                      idx === activeImageIndex
                        ? 'border-orange-500 ring-2 ring-orange-500/20'
                        : 'border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <SafeImage
                      src={imgUrl}
                      alt={`${product.name} view ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Contiguous Purchase / Enquiry Module */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="text-orange-600">{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span>{product.gender}</span>
                {product.unitsSold >= 200 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-900">Best Seller</span>
                  </>
                )}
              </div>

              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl text-balance">
                {product.name}
              </h1>

              {/* Pricing */}
              <div className="mt-4 flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-3xl font-bold text-slate-950 tabular-nums">
                  {formatINR(effectivePrice)}
                </span>
                {discountPercent > 0 && (
                  <>
                    <span className="font-mono text-lg text-slate-400 line-through tabular-nums">
                      {formatINR(product.price)}
                    </span>
                    <span className="font-mono text-sm font-bold text-orange-600 tabular-nums">
                      Save {discountPercent}% ({formatINR(product.price - effectivePrice)})
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">Inclusive of all taxes · In-store &amp; WhatsApp enquiry pricing</p>
            </div>

            {/* Stock Status */}
            <div className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold ${stockStatus.tone}`}>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{stockStatus.label}</span>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
              {product.description}
            </p>

            {/* UK Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide text-slate-800">
                    Select Size (UK / India)
                  </span>
                  {selectedSize && (
                    <span className="font-mono text-xs font-semibold text-orange-600">
                      Selected: {selectedSize}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {product.sizes.map((size) => {
                    const active = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`rounded-lg border py-2.5 font-mono text-xs font-semibold transition-colors tabular-nums ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors.length > 0 && (
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide text-slate-800">
                    Available Colours
                  </span>
                  {selectedColor && (
                    <span className="text-xs font-semibold text-slate-600">{selectedColor}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const active = selectedColor === color;
                    const swatch = COLOR_SWATCH_MAP[color] || '#94A3B8';
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0"
                          style={{ background: swatch }}
                        />
                        <span>{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WhatsApp Enquiry Primary CTA */}
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#16A34A] px-6 py-4 text-base font-bold text-white shadow-sm hover:bg-[#15803D] transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Enquire on WhatsApp</span>
              </a>
              <p className="mt-2.5 text-center text-xs text-slate-500">
                Opens WhatsApp with product name, selected size, price, and catalogue link pre-filled.
              </p>
            </div>

            {/* Specifications Table */}
            <div className="border-t border-slate-200 pt-5 space-y-3 text-sm">
              <h2 className="font-display text-sm font-bold text-slate-900">Specifications</h2>
              <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                <dt className="text-slate-500">Brand</dt>
                <dd className="font-medium text-slate-900">{product.brand}</dd>
                <dt className="text-slate-500">Material</dt>
                <dd className="font-medium text-slate-900">{product.material || 'Premium Footwear Craft'}</dd>
                <dt className="text-slate-500">Gender</dt>
                <dd className="font-medium text-slate-900">{product.gender}</dd>
                <dt className="text-slate-500">Category</dt>
                <dd className="font-medium text-slate-900">
                  {category?.name || product.categorySlug}
                </dd>
              </dl>

              <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600">
                <div className="flex flex-col gap-1">
                  <ShieldCheck className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-slate-900">100% Genuine</span>
                  <span>Brand-verified pairs</span>
                </div>
                <div className="flex flex-col gap-1">
                  <Store className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-slate-900">In-Store Try-On</span>
                  <span>Reserve via WhatsApp</span>
                </div>
                <div className="flex flex-col gap-1">
                  <Layers className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-slate-900">UK Sizing</span>
                  <span>Expert fit guidance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-20 border-t border-slate-200 pt-14">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-slate-900">
                  Related in {category?.name || 'this collection'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Top-performing pairs shoppers also compare
                </p>
              </div>
              <Link
                to={`/category/${product.categorySlug}`}
                className="text-sm font-semibold text-orange-600 hover:text-orange-700 whitespace-nowrap"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Fullscreen Image Zoom Lightbox */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Close zoom view"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-orange-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="max-h-[88vh] max-w-5xl overflow-hidden rounded-2xl bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <SafeImage
              src={currentImage}
              alt={`${product.brand} ${product.name} zoomed`}
              eager
              className="max-h-[88vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
