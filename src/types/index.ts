import type { Timestamp } from 'firebase/firestore';

export type Gender = 'Men' | 'Women' | 'Unisex' | 'Kids';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  bannerUrl: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  categorySlug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  sizes: string[];
  colors: string[];
  gender: Gender;
  material: string;
  stock: number;
  unitsSold: number;
  images: string[];
  featured: boolean;
  active: boolean;
  createdAt: Timestamp | Date | null;
  updatedAt: Timestamp | Date | null;
}

export interface Banner {
  id: string;
  imageUrl: string;
  headline: string;
  subtext: string;
  linkUrl: string;
  order: number;
  active: boolean;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  whatsapp: string;
  youtube: string;
}

export interface SiteInfo {
  shopName: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  workingHours: string;
  socialLinks: SocialLinks;
  aboutText: string;
  footerText: string;
  mapEmbedUrl: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | Date | null;
}

export interface Subscriber {
  id: string;
  email: string;
  createdAt: Timestamp | Date | null;
}

export interface AdminRecord {
  id: string;
  email: string;
  addedAt?: Timestamp | Date | null;
}

export type SortOption = 'most-sold' | 'price-asc' | 'price-desc' | 'newest';

export interface ProductFilters {
  brands: string[];
  minPrice: number | '';
  maxPrice: number | '';
  sizes: string[];
  colors: string[];
  genders: Gender[];
}
