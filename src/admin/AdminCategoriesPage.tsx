import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Edit2, Plus, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImageUploader } from '../components/ImageUploader';
import { SafeImage } from '../components/SafeImage';
import { useSite } from '../context/SiteContext';
import { useToast } from '../context/ToastContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import {
  deleteCategory,
  getCategories,
  reorderCategories,
  saveCategory,
} from '../services/catalogueService';
import type { Category } from '../types';
import { slugify } from '../utils/formatters';

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  bannerUrl: string;
  order: string;
}

export function AdminCategoriesPage() {
  const { refreshSiteData } = useSite();
  const { showToast } = useToast();
  useDocumentMeta('Manage Categories — SPG Footland Admin');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>({
    name: '',
    slug: '',
    description: '',
    bannerUrl: '',
    order: '1',
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getCategories();
      setCategories(list);
    } catch {
      showToast('Failed to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      bannerUrl: '',
      order: String(categories.length + 1),
    });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      bannerUrl: cat.bannerUrl,
      order: String(cat.order),
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Category name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveCategory(
        {
          name: form.name.trim(),
          slug: slugify(form.slug || form.name),
          description: form.description.trim(),
          bannerUrl: form.bannerUrl.trim(),
          order: Number(form.order) || categories.length + 1,
        },
        editing?.id
      );
      showToast(editing ? `Updated "${form.name}"` : `Created category "${form.name}"`, 'success');
      setModalOpen(false);
      await Promise.all([loadCategories(), refreshSiteData()]);
    } catch {
      showToast('Failed to save category.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const reordered = [...categories];
    const temp = reordered[index];
    reordered[index] = reordered[target];
    reordered[target] = temp;
    setCategories(reordered.map((c, idx) => ({ ...c, order: idx + 1 })));

    try {
      await reorderCategories(reordered);
      await refreshSiteData();
      showToast('Category order updated.', 'success');
    } catch {
      showToast('Could not reorder categories.', 'error');
      void loadCategories();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget);
      showToast(`Deleted "${deleteTarget.name}"`, 'success');
      setDeleteTarget(null);
      await Promise.all([loadCategories(), refreshSiteData()]);
    } catch {
      showToast('Could not delete category.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Categories</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage footwear types, category banners, and homepage display order.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors whitespace-nowrap sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display text-base font-bold text-slate-900">No categories yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add categories manually or use Seed Sample Data on the Dashboard.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <span className="w-6 font-mono text-xs font-bold text-slate-500 tabular-nums">
                          #{cat.order}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleMove(idx, -1)}
                          disabled={idx === 0}
                          aria-label={`Move ${cat.name} up`}
                          className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMove(idx, 1)}
                          disabled={idx === categories.length - 1}
                          aria-label={`Move ${cat.name} down`}
                          className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <SafeImage
                            src={cat.bannerUrl}
                            alt={cat.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="font-semibold text-slate-900 whitespace-nowrap">
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                      /{cat.slug}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-md">
                      <p className="line-clamp-2">{cat.description}</p>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          aria-label={`Edit ${cat.name}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
                          aria-label={`Delete ${cat.name}`}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1C0A0C]/70 p-4 sm:py-12 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="font-display text-xl font-bold text-slate-900">
                {editing ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close category form"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={form.name}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        name: nextName,
                        slug: editing ? prev.slug : slugify(nextName),
                      }));
                    }}
                    placeholder="Sneakers"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Slug *</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                    placeholder="sneakers"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-sm focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800">Display Order</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className="mt-1.5 w-28 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-red-600 focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800">Description</label>
                <textarea
                  rows={3}
                  maxLength={400}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short tagline shown on homepage and category page..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-red-600 focus:outline-none"
                />
              </div>

              <ImageUploader
                folder="categories"
                images={form.bannerUrl ? [form.bannerUrl] : []}
                onChange={(imgs) => setForm({ ...form, bannerUrl: imgs[0] || '' })}
                multiple={false}
                label="Category Banner Image"
              />

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editing ? 'Save Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete category "${deleteTarget?.name || ''}"?`}
        description="Removing this category hides its homepage section and deletes its banner image from Storage."
        confirmLabel="Delete Category"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
