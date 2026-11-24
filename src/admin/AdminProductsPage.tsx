import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { AdminTable, type AdminColumn } from '../components/AdminTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImageUploader } from '../components/ImageUploader';
import { SafeImage } from '../components/SafeImage';
import { useToast } from '../context/ToastContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import {
  deleteProduct,
  getAllProducts,
  getCategories,
  saveProduct,
  type ProductPayloadInput,
} from '../services/catalogueService';
import type { Category, Gender, Product } from '../types';
import {
  ADULT_UK_SIZES,
  COMMON_COLORS,
  formatINR,
  GENDERS,
  getEffectivePrice,
  KIDS_UK_SIZES,
} from '../utils/formatters';

const PAGE_SIZE = 10;

interface ProductFormState {
  name: string;
  brand: string;
  categoryId: string;
  description: string;
  price: string;
  discountPrice: string;
  sizes: string[];
  colors: string[];
  gender: Gender;
  material: string;
  stock: string;
  unitsSold: string;
  images: string[];
  featured: boolean;
  active: boolean;
}

const createInitialForm = (defaultCategoryId: string): ProductFormState => ({
  name: '',
  brand: '',
  categoryId: defaultCategoryId,
  description: '',
  price: '',
  discountPrice: '',
  sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
  colors: ['Navy'],
  gender: 'Men',
  material: '',
  stock: '15',
  unitsSold: '0',
  images: [],
  featured: false,
  active: true,
});

