import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatINR, getDiscountPercent, getEffectivePrice } from '../utils/formatters';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
  showBestSeller?: boolean;
}

export function ProductCard({ product, showBestSeller = false }: ProductCardProps) {
  const effectivePrice = getEffectivePrice(product.price, product.discountPrice);
  const discountPercent = getDiscountPercent(product.price, product.discountPrice);
  const visibleSizes = product.sizes.slice(0, 4);
  const remainingSizes = Math.max(0, product.sizes.length - visibleSizes.length);

  return (
    <Link
      to={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
    >
      {/* 4:3 Uniform Studio Image Frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <SafeImage
          src={product.images[0]}
          alt={`${product.brand} ${product.name}`}
          fallbackTitle={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {showBestSeller && (
          <span className="absolute left-3 top-3 rounded bg-slate-900/90 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white backdrop-blur-xs">
            Best Seller
          </span>
        )}

        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
            <span className="rounded bg-white px-3 py-1 text-xs font-bold text-slate-900">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-600 truncate">{product.brand}</span>
            <span className="shrink-0">{product.gender}</span>
          </div>

          <h3 className="mt-1 line-clamp-1 font-display text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-base font-bold text-slate-950 tabular-nums">
              {formatINR(effectivePrice)}
            </span>
            {discountPercent > 0 && (
              <>
                <span className="font-mono text-xs text-slate-400 line-through tabular-nums">
                  {formatINR(product.price)}
                </span>
                <span className="font-mono text-xs font-bold text-orange-600 tabular-nums">
                  {discountPercent}% off
                </span>
              </>
            )}
          </div>

          {product.sizes.length > 0 && (
            <p className="truncate text-xs text-slate-500 font-mono tabular-nums">
              {visibleSizes.join(' · ')}
              {remainingSizes > 0 ? ` +${remainingSizes}` : ''}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
