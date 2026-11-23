import React, { useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { useToast } from '../context/ToastContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { createEnquiry } from '../services/catalogueService';
import { sanitizePhoneForWhatsApp } from '../utils/formatters';

export function ContactPage() {
  const { siteInfo } = useSite();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useDocumentMeta(
    `Contact Us — ${siteInfo.shopName}`,
    `Visit ${siteInfo.shopName}, view working hours, find our store on Google Maps, or send an enquiry.`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormError('Please fill in your name, email address, and message.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await createEnquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
      });
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setSubmitted(true);
      showToast('Thank you! Your enquiry has been received by our team.', 'success');
    } catch {
      setFormError('Unable to send your enquiry right now. Please try again or reach us on WhatsApp.');
      showToast('Failed to send enquiry.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappHref = `https://wa.me/${sanitizePhoneForWhatsApp(siteInfo.whatsapp || siteInfo.phone)}?text=${encodeURIComponent(
    `Hello ${siteInfo.shopName}, I have an enquiry about your footwear catalogue.`
  )}`;

  const hasValidMapUrl =
    siteInfo.mapEmbedUrl.startsWith('https://www.google.com/maps/embed') ||
    siteInfo.mapEmbedUrl.startsWith('https://maps.google.com/');

  return (
    <div className="bg-slate-50/60 pb-20">
      {/* Header */}
      <section className="bg-[#1C0A0C] text-white py-14 sm:py-18 border-b-2 border-yellow-400/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs font-semibold tracking-wider text-yellow-400">
            Get in Touch
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Contact {siteInfo.shopName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-red-100/85 sm:text-base">
            Have a question about UK size availability, bulk sports team orders, or showroom
            directions? Send us an enquiry or chat directly on WhatsApp.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left Column: Store Details & Map */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
              <h2 className="font-display text-xl font-bold text-slate-900">Showroom Information</h2>

              <div className="space-y-5 text-sm">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-red-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Address</p>
                    <p className="mt-0.5 leading-relaxed text-slate-600">{siteInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-red-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Phone</p>
                    <a
                      href={`tel:${siteInfo.phone.replace(/\s+/g, '')}`}
                      className="mt-0.5 block font-mono text-slate-600 hover:text-red-600 tabular-nums"
                    >
                      {siteInfo.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-red-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Email</p>
                    <a
                      href={`mailto:${siteInfo.email}`}
                      className="mt-0.5 block text-slate-600 hover:text-red-600"
                    >
                      {siteInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-red-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Working Hours</p>
                    <p className="mt-0.5 text-slate-600">{siteInfo.workingHours}</p>
                  </div>
                </div>
              </div>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-3 text-sm font-bold text-white hover:bg-[#15803D] transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Embedded Google Map */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {hasValidMapUrl ? (
                <iframe
                  title={`${siteInfo.shopName} Location Map`}
                  src={siteInfo.mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-72 w-full border-0"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-64 flex-col items-center justify-center bg-slate-100 p-6 text-center text-sm text-slate-500">
                  <MapPin className="h-8 w-8 text-slate-400" />
                  <p className="mt-2 font-medium text-slate-700">{siteInfo.address}</p>
                  <p className="mt-1 text-xs">Configure a Google Maps embed URL in Admin → Site Info.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Contact / Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                Send an Enquiry
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Leave your details and shoe requirements below. Our store team responds within a few
                business hours.
              </p>

              {submitted ? (
                <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                  <h3 className="mt-3 font-display text-lg font-bold text-emerald-950">
                    Enquiry submitted successfully
                  </h3>
                  <p className="mt-1 text-sm text-emerald-800">
                    Thank you for reaching out to {siteInfo.shopName}. We will contact you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-5 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  {formError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="enq-name" className="block text-sm font-semibold text-slate-800">
                        Full Name *
                      </label>
                      <input
                        id="enq-name"
                        type="text"
                        required
                        maxLength={100}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Aarav Deshmukh"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="enq-phone" className="block text-sm font-semibold text-slate-800">
                        Phone / WhatsApp
                      </label>
                      <input
                        id="enq-phone"
                        type="tel"
                        maxLength={30}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98220 00000"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="enq-email" className="block text-sm font-semibold text-slate-800">
                      Email Address *
                    </label>
                    <input
                      id="enq-email"
                      type="email"
                      required
                      maxLength={160}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="enq-message" className="block text-sm font-semibold text-slate-800">
                      Message *
                    </label>
                    <textarea
                      id="enq-message"
                      required
                      rows={5}
                      maxLength={2000}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Mention the footwear model, UK size, colour preference, or any question..."
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    <span>{submitting ? 'Sending Enquiry...' : 'Submit Enquiry'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
