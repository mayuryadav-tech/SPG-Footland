import React, { useCallback, useEffect, useState } from 'react';
import { Save, Shield, Trash2, UserPlus } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImageUploader } from '../components/ImageUploader';
import { useSite } from '../context/SiteContext';
import { useToast } from '../context/ToastContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import {
  addAdminEmail,
  getAdmins,
  getSiteInfo,
  removeAdminEmail,
  saveSiteInfo,
} from '../services/catalogueService';
import type { AdminRecord, SiteInfo } from '../types';
import { BOOTSTRAP_ADMIN_EMAIL, DEFAULT_SITE_INFO } from '../utils/formatters';

export function AdminSiteInfoPage() {
  const { refreshSiteData } = useSite();
  const { showToast } = useToast();
  useDocumentMeta('Site Information — SPG Footland Admin');

  const [info, setInfo] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AdminRecord | null>(null);
  const [removingAdmin, setRemovingAdmin] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [siteData, adminList] = await Promise.all([getSiteInfo(), getAdmins()]);
      setInfo(siteData);
      setAdmins(adminList);
    } catch {
      showToast('Failed to load site settings.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info.shopName.trim()) {
      showToast('Shop name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveSiteInfo(info);
      await refreshSiteData();
      showToast('Store information saved and published.', 'success');
    } catch {
      showToast('Failed to save site information.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newAdminEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      showToast('Enter a valid Google email address.', 'error');
      return;
    }

    setAddingAdmin(true);
    try {
      await addAdminEmail(cleaned);
      setNewAdminEmail('');
      showToast(`Authorized ${cleaned} as admin.`, 'success');
      const updated = await getAdmins();
      setAdmins(updated);
    } catch {
      showToast('Could not add admin email.', 'error');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!removeTarget) return;
    setRemovingAdmin(true);
    try {
      await removeAdminEmail(removeTarget.id);
      showToast(`Removed ${removeTarget.email} from admins.`, 'success');
      setRemoveTarget(null);
      const updated = await getAdmins();
      setAdmins(updated);
    } catch {
      showToast('Could not remove admin.', 'error');
    } finally {
      setRemovingAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="h-96 rounded-xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Site Information</h1>
        <p className="mt-1 text-sm text-slate-600">
          Update storefront branding, contact details, Google Map embed, social links, and About Us copy.
        </p>
      </div>

      <form
        onSubmit={handleSaveInfo}
        className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-800">Shop Name *</label>
            <input
              type="text"
              required
              maxLength={100}
              value={info.shopName}
              onChange={(e) => setInfo({ ...info, shopName: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-red-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Working Hours</label>
            <input
              type="text"
              maxLength={200}
              value={info.workingHours}
              onChange={(e) => setInfo({ ...info, workingHours: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-red-600 focus:outline-none"
            />
          </div>
        </div>

        <ImageUploader
          folder="branding"
          images={info.logoUrl ? [info.logoUrl] : []}
          onChange={(imgs) => setInfo({ ...info, logoUrl: imgs[0] || '' })}
          multiple={false}
          label="Custom Logo Image (Optional)"
          helperText="Leave empty to display the built-in SPG Footland SVG shoe mark."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-slate-800">Phone Number</label>
            <input
              type="text"
              maxLength={40}
              value={info.phone}
              onChange={(e) => setInfo({ ...info, phone: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-sm focus:border-red-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">
              WhatsApp Number (with country code)
            </label>
            <input
              type="text"
              maxLength={40}
              value={info.whatsapp}
              onChange={(e) => setInfo({ ...info, whatsapp: e.target.value })}
              placeholder="919822045190"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-sm focus:border-red-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800">Contact Email</label>
            <input
              type="email"
              maxLength={160}
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-red-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800">Shop Address</label>
          <textarea
            rows={2}
            maxLength={400}
            value={info.address}
            onChange={(e) => setInfo({ ...info, address: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-red-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800">Footer About Line</label>
          <input
            type="text"
            maxLength={300}
            value={info.footerText}
            onChange={(e) => setInfo({ ...info, footerText: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-red-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800">
            About Us Page Content (separate paragraphs with blank lines)
          </label>
          <textarea
            rows={6}
            maxLength={4000}
            value={info.aboutText}
            onChange={(e) => setInfo({ ...info, aboutText: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm leading-relaxed focus:border-red-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800">
            Google Maps Embed URL (`iframe src`)
          </label>
          <input
            type="url"
            maxLength={1000}
            value={info.mapEmbedUrl}
            onChange={(e) => setInfo({ ...info, mapEmbedUrl: e.target.value })}
            placeholder="https://www.google.com/maps/embed?pb=..."
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-xs focus:border-red-600 focus:outline-none"
          />
        </div>

        {/* Social Media Links */}
        <div className="border-t border-slate-200 pt-5">
          <h2 className="font-display text-base font-bold text-slate-900 mb-4">Social Media Links</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(['facebook', 'instagram', 'whatsapp', 'youtube'] as const).map((network) => (
              <div key={network}>
                <label className="block text-xs font-semibold capitalize text-slate-700">
                  {network}
                </label>
                <input
                  type="url"
                  maxLength={300}
                  value={info.socialLinks[network] || ''}
                  onChange={(e) =>
                    setInfo({
                      ...info,
                      socialLinks: { ...info.socialLinks, [network]: e.target.value },
                    })
                  }
                  placeholder={`https://${network}.com/...`}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Site Information'}</span>
          </button>
        </div>
      </form>

      {/* Authorized Admins Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-600" />
          <h2 className="font-display text-lg font-bold text-slate-900">Authorized Admin Emails</h2>
        </div>
        <p className="text-sm text-slate-600">
          Only verified Google accounts listed in the Firestore <code className="font-mono text-xs">admins</code>{' '}
          collection (plus the primary owner <span className="font-mono text-xs font-semibold">{BOOTSTRAP_ADMIN_EMAIL}</span>)
          can access <code className="font-mono text-xs">/admin</code>.
        </p>

        <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-2.5 max-w-lg">
          <input
            type="email"
            required
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="teammate@gmail.com"
            className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-red-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={addingAdmin}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1C0A0C] px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" />
            <span>{addingAdmin ? 'Adding...' : 'Add Admin'}</span>
          </button>
        </form>

        <ul className="divide-y divide-slate-100 border-t border-slate-200">
          {admins.map((rec) => {
            const isOwner = rec.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
            return (
              <li key={rec.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-mono text-slate-800">{rec.email}</span>
                {isOwner ? (
                  <span className="text-xs font-semibold text-slate-500">Primary Owner</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRemoveTarget(rec)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </li>
            );
          })}
          {admins.length === 0 && (
            <li className="py-4 text-xs text-slate-500">
              Primary owner ({BOOTSTRAP_ADMIN_EMAIL}) is authorized automatically. Add additional
              team emails above.
            </li>
          )}
        </ul>
      </section>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title={`Revoke admin access for ${removeTarget?.email || ''}?`}
        description="This user will immediately lose permission to view or edit SPG Footland Admin."
        confirmLabel="Revoke Access"
        loading={removingAdmin}
        onConfirm={() => void handleRemoveAdmin()}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
