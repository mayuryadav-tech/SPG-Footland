import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Mail, MailOpen, Trash2, Users } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import {
  deleteEnquiry,
  deleteSubscriber,
  getEnquiries,
  getSubscribers,
  toggleEnquiryRead,
} from '../services/catalogueService';
import type { Enquiry, Subscriber } from '../types';
import { formatTimestamp } from '../utils/formatters';

export function AdminEnquiriesPage() {
  const { showToast } = useToast();
  useDocumentMeta('Enquiries & Subscribers — SPG Footland Admin');

  const [tab, setTab] = useState<'enquiries' | 'subscribers'>('enquiries');
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'enquiry'; item: Enquiry } | { type: 'subscriber'; item: Subscriber } | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [enqs, subs] = await Promise.all([getEnquiries(), getSubscribers()]);
      setEnquiries(enqs);
      setSubscribers(subs);
    } catch {
      showToast('Failed to load enquiries and subscribers.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggleRead = async (enq: Enquiry) => {
    try {
      await toggleEnquiryRead(enq.id, !enq.read);
      setEnquiries((prev) => prev.map((e) => (e.id === enq.id ? { ...e, read: !e.read } : e)));
      showToast(enq.read ? 'Marked as unread.' : 'Marked as read.', 'success');
    } catch {
      showToast('Could not update enquiry status.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'enquiry') {
        await deleteEnquiry(deleteTarget.item.id);
        setEnquiries((prev) => prev.filter((e) => e.id !== deleteTarget.item.id));
        showToast('Enquiry deleted.', 'success');
      } else {
        await deleteSubscriber(deleteTarget.item.id);
        setSubscribers((prev) => prev.filter((s) => s.id !== deleteTarget.item.id));
        showToast('Subscriber removed.', 'success');
      }
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete record.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopySubscribers = async () => {
    const text = subscribers.map((s) => s.email).join(', ');
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copied ${subscribers.length} subscriber email(s).`, 'success');
    } catch {
      showToast('Could not access clipboard.', 'error');
    }
  };

  const unreadCount = enquiries.filter((e) => !e.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">
            Enquiries &amp; Subscribers
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review customer messages from the Contact page and manage newsletter signups.
          </p>
        </div>

        <div className="inline-flex self-start rounded-lg bg-slate-200/80 p-1 text-sm font-semibold sm:self-auto">
          <button
            type="button"
            onClick={() => setTab('enquiries')}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 transition-colors whitespace-nowrap ${
              tab === 'enquiries' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Enquiries</span>
            <span className="font-mono text-xs text-red-600 tabular-nums">({unreadCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('subscribers')}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 transition-colors whitespace-nowrap ${
              tab === 'subscribers' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Subscribers</span>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              ({subscribers.length})
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : tab === 'enquiries' ? (
        enquiries.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="font-display text-base font-bold text-slate-900">No enquiries yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Messages submitted via the public Contact form will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {enquiries.map((enq) => (
              <div
                key={enq.id}
                className={`rounded-xl border p-5 transition-colors ${
                  enq.read ? 'border-slate-200 bg-white' : 'border-yellow-300 bg-yellow-50/50'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-base font-bold text-slate-900">{enq.name}</h2>
                      <span
                        className={`text-xs font-semibold ${
                          enq.read ? 'text-slate-500' : 'text-red-600'
                        }`}
                      >
                        {enq.read ? 'Read' : 'Unread'}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {formatTimestamp(enq.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <a href={`mailto:${enq.email}`} className="hover:text-red-600 font-medium">
                        {enq.email}
                      </a>
                      {enq.phone && (
                        <>
                          <span>·</span>
                          <a
                            href={`tel:${enq.phone.replace(/\s+/g, '')}`}
                            className="font-mono hover:text-red-600 tabular-nums"
                          >
                            {enq.phone}
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleToggleRead(enq)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      {enq.read ? (
                        <>
                          <MailOpen className="h-3.5 w-3.5" />
                          <span>Mark Unread</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Mark Read</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'enquiry', item: enq })}
                      aria-label={`Delete enquiry from ${enq.name}`}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {enq.message}
                </p>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
            <span className="text-xs font-semibold text-slate-600 font-mono tabular-nums">
              {subscribers.length} total subscribers
            </span>
            {subscribers.length > 0 && (
              <button
                type="button"
                onClick={() => void handleCopySubscribers()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy All Emails</span>
              </button>
            )}
          </div>

          {subscribers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-display text-base font-bold text-slate-900">No subscribers yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Shoppers who sign up in the storefront footer newsletter will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {subscribers.map((sub) => (
                <li key={sub.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-mono font-medium text-slate-900">{sub.email}</p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      Subscribed {formatTimestamp(sub.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: 'subscriber', item: sub })}
                    aria-label={`Remove ${sub.email}`}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === 'enquiry'
            ? `Delete enquiry from ${deleteTarget.item.name}?`
            : `Remove subscriber ${deleteTarget?.item.email || ''}?`
        }
        description="This record will be permanently removed from Firestore."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
