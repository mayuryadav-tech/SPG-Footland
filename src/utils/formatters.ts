import type { Gender, SiteInfo } from '../types';

export const BOOTSTRAP_ADMIN_EMAIL = 'yadmayur@gmail.com';

export const ADULT_UK_SIZES = ['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'];
export const KIDS_UK_SIZES = ['10C', '11C', '12C', '13C', 'UK 1', 'UK 2', 'UK 3', 'UK 4', 'UK 5'];
export const ALL_UK_SIZES = [...ADULT_UK_SIZES, ...KIDS_UK_SIZES];

export const COMMON_COLORS = [
  'Navy',
  'Black',
  'White',
  'Orange',
  'Brown',
  'Tan',
  'Grey',
  'Olive',
  'Red',
  'Blue',
  'Beige',
  'Multi',
];

export const GENDERS: Gender[] = ['Men', 'Women', 'Unisex', 'Kids'];

export const COLOR_SWATCH_MAP: Record<string, string> = {
  Navy: '#0F172A',
  Black: '#18181B',
  White: '#F8FAFC',
  Orange: '#F97316',
  Brown: '#5C3A21',
  Tan: '#C18A52',
  Grey: '#64748B',
  Olive: '#4D5D3B',
  Red: '#DC2626',
  Blue: '#2563EB',
  Beige: '#D6C7B2',
  Multi: 'linear-gradient(135deg, #0F172A 0%, #F97316 50%, #2563EB 100%)',
};

export const DEFAULT_SITE_INFO: SiteInfo = {
  shopName: 'SPG Footland',
  logoUrl: '',
  address: 'Shop 14 & 15, Ground Floor, Phoenix Retail Plaza, FC Road, Pune, Maharashtra 411004, India',
  phone: '+91 98220 45190',
  email: 'hello@spgfootland.in',
  whatsapp: '919822045190',
  workingHours: 'Mon – Sun: 10:00 AM – 9:30 PM IST',
  socialLinks: {
    facebook: 'https://facebook.com/spgfootland',
    instagram: 'https://instagram.com/spgfootland',
    whatsapp: 'https://wa.me/919822045190',
    youtube: 'https://youtube.com/@spgfootland',
  },
  aboutText:
    'Founded in Pune, SPG Footland brings together high-performance athletic footwear, precision-crafted leather formals, rugged outdoor boots, and all-day everyday comfort under one roof.\n\nWe partner directly with leading footwear makers to curate genuine pairs engineered for Indian roads, monsoon grip, and long daily wear. Whether you are training for a half-marathon, stepping into the boardroom, or outfitting growing feet, our in-store fitting specialists help you find the exact UK size and arch support you need.\n\nEvery pair in our catalogue is inspected for cushioning, stitching integrity, and outsole durability—so you can browse online at leisure and enquire directly on WhatsApp for instant size reservation or same-day store pickup.',
  footerText:
    'Performance footwear, timeless formals, and everyday comfort curated in UK sizes for every stride.',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3783.204425252754!2d73.84145527519166!3d18.51965578257379!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c079d4c6d387%3A0x2ef12f3e384c82a!2sFergusson%20College%20Rd%2C%20Pune%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
};

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₹${safe.toLocaleString('en-IN')}`;
}

export function getEffectivePrice(price: number, discountPrice: number | null | undefined): number {
  if (typeof discountPrice === 'number' && discountPrice > 0 && discountPrice < price) {
    return discountPrice;
  }
  return price;
}

export function getDiscountPercent(price: number, discountPrice: number | null | undefined): number {
  if (!discountPrice || discountPrice <= 0 || discountPrice >= price || price <= 0) {
    return 0;
  }
  return Math.round(((price - discountPrice) / price) * 100);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function generateDocId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 9);
  const timePart = Date.now().toString(36);
  return `${prefix}-${timePart}-${randomPart}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function sanitizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return (import.meta.env.VITE_DEFAULT_WHATSAPP as string) || '919822045190';
  }
  return digits.length === 10 ? `91${digits}` : digits;
}

export function buildWhatsAppEnquiryUrl(params: {
  whatsappNumber: string;
  productName: string;
  brand: string;
  priceText: string;
  selectedSize?: string;
  selectedColor?: string;
  productUrl: string;
}): string {
  const phone = sanitizePhoneForWhatsApp(params.whatsappNumber);
  const lines = [
    `Hello SPG Footland! I would like to enquire about:`,
    `• Product: ${params.brand} ${params.productName}`,
    `• Price: ${params.priceText}`,
  ];
  if (params.selectedSize) lines.push(`• Preferred Size: ${params.selectedSize}`);
  if (params.selectedColor) lines.push(`• Preferred Color: ${params.selectedColor}`);
  lines.push(`• Product Link: ${params.productUrl}`);
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function formatTimestamp(value: unknown): string {
  if (!value) return '—';
  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    date = (value as { toDate: () => Date }).toDate();
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  }
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getTimestampMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value !== null && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}
