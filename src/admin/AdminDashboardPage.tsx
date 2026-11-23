import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Database,
  FolderKanban,
  Mail,
  Package,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SafeImage } from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { useToast } from '../context/ToastContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import {
  getAllProducts,
  getCategories,
  getEnquiries,
  seedSampleData,
} from '../services/catalogueService';
import type { Category, Enquiry, Product } from '../types';
import { formatINR, getEffectivePrice } from '../utils/formatters';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const { refreshSiteData } = useSite();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useDocumentMeta('Admin Dashboard — SPG Footland');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats, enqs] = await Promise.all([
        getAllProducts(false),
        getCategories(),
        getEnquiries(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setEnquiries(enqs);
    } catch {
      showToast('Could not load dashboard metrics from Firestore.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const summary = await seedSampleData(user?.email);
      setSeedConfirmOpen(false);
      await Promise.all([loadDashboard(), refreshSiteData()]);
      showToast(
        `Seeded ${summary.categories} categories, ${summary.banners} banners, and ${summary.products} sample products!`,
        'success'
      );
    } catch {
      showToast('Sample data seeding failed. Check console or Firestore rules.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const unreadEnquiries = useMemo(() => enquiries.filter((e) => !e.read).length, [enquiries]);
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock),
    [products]
  );
  const topFiveBestSellers = useMemo(
    () => [...products].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5),
    [products]
  );

  const productsPerCategory = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      counts.set(p.categorySlug, (counts.get(p.categorySlug) || 0) + 1);
    });
    return categories.map((cat) => ({
      ...cat,
      count: counts.get(cat.slug) || 0,
    }));
  }, [categories, products]);

  const maxCategoryCount = Math.max(1, ...productsPerCategory.map((c) => c.count));

  return (
    <div className="space-y-8">
      {/* Page Header & One-Click Seed Sample Data */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Store Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Live catalogue inventory, best-seller velocity, and customer enquiries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setSeedConfirmOpen(true)}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors whitespace-nowrap"
          >
            <Database className="h-4 w-4" />
            <span>Seed Sample Data</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Products</span>
            <Package className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold text-slate-950 tabular-nums">
            {loading ? '—' : products.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            {products.filter((p) => p.active).length} active in storefront
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Categories</span>
            <FolderKanban className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold text-slate-950 tabular-nums">
            {loading ? '—' : categories.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Footwear types live</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Enquiries</span>
            <Mail className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold text-slate-950 tabular-nums">
            {loading ? '—' : enquiries.length}
          </p>
          <p className="mt-1 text-xs font-medium text-red-600 font-mono tabular-nums">
            {unreadEnquiries} unread
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Low-Stock Alerts</span>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </div>
          <p className="mt-3 font-mono text-3xl font-bold text-slate-950 tabular-nums">
            {loading ? '—' : lowStockProducts.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">5 or fewer pairs left</p>
        </div>
      </div>

      {/* Category Distribution & Low Stock Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Products per Category */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Products per Category</h2>
            <Link
              to="/admin/categories"
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Manage categories →
            </Link>
          </div>

          {productsPerCategory.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No categories found. Click &ldquo;Seed Sample Data&rdquo; to create all 8 categories
              and 64 products.
            </p>
          ) : (
            <div className="space-y-3.5">
              {productsPerCategory.map((cat) => {
                const widthPct = Math.max(4, Math.round((cat.count / maxCategoryCount) * 100));
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-800">{cat.name}</span>
                      <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
                        {cat.count} products
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-yellow-100/80">
                      <div
                        className="h-full rounded-full bg-red-600 transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Low Stock Items */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Low-Stock Items</h2>
            <Link
              to="/admin/products"
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Restock →
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              All products are well stocked above 5 units.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStockProducts.slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.brand} · {item.categorySlug}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-xs font-bold tabular-nums ${
                      item.stock === 0 ? 'text-red-600' : 'text-amber-700'
                    }`}
                  >
                    {item.stock === 0 ? 'Out of stock' : `${item.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Top 5 Best-Selling Products */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Top 5 Best-Selling Products
            </h2>
          </div>
          <Link
            to="/admin/products"
            className="text-xs font-semibold text-red-600 hover:text-red-700"
          >
            View all products →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="px-6 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-6 py-3 text-right">Units Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topFiveBestSellers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    No products available yet.
                  </td>
                </tr>
              ) : (
                topFiveBestSellers.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <SafeImage
                            src={prod.images[0]}
                            alt={prod.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{prod.name}</p>
                          <p className="text-xs text-slate-500">{prod.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">
                      {prod.categorySlug.replace(/-/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatINR(getEffectivePrice(prod.price, prod.discountPrice))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 tabular-nums">
                      {prod.stock}
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-bold text-red-600 tabular-nums">
                      {prod.unitsSold.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={seedConfirmOpen}
        title="Seed SPG Footland Sample Catalogue?"
        description="This will write default Site Info, all 8 footwear categories, 5 homepage carousel banners, and 64 realistic INR footwear products (8 per category) into Firestore using deterministic IDs (safe to re-run without creating duplicates)."
        confirmLabel="Seed Sample Data"
        destructive={false}
        loading={seeding}
        onConfirm={() => void handleSeed()}
        onCancel={() => setSeedConfirmOpen(false)}
      />
    </div>
  );
}
