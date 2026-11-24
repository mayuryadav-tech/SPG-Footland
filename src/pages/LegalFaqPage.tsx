import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface LegalFaqPageProps {
  mode: 'privacy' | 'terms' | 'faqs';
}

const FAQS = [
  {
    q: 'How do I reserve or buy a pair listed on SPG Footland?',
    a: 'SPG Footland is an online footwear catalogue. On any product page, select your preferred UK size and colour, then tap "Enquire on WhatsApp" to confirm live stock, arrange showroom pickup, or schedule local delivery.',
  },
  {
    q: 'Which shoe sizing standard is used across the catalogue?',
    a: 'All adult footwear uses standard UK / India sizes (UK 5 through UK 12), and Kids Footwear uses UK Junior & Child sizes (10C–13C and UK 1–UK 5).',
  },
  {
    q: 'Are all brands and products 100% authentic?',
    a: 'Yes. Every pair listed in SPG Footland is sourced directly from authorized brand distributors and carries manufacturer quality guarantees.',
  },
  {
    q: 'Can I exchange a pair for a different UK size after purchase?',
    a: 'Unused pairs in original box packaging with store invoice can be exchanged for an available UK size within 7 days of purchase at our showroom.',
  },
  {
    q: 'Do you accept bulk orders for school, corporate, or sports teams?',
    a: 'Yes! Use our Contact form or WhatsApp line to share your required size breakdown and category, and we will prepare a custom quotation.',
  },
];

export function LegalFaqPage({ mode }: LegalFaqPageProps) {
  const { siteInfo } = useSite();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const metaTitle =
    mode === 'privacy'
      ? `Privacy Policy — ${siteInfo.shopName}`
      : mode === 'terms'
        ? `Terms & Conditions — ${siteInfo.shopName}`
        : `Frequently Asked Questions — ${siteInfo.shopName}`;

  useDocumentMeta(metaTitle);

  return (
    <div className="bg-white py-14 sm:py-18">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {mode === 'faqs' ? (
          <>
            <p className="font-mono text-xs font-semibold text-orange-600">Help &amp; Guidance</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Frequently Asked Questions
            </h1>
            <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
              {FAQS.map((item, idx) => {
                const open = openIndex === idx;
                return (
                  <div key={item.q} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(open ? null : idx)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-4 text-left font-display text-base font-bold text-slate-900 hover:text-orange-600 transition-colors"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                          open ? 'rotate-180 text-orange-500' : ''
                        }`}
                      />
                    </button>
                    {open && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : mode === 'privacy' ? (
          <article className="space-y-5 text-sm leading-relaxed text-slate-600">
            <p className="font-mono text-xs font-semibold text-orange-600">Legal</p>
            <h1 className="font-display text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Privacy Policy
            </h1>
            <p>
              {siteInfo.shopName} respects your privacy. Information submitted through our Contact
              Enquiry form (name, email, phone number, message) or Newsletter signup (email address)
              is stored securely and used solely to respond to your footwear enquiries or share
              store updates you opted into.
            </p>
            <p>
              We do not sell, rent, or trade customer contact details to third parties. Because this
              website operates as a catalogue with WhatsApp enquiries, no payment card numbers or
              banking credentials are collected on this site.
            </p>
            <p>
              To request deletion of an enquiry or unsubscribe from announcements, email us at{' '}
              <a href={`mailto:${siteInfo.email}`} className="font-semibold text-orange-600 underline">
                {siteInfo.email}
              </a>
              .
            </p>
          </article>
        ) : (
          <article className="space-y-5 text-sm leading-relaxed text-slate-600">
            <p className="font-mono text-xs font-semibold text-orange-600">Legal</p>
            <h1 className="font-display text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Terms &amp; Conditions
            </h1>
            <p>
              All footwear listings, INR prices, discounts, and stock indicators displayed on{' '}
              {siteInfo.shopName} are provided for catalogue browsing and enquiry purposes. Final
              size availability and promotional pricing are confirmed at the time of WhatsApp
              confirmation or in-store billing.
            </p>
            <p>
              Product colours may vary slightly depending on screen calibration and studio lighting.
              All brand names and trademarks displayed belong to their respective owners.
            </p>
            <p>
              For store assistance, visit us at {siteInfo.address} during {siteInfo.workingHours}.
            </p>
          </article>
        )}
      </div>
    </div>
  );
}
