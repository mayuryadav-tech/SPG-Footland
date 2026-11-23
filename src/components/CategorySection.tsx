import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Category, Product } from '../types';
import { getTopProductsByCategory } from '../services/catalogueService';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from './Skeletons';

interface CategorySectionProps {
  category: Category;
  index: number;
}

export function CategorySection({ category, index }: CategorySectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getTopProductsByCategory(category.slug, 6)
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load products.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category.slug]);

  const bgTone = index % 2 === 1 ? 'bg-slate-50/80' : 'bg-white';

  return (
    <section className={`${bgTone} border-b border-slate-200/70 py-14 sm:py-16`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {category.name}
            </h2>
            {category.description && (
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 sm:text-base">
                {category.description}
              </p>
            )}
          </div>

          <Link
            to={`/category/${category.slug}`}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-red-600 bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-yellow-400 hover:border-yellow-400 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 sm:self-auto"
          >
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Could not load {category.name}. Please refresh the page.
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="font-display text-base font-bold text-slate-900">
              No {category.name.toLowerCase()} listed yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Check back soon or browse our other footwear collections.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} showBestSeller />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
