import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { getAllProducts } from '../services/catalogueService';
import type { Product } from '../types';
import { formatINR, getEffectivePrice } from '../utils/formatters';
import { Logo } from './Logo';
import { SafeImage } from './SafeImage';

export function Navbar() {
  const { siteInfo, categories } = useSite();
  const location = useLocation();
  const navigate = useNavigate();

  const [shopOpen, setShopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileShopExpanded, setMobileShopExpanded] = useState(true);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogCache, setCatalogCache] = useState<Product[] | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const shopDropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShopOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(e.target as Node)) {
        setShopOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShopOpen(false);
        setSearchOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const ensureSearchProductsLoaded = async () => {
    if (catalogCache !== null || loadingSearch) return;
    setLoadingSearch(true);
    try {
      const products = await getAllProducts(true);
      setCatalogCache(products);
    } catch {
      setCatalogCache([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleOpenSearch = () => {
    setSearchOpen(true);
    void ensureSearchProductsLoaded();
    window.setTimeout(() => searchInputRef.current?.focus(), 40);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults =
    normalizedQuery.length > 0 && catalogCache
      ? catalogCache
          .filter(
            (p) =>
              p.name.toLowerCase().includes(normalizedQuery) ||
              p.brand.toLowerCase().includes(normalizedQuery) ||
              p.categorySlug.replace(/-/g, ' ').includes(normalizedQuery)
          )
          .slice(0, 6)
      : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      navigate(`/product/${searchResults[0].id}`);
      setSearchOpen(false);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
      isActive
        ? 'text-red-600 border-red-600'
        : 'text-slate-700 border-transparent hover:text-slate-950 hover:border-yellow-400'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b-2 border-yellow-400/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Mark */}
        <Link
          to="/"
          aria-label={`${siteInfo.shopName} Home`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded-lg"
        >
          <Logo shopName={siteInfo.shopName} logoUrl={siteInfo.logoUrl} variant="dark" />
        </Link>

        {/* Zone 2: Primary Desktop Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7"
        >
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>

          <div ref={shopDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setShopOpen((prev) => !prev)}
              aria-expanded={shopOpen}
              className={`inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                location.pathname.startsWith('/category/')
                  ? 'text-red-600 border-red-600'
                  : 'text-slate-700 border-transparent hover:text-slate-950 hover:border-yellow-400'
              }`}
            >
              <span>Shop</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-150 ${shopOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {shopOpen && (
              <div className="absolute left-1/2 top-full mt-3 w-[440px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-display text-xs font-bold tracking-wide text-slate-500">
                    Footwear Categories
                  </span>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {categories.length} Collections
                  </span>
                </div>
                {categories.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">
                    Categories will appear once added in Admin.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        className="group flex flex-col rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-red-600 transition-colors">
                          {cat.name}
                        </span>
                        <span className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                          {cat.description}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <NavLink to="/about" className={navLinkClass}>
            About Us
          </NavLink>

          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
        </nav>

        {/* Zone 3: Search & Mobile Menu Trigger */}
        <div ref={searchContainerRef} className="relative flex items-center gap-2 shrink-0">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shoes, brands..."
                aria-label="Search footwear catalogue"
                className="w-48 sm:w-64 rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                aria-label="Close search"
                className="absolute right-2 rounded p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>

              {normalizedQuery.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                  {loadingSearch ? (
                    <p className="px-3 py-4 text-center text-xs text-slate-500">Searching catalogue...</p>
                  ) : searchResults.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-slate-500">
                      No footwear found for &ldquo;{searchQuery}&rdquo;
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {searchResults.map((product) => (
                        <li key={product.id}>
                          <Link
                            to={`/product/${product.id}`}
                            className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors"
                          >
                            <div className="h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              <SafeImage
                                src={product.images[0]}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold text-slate-500">{product.brand}</p>
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {product.name}
                              </p>
                            </div>
                            <span className="shrink-0 font-mono text-sm font-bold text-slate-900 tabular-nums">
                              {formatINR(getEffectivePrice(product.price, product.discountPrice))}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </form>
          ) : (
            <button
              type="button"
              onClick={handleOpenSearch}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
              aria-label="Search footwear"
            >
              <Search className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Search</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-6 pt-3 md:hidden shadow-lg max-h-[82vh] overflow-y-auto">
          <div className="flex flex-col space-y-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-base font-semibold ${
                  isActive ? 'bg-red-50 text-red-700' : 'text-slate-800 hover:bg-slate-50'
                }`
              }
            >
              Home
            </NavLink>

            <button
              type="button"
              onClick={() => setMobileShopExpanded((prev) => !prev)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold text-slate-800 hover:bg-slate-50"
            >
              <span>Shop Categories</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${mobileShopExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {mobileShopExpanded && (
              <div className="ml-3 grid grid-cols-2 gap-1 border-l-2 border-yellow-400 pl-3 py-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-base font-semibold ${
                  isActive ? 'bg-red-50 text-red-700' : 'text-slate-800 hover:bg-slate-50'
                }`
              }
            >
              About Us
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-base font-semibold ${
                  isActive ? 'bg-red-50 text-red-700' : 'text-slate-800 hover:bg-slate-50'
                }`
              }
            >
              Contact
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