export function AdminProductsPage() {
  const { showToast } = useToast();
  useDocumentMeta('Manage Products — SPG Footland Admin');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortKey, setSortKey] = useState('unitsSold');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(createInitialForm(''));
  const [customColor, setCustomColor] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([getAllProducts(false), getCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      showToast('Failed to load products from Firestore.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categoryNameMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) return false;
      if (q) {
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.categorySlug.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'price':
          cmp = getEffectivePrice(a.price, a.discountPrice) - getEffectivePrice(b.price, b.discountPrice);
          break;
        case 'stock':
          cmp = a.stock - b.stock;
          break;
        case 'unitsSold':
        default:
          cmp = a.unitsSold - b.unitsSold;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [products, search, categoryFilter, sortKey, sortDir]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const openCreateModal = () => {
    if (categories.length === 0) {
      showToast('Please create at least one category (or seed sample data) before adding products.', 'error');
      return;
    }
    setEditingProduct(null);
    setForm(createInitialForm(categories[0].id));
    setFormError(null);
    setCustomColor('');
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      brand: product.brand,
      categoryId: product.categoryId,
      description: product.description,
      price: String(product.price),
      discountPrice: product.discountPrice !== null ? String(product.discountPrice) : '',
      sizes: [...product.sizes],
      colors: [...product.colors],
      gender: product.gender,
      material: product.material,
      stock: String(product.stock),
      unitsSold: String(product.unitsSold),
      images: [...product.images],
      featured: product.featured,
      active: product.active,
    });
    setFormError(null);
    setCustomColor('');
    setModalOpen(true);
  };

  const toggleSize = (size: string) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const toggleColor = (color: string) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  const handleAddCustomColor = () => {
    const trimmed = customColor.trim();
    if (!trimmed) return;
    if (!form.colors.includes(trimmed)) {
      setForm((prev) => ({ ...prev, colors: [...prev.colors, trimmed].slice(0, 15) }));
    }
    setCustomColor('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = Number(form.price);
    const discountNum = form.discountPrice.trim() !== '' ? Number(form.discountPrice) : null;
    const stockNum = Number(form.stock);
    const unitsSoldNum = Number(form.unitsSold);

    if (!form.name.trim() || !form.brand.trim()) {
      setFormError('Product name and brand are required.');
      return;
    }
    const selectedCategory = categories.find((c) => c.id === form.categoryId);
    if (!selectedCategory) {
      setFormError('Please select a valid category.');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setFormError('Price must be a valid positive amount in INR.');
      return;
    }
    if (discountNum !== null && (!Number.isFinite(discountNum) || discountNum < 0 || discountNum > priceNum)) {
      setFormError('Discount price must be less than or equal to the regular price.');
      return;
    }
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      setFormError('Stock quantity must be 0 or greater.');
      return;
    }

    const payload: ProductPayloadInput = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      categoryId: selectedCategory.id,
      categorySlug: selectedCategory.slug,
      description: form.description.trim(),
      price: priceNum,
      discountPrice: discountNum && discountNum > 0 ? discountNum : null,
      sizes: form.sizes,
      colors: form.colors,
      gender: form.gender,
      material: form.material.trim(),
      stock: stockNum,
      unitsSold: Number.isFinite(unitsSoldNum) && unitsSoldNum >= 0 ? unitsSoldNum : 0,
      images: form.images,
      featured: form.featured,
      active: form.active,
    };

    setSaving(true);
    try {
      await saveProduct(payload, editingProduct?.id);
      showToast(
        editingProduct ? `Updated "${payload.name}"` : `Added "${payload.name}" to catalogue`,
        'success'
      );
      setModalOpen(false);
      await loadData();
    } catch {
      setFormError('Failed to save product. Verify all fields and try again.');
      showToast('Could not save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget);
      showToast(`Deleted "${deleteTarget.name}"`, 'success');
      setDeleteTarget(null);
      await loadData();
    } catch {
      showToast('Failed to delete product.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns: AdminColumn<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: (prod) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <SafeImage src={prod.images[0]} alt={prod.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{prod.name}</p>
            <p className="text-xs text-slate-500">
              {prod.brand} · {prod.gender}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (prod) => (
        <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
          {categoryNameMap.get(prod.categoryId) || prod.categorySlug}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price (INR)',
      align: 'right',
      sortable: true,
      render: (prod) => (
        <div className="font-mono tabular-nums whitespace-nowrap">
          <p className="font-semibold text-slate-900">
            {formatINR(getEffectivePrice(prod.price, prod.discountPrice))}
          </p>
          {prod.discountPrice && prod.discountPrice < prod.price && (
            <p className="text-[11px] text-slate-400 line-through">{formatINR(prod.price)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      sortable: true,
      render: (prod) => (
        <span
          className={`font-mono text-xs font-bold tabular-nums ${
            prod.stock === 0
              ? 'text-red-600'
              : prod.stock <= 5
                ? 'text-amber-700'
                : 'text-slate-700'
          }`}
        >
          {prod.stock}
        </span>
      ),
    },
    {
      key: 'unitsSold',
      header: 'Sold',
      align: 'right',
      sortable: true,
      render: (prod) => (
        <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
          {prod.unitsSold.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (prod) => (
        <span
          className={`text-xs font-semibold whitespace-nowrap ${
            prod.active ? 'text-emerald-700' : 'text-slate-400'
          }`}
        >
          {prod.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (prod) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openEditModal(prod)}
            aria-label={`Edit ${prod.name}`}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(prod)}
            aria-label={`Delete ${prod.name}`}
            className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const sizeOptions = form.gender === 'Kids' ? KIDS_UK_SIZES : ADULT_UK_SIZES;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-600">
            Add, edit, price, and organize footwear listings across all categories.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors whitespace-nowrap sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      <AdminTable
        columns={columns}
        data={paginatedProducts}
        rowKey={(p) => p.id}
        loading={loading}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search product name or brand..."
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={filteredProducts.length}
        onPageChange={setPage}
        emptyTitle="No products found"
        emptyDescription="Add your first footwear product or seed sample data from the Dashboard."
        toolbarExtra={
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        }
      />

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/65 p-4 sm:py-10 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="font-display text-xl font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close product form"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Product Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Velocity Nitro Pro Runner"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Brand *</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="Nike, Adidas, Clarks..."
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Category *</label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800">Gender *</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800">Material</label>
                  <input
                    type="text"
                    maxLength={120}
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                    placeholder="Full-Grain Leather, Mesh..."
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={500000}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-orange-500 focus:outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Discount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    max={500000}
                    value={form.discountPrice}
                    onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                    placeholder="Optional"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-orange-500 focus:outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100000}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-orange-500 focus:outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Units Sold</label>
                  <input
                    type="number"
                    min={0}
                    max={10000000}
                    value={form.unitsSold}
                    onChange={(e) => setForm({ ...form, unitsSold: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-orange-500 focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800">Description</label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe cushioning, sole grip, fit, and recommended use..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* UK Sizes Multi-select */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Available UK / India Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((sz) => {
                    const active = form.sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSize(sz)}
                        className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors Multi-select */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Colours</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...COMMON_COLORS, ...form.colors])).map((color) => {
                    const active = form.colors.includes(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleColor(color)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 flex max-w-xs gap-2">
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="Add custom colour..."
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Multiple Images */}
              <ImageUploader
                folder="products"
                images={form.images}
                onChange={(next) => setForm({ ...form, images: next })}
                multiple
                maxImages={8}
                label="Product Images"
                helperText="First image is shown on storefront cards. Use arrows to reorder."
              />

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 border-t border-slate-200 pt-4">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="h-4 w-4 rounded accent-orange-500"
                  />
                  <span>Active (visible in storefront)</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="h-4 w-4 rounded accent-orange-500"
                  />
                  <span>Featured Product</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.name || ''}"?`}
        description="This permanently removes the product from Firestore and deletes any uploaded images stored in Firebase Storage."
        confirmLabel="Delete Product"
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
