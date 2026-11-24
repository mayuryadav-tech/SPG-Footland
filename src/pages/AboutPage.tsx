import { Link } from 'react-router-dom';
import { ArrowRight, Award, Compass, ShieldCheck, Users } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useSite } from '../context/SiteContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { GENERATED_ASSETS } from '../utils/seedData';

export function AboutPage() {
  const { siteInfo, categories } = useSite();

  useDocumentMeta(
    `About Us — ${siteInfo.shopName}`,
    `Learn about ${siteInfo.shopName}, our footwear curation philosophy, and visit our showroom.`
  );

  const paragraphs = siteInfo.aboutText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="bg-white">
      {/* Editorial Dark Navy Header */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <SafeImage
          src={GENERATED_ASSETS.banners.sneakers}
          alt={`${siteInfo.shopName} showroom footwear`}
          eager
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/50" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="font-mono text-xs font-semibold tracking-wider text-orange-400">
            About {siteInfo.shopName}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl text-balance">
            Built for athletes, professionals, and every stride in between.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
            {siteInfo.footerText}
          </p>
        </div>
      </section>

      {/* Story Section from Firestore siteInfo */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Our Footwear Philosophy
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-slate-600">
              {paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
              >
                <span>Visit Our Store</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>Browse Catalogue</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <SafeImage
              src={GENERATED_ASSETS.banners.running}
              alt="Performance athletic running shoes"
              className="h-full min-h-[300px] w-full object-cover"
            />
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="mt-16 grid grid-cols-1 gap-6 border-t border-slate-200 pt-14 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ShieldCheck,
              title: 'Authentic Brands',
              desc: 'Every pair is sourced directly from verified footwear makers and authorized distributors.',
            },
            {
              icon: Compass,
              title: 'Precision UK Fitting',
              desc: 'Consistent UK / India sizing guidance across performance runners, leather formals, and kids footwear.',
            },
            {
              icon: Award,
              title: 'Monsoon & Road Ready',
              desc: 'Curated outsoles and weather-tested materials selected for Indian streets and year-round comfort.',
            },
            {
              icon: Users,
              title: 'Direct Store Support',
              desc: 'Instant WhatsApp size checks, real-time stock confirmation, and zero-hassle store reservation.',
            },
          ].map((pillar) => (
            <div key={pillar.title} className="rounded-xl border border-slate-200 bg-slate-50/70 p-6">
              <pillar.icon className="h-6 w-6 text-orange-500" />
              <h3 className="mt-4 font-display text-lg font-bold text-slate-900">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{pillar.desc}</p>
            </div>
          ))}
        </div>

        {/* Explore Categories */}
        {categories.length > 0 && (
          <div className="mt-16 border-t border-slate-200 pt-14">
            <h2 className="font-display text-2xl font-extrabold text-slate-900">
              Explore Our Collections
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-orange-500 hover:shadow-xs transition-all"
                >
                  <p className="font-display text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {cat.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{cat.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
