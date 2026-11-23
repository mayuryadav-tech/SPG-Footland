import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { useToast } from '../context/ToastContext';
import { createSubscriber } from '../services/catalogueService';
import { Logo } from './Logo';

export function Footer() {
  const { siteInfo, categories } = useSite();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createSubscriber(cleaned);
      setEmail('');
      showToast('Subscribed to SPG Footland new drops and offers!', 'success');
    } catch {
      showToast('Could not save subscription right now. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const socialItems = [
    {
      label: 'Facebook',
      href: siteInfo.socialLinks.facebook || 'https://facebook.com',
      svg: (
        <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
      ),
    },
    {
      label: 'Instagram',
      href: siteInfo.socialLinks.instagram || 'https://instagram.com',
      svg: (
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 3.675a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
      ),
    },
    {
      label: 'WhatsApp',
      href: siteInfo.socialLinks.whatsapp || `https://wa.me/${siteInfo.whatsapp.replace(/\D/g, '')}`,
      svg: (
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.001 2C6.486 2 2 6.486 2 12c0 1.976.578 3.817 1.573 5.367L2.5 22l4.777-1.253A9.95 9.95 0 0 0 12.001 22C17.515 22 22 17.514 22 12S17.515 2 12.001 2z" />
      ),
    },
    {
      label: 'YouTube',
      href: siteInfo.socialLinks.youtube || 'https://youtube.com',
      svg: (
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      ),
    },
  ];

  return (
    <footer className="bg-[#1C0A0C] text-stone-300 border-t border-red-900/60">
      {/* Newsletter Strip */}
      <div className="border-b border-red-900/50 bg-[#2A0D11]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              First access to new footwear drops
            </h2>
            <p className="mt-1 text-sm text-stone-300">
              Receive seasonal collection alerts, in-store offers, and restock notifications.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full max-w-md gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              aria-label="Email address for newsletter"
              className="flex-1 rounded-lg border border-red-900/80 bg-[#140608] px-4 py-2.5 text-sm text-white placeholder:text-stone-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-yellow-300 transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Joining...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      {/* Main 4-Column Footer */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {/* Column 1: Brand */}
        <div className="space-y-4">
          <Link to="/" className="inline-block">
            <Logo shopName={siteInfo.shopName} logoUrl={siteInfo.logoUrl} variant="light" />
          </Link>
          <p className="text-sm leading-relaxed text-stone-400">{siteInfo.footerText}</p>
          <div className="flex items-center gap-2.5 pt-2">
            {socialItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2A0D11] text-yellow-400 ring-1 ring-red-900/70 hover:bg-red-600 hover:text-white hover:ring-red-500 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  {item.svg}
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="font-display text-sm font-bold tracking-wide text-yellow-400">Quick Links</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/" className="text-stone-300 hover:text-yellow-300 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-stone-300 hover:text-yellow-300 transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-stone-300 hover:text-yellow-300 transition-colors">
                Contact
              </Link>
            </li>
            <li>
              <Link
                to="/privacy-policy"
                className="text-stone-300 hover:text-yellow-300 transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-stone-300 hover:text-yellow-300 transition-colors">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link to="/faqs" className="text-stone-300 hover:text-yellow-300 transition-colors">
                FAQs
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Shop by Category */}
        <div>
          <h3 className="font-display text-sm font-bold tracking-wide text-yellow-400">
            Shop by Category
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.length === 0 ? (
              <li className="text-stone-500">Catalogue loading...</li>
            ) : (
              categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="text-stone-300 hover:text-yellow-300 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Column 4: Contact Details */}
        <div>
          <h3 className="font-display text-sm font-bold tracking-wide text-yellow-400">
            Visit &amp; Contact
          </h3>
          <ul className="mt-4 space-y-3.5 text-sm text-stone-300">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
              <span className="leading-relaxed">{siteInfo.address}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-yellow-400" />
              <a
                href={`tel:${siteInfo.phone.replace(/\s+/g, '')}`}
                className="hover:text-white transition-colors font-mono text-xs sm:text-sm tabular-nums"
              >
                {siteInfo.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-yellow-400" />
              <a href={`mailto:${siteInfo.email}`} className="hover:text-white transition-colors">
                {siteInfo.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
              <span>{siteInfo.workingHours}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-red-900/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-stone-400 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 {siteInfo.shopName}. All rights reserved.</p>
          <p>Genuine UK-Sized Footwear Catalogue · Direct WhatsApp Enquiry</p>
        </div>
      </div>
    </footer>
  );
}
