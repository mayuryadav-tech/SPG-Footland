import { SlidersHorizontal, X } from 'lucide-react';
import type { Gender, ProductFilters } from '../types';
import { COLOR_SWATCH_MAP, GENDERS } from '../utils/formatters';

interface FilterSidebarProps {
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
  onReset: () => void;
  availableBrands: string[];
  availableSizes: string[];
  availableColors: string[];
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const PRICE_PRESETS: { label: string; min: number | ''; max: number | '' }[] = [
  { label: 'Under ₹2,000', min: '', max: 2000 },
  { label: '₹2,000 – ₹5,000', min: 2000, max: 5000 },
  { label: '₹5,000 – ₹8,000', min: 5000, max: 8000 },
  { label: 'Above ₹8,000', min: 8000, max: '' },
];

export function FilterSidebar({
  filters,
  onChange,
  onReset,
  availableBrands,
  availableSizes,
  availableColors,
  mobileOpen,
  onCloseMobile,
}: FilterSidebarProps) {
  const toggleItem = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((i) => i !== value) : [...list, value];

  const activeCount =
    filters.brands.length +
    filters.sizes.length +
    filters.colors.length +
    filters.genders.length +
    (filters.minPrice !== '' ? 1 : 0) +
    (filters.maxPrice !== '' ? 1 : 0);

  const filterBody = (
    <div className="space-y-7">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-700" />
          <h2 className="font-display text-base font-bold text-slate-900">Filters</h2>
          {activeCount > 0 && (
            <span className="font-mono text-xs font-semibold text-orange-600 tabular-nums">
              ({activeCount})
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Gender */}
      <div>
        <h3 className="text-xs font-bold tracking-wide text-slate-700 mb-3">Gender</h3>
        <div className="grid grid-cols-2 gap-2">
          {GENDERS.map((g: Gender) => {
            const selected = filters.genders.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => onChange({ ...filters, genders: toggleItem(filters.genders, g) })}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  selected
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-bold tracking-wide text-slate-700 mb-3">Price Range (INR)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min ₹"
            value={filters.minPrice}
            onChange={(e) =>
              onChange({
                ...filters,
                minPrice: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
              })
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none tabular-nums"
          />
          <input
            type="number"
            min={0}
            placeholder="Max ₹"
            value={filters.maxPrice}
            onChange={(e) =>
              onChange({
                ...filters,
                maxPrice: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
              })
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none tabular-nums"
          />
        </div>
        <div className="mt-2.5 flex flex-col gap-1.5">
          {PRICE_PRESETS.map((preset) => {
            const isSelected =
              filters.minPrice === preset.min && filters.maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    minPrice: isSelected ? '' : preset.min,
                    maxPrice: isSelected ? '' : preset.max,
                  })
                }
                className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-orange-50 font-semibold text-orange-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brands */}
      {availableBrands.length > 0 && (
        <div>
          <h3 className="text-xs font-bold tracking-wide text-slate-700 mb-3">Brand</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {availableBrands.map((brand) => {
              const checked = filters.brands.includes(brand);
              return (
                <label
                  key={brand}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 hover:text-slate-950"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange({ ...filters, brands: toggleItem(filters.brands, brand) })
                    }
                    className="h-4 w-4 rounded border-slate-300 accent-orange-500"
                  />
                  <span>{brand}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* UK Sizes */}
      {availableSizes.length > 0 && (
        <div>
          <h3 className="text-xs font-bold tracking-wide text-slate-700 mb-3">Size (UK / India)</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {availableSizes.map((size) => {
              const selected = filters.sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChange({ ...filters, sizes: toggleItem(filters.sizes, size) })}
                  className={`rounded-lg border px-2 py-2 font-mono text-xs font-semibold transition-colors tabular-nums ${
                    selected
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
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
      {availableColors.length > 0 && (
        <div>
          <h3 className="text-xs font-bold tracking-wide text-slate-700 mb-3">Colour</h3>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => {
              const selected = filters.colors.includes(color);
              const swatch = COLOR_SWATCH_MAP[color] || '#94A3B8';
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    onChange({ ...filters, colors: toggleItem(filters.colors, color) })
                  }
                  className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
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
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5">
          {filterBody}
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <span className="font-display text-base font-bold text-slate-900">Filter Products</span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close filters"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filterBody}</div>
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-orange-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
