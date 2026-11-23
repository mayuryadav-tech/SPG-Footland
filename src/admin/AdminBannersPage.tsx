import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Edit2, Plus, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImageUploader } from '../components/ImageUploader';
import { SafeImage } from '../components/SafeImage';
import { useSite } from '../context/SiteContext';
import { useToast } from '../context/ToastContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { deleteBanner, getBanners, saveBanner } from '../services/catalogueService';
import type { Banner } from '../types';

interface BannerFormState {
  imageUrl: string;
  headline: string;
  subtext: string;
  linkUrl: string;
  order: string;
  active: boolean;
}

const REQUIRED_ACTIVE_BANNERS = 5;

export function AdminBannersPage() {
  const { categories } = useSite();
  const { showToast } = useToast();
  useDocumentMeta('Manage Hero Banners — SPG Footland Admin');

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerFormState>({
    imageUrl: '',
    headline: '',
    subtext: '',
    linkUrl: '/category/sneakers',
    order: '1',
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getBanners(false);
      setBanners(list);
    } catch {
      showToast('Failed to load banners.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadBanners();
  }, [loadBanners]);

  const activeCount = useMemo(() => banners.filter((b) => b.active).length, [banners]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      imageUrl: '',
      headline: '',
      subtext: '',
      linkUrl: categories[0] ? `/category/${categories[0].slug}` : '/',
      order: String(banners.length + 1),
      active: activeCount < REQUIRED_ACTIVE_BANNERS,
    });
    setModalOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      imageUrl: banner.imageUrl,
      headline: banner.headline,
      subtext: banner.subtext,
      linkUrl: banner.linkUrl,
      order: String(banner.order),
      active: banner.active,
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (banner: Banner) => {
    const nextActive = !banner.active;
    if (nextActive && activeCount >= REQUIRED_ACTIVE_BANNERS) {
      showToast(
        'Homepage carousel displays exactly 5 active banners. Deactivate one existing banner before activating another.',
        'error'
      );
      return;
    }

    try {
      await saveBanner({ ...banner, active: nextActive }, banner.id);
      showToast(
        nextActive ? `Activated "${banner.headline}"` : `Paused "${banner.headline}"`,
        'success'
      );
      await loadBanners();
    } catch {
      showToast('Could not update banner status.', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl.trim() || !form.headline.trim()) {
      showToast('Banner image and headline are required.', 'error');
      return;
    }

    const otherActiveCount = banners.filter((b) => b.active && b.id !== editing?.id).length;
    if (form.active && otherActiveCount >= REQUIRED_ACTIVE_BANNERS) {
      showToast(
        'Exactly 5 banners can be active on the homepage carousel. Save this as inactive or deactivate another banner first.',
        'error'
      );
      return;
    }

    setSaving(true);
    try {
      await saveBanner(
        {
          imageUrl: form.imageUrl.trim(),
          headline: form.headline.trim(),
          subtext: form.subtext.trim(),
          linkUrl: form.linkUrl.trim() || '/',
          order: Number(form.order) || 1,
          active: form.active,
        },
        editing?.id
      );
      showToast(editing ? 'Banner updated.' : 'Banner created.', 'success');
      setModalOpen(false);
      await loadBanners();
    } catch {
      showToast('Failed to save banner.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBanner(deleteTarget);
      showToast('Banner deleted.', 'success');
      setDeleteTarget(null);
      await loadBanners();
    } catch {
      showToast('Failed to delete banner.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">
            Homepage Carousel Banners
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage the 5 trending advertisement slides displayed below the storefront navbar.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors whitespace-nowrap sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Banner</span>
        </button>
      </div>

      {/* 5-Active Banner Enforcement Indicator */}
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
          activeCount === REQUIRED_ACTIVE_BANNERS
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
      >
        {activeCount === REQUIRED_ACTIVE_BANNERS ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        )}
        <div>
          <p className="font-semibold font-mono tabular-nums">
            Active Carousel Slots: {activeCount} / {REQUIRED_ACTIVE_BANNERS}
          </p>
          <p className="mt-0.5 text-xs opacity-90">
            {activeCount === REQUIRED_ACTIVE_BANNERS
              ? 'All 5 homepage carousel slots are active and rotating every 4 seconds.'
              : activeCount < REQUIRED_ACTIVE_BANNERS
                ? `Activate or add ${REQUIRED_ACTIVE_BANNERS - activeCount} more banner(s) so the homepage displays all 5 trending slides.`
                : 'Only the first 5 ordered active banners are displayed on the homepage.'}
          </p>
        </div>
      </div>

      {/* Banners Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="font-display text-base font-bold text-slate-900">No banners created yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create 5 promotional banners or use Seed Sample Data on the Dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="relative aspect-[16/9] w-full bg-[#1C0A0C] overflow-hidden">
                <SafeImage
                  src={banner.imageUrl}
                  alt={banner.headline}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C0A0C]/90 via-[#1C0A0C]/30 to-transparent" />
                <div className="absolute left-3 top-3 flex items-center gap-2">
                  <span className="rounded bg-yellow-400 px-2 py-0.5 font-mono text-xs font-bold text-slate-950 tabular-nums">
                    Order #{banner.order}
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h2 className="font-display text-lg font-bold leading-snug">{banner.headline}</h2>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-200">{banner.subtext}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
                <span className="truncate font-mono text-slate-500">Link: {banner.linkUrl}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleToggleActive(banner)}
                    className={`rounded-lg border px-2.5 py-1.5 font-semibold transition-colors ${
                      banner.active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {banner.active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(banner)}
                    aria-label={`Edit ${banner.headline}`}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(banner)}
                    aria-label={`Delete ${banner.headline}`}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1C0A0C]/70 p-4 sm:py-10 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="font-display text-xl font-bold text-slate-900">
                {editing ? 'Edit Carousel Banner' : 'Add Carousel Banner'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close banner form"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <ImageUploader
                folder="banners"
                images={form.imageUrl ? [form.imageUrl] : []}
                onChange={(imgs) => setForm({ ...form, imageUrl: imgs[0] || '' })}
                multiple={false}
                label="Banner Image (16:9 recommended) *"
              />

              <div>
                <label className="block text-sm font-semibold text-slate-800">Headline *</label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="Engineered for Every Kilometre"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800">Subtext</label>
                <textarea
                  rows={2}
                  maxLength={240}
                  value={form.subtext}
                  onChange={(e) => setForm({ ...form, subtext: e.target.value })}
                  placeholder="Short promotional copy shown below the headline..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800">Button Link URL *</label>
                  <input
                    type="text"
                    required
                    maxLength={300}
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    placeholder="/category/sports-shoes"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-sm focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Order</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-red-600 focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 rounded accent-red-600"
                />
                <span>Active on homepage carousel (max 5 active)</span>
              </label>

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
                  {saving ? 'Saving...' : editing ? 'Save Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete banner "${deleteTarget?.headline || ''}"?`}
        description="This removes the carousel banner from Firestore and deletes its uploaded image from Storage."
        confirmLabel="Delete Banner"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
