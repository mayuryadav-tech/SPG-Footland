import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type {
  AdminRecord,
  Banner,
  Category,
  Enquiry,
  Gender,
  Product,
  SiteInfo,
  Subscriber,
} from '../types';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  DEFAULT_SITE_INFO,
  generateDocId,
  getTimestampMillis,
  slugify,
} from '../utils/formatters';
import {
  SEED_BANNERS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_SITE_INFO,
} from '../utils/seedData';
import { db, handleFirestoreError, OperationType } from './firebase';
import { deleteImageFromStorage } from './storageService';

// ======================== CATEGORIES ========================

export async function getCategories(): Promise<Category[]> {
  try {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Category, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'categories');
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const q = query(collection(db, 'categories'), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as Omit<Category, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `categories?slug=${slug}`);
  }
}

export async function saveCategory(
  data: Omit<Category, 'id'>,
  existingId?: string
): Promise<string> {
  const id = existingId || generateDocId('cat');
  const cleanSlug = slugify(data.slug || data.name) || id.toLowerCase();
  const payload = {
    name: data.name.trim().slice(0, 80),
    slug: cleanSlug.slice(0, 80),
    description: data.description.trim().slice(0, 400),
    bannerUrl: data.bannerUrl.trim().slice(0, 1000),
    order: Math.max(0, Math.min(1000, Math.round(Number(data.order) || 0))),
  };

  try {
    const docRef = doc(db, 'categories', id);
    if (existingId) {
      await updateDoc(docRef, payload);
    } else {
      await setDoc(docRef, payload);
    }
    return id;
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      `categories/${id}`
    );
  }
}

export async function deleteCategory(category: Category): Promise<void> {
  try {
    await deleteDoc(doc(db, 'categories', category.id));
    if (category.bannerUrl) {
      await deleteImageFromStorage(category.bannerUrl);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${category.id}`);
  }
}

export async function reorderCategories(orderedCategories: Category[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    orderedCategories.forEach((cat, idx) => {
      batch.update(doc(db, 'categories', cat.id), { order: idx + 1 });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'categories/reorder');
  }
}

// ======================== PRODUCTS ========================

function mapProductDoc(id: string, raw: Record<string, unknown>): Product {
  return {
    id,
    name: String(raw.name || ''),
    brand: String(raw.brand || ''),
    categoryId: String(raw.categoryId || ''),
    categorySlug: String(raw.categorySlug || ''),
    description: String(raw.description || ''),
    price: Number(raw.price || 0),
    discountPrice:
      raw.discountPrice !== null && raw.discountPrice !== undefined && raw.discountPrice !== ''
        ? Number(raw.discountPrice)
        : null,
    sizes: Array.isArray(raw.sizes) ? raw.sizes.map(String) : [],
    colors: Array.isArray(raw.colors) ? raw.colors.map(String) : [],
    gender: (raw.gender as Gender) || 'Unisex',
    material: String(raw.material || ''),
    stock: Number(raw.stock || 0),
    unitsSold: Number(raw.unitsSold || 0),
    images: Array.isArray(raw.images) ? raw.images.map(String) : [],
    featured: Boolean(raw.featured),
    active: raw.active !== false,
    createdAt: (raw.createdAt as Product['createdAt']) || null,
    updatedAt: (raw.updatedAt as Product['updatedAt']) || null,
  };
}

export async function getAllProducts(activeOnly = false): Promise<Product[]> {
  try {
    const q = activeOnly
      ? query(collection(db, 'products'), where('active', '==', true))
      : query(collection(db, 'products'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapProductDoc(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
}

export async function getTopProductsByCategory(
  categorySlug: string,
  limitCount = 6
): Promise<Product[]> {
  try {
    const indexedQuery = query(
      collection(db, 'products'),
      where('categorySlug', '==', categorySlug),
      orderBy('unitsSold', 'desc'),
      limit(limitCount + 4)
    );
    const snap = await getDocs(indexedQuery);
    return snap.docs
      .map((d) => mapProductDoc(d.id, d.data() as Record<string, unknown>))
      .filter((p) => p.active)
      .slice(0, limitCount);
  } catch (error) {
    // Graceful fallback when composite index (categorySlug + unitsSold desc) is not yet built
    const msg = error instanceof Error ? error.message.toLowerCase() : '';
    if (msg.includes('index') || msg.includes('failed-precondition')) {
      try {
        const fallbackQuery = query(
          collection(db, 'products'),
          where('categorySlug', '==', categorySlug)
        );
        const snap = await getDocs(fallbackQuery);
        return snap.docs
          .map((d) => mapProductDoc(d.id, d.data() as Record<string, unknown>))
          .filter((p) => p.active)
          .sort((a, b) => b.unitsSold - a.unitsSold)
          .slice(0, limitCount);
      } catch (fallbackError) {
        handleFirestoreError(
          fallbackError,
          OperationType.LIST,
          `products?categorySlug=${categorySlug}`
        );
      }
    }
    handleFirestoreError(error, OperationType.LIST, `products?categorySlug=${categorySlug}`);
  }
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  try {
    const q = query(collection(db, 'products'), where('categorySlug', '==', categorySlug));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => mapProductDoc(d.id, d.data() as Record<string, unknown>))
      .filter((p) => p.active);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `products?categorySlug=${categorySlug}`);
  }
}

export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const snap = await getDoc(doc(db, 'products', productId));
    if (!snap.exists()) return null;
    return mapProductDoc(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `products/${productId}`);
  }
}

export async function getRelatedProducts(
  categorySlug: string,
  excludeProductId: string,
  limitCount = 4
): Promise<Product[]> {
  const list = await getTopProductsByCategory(categorySlug, limitCount + 2);
  return list.filter((item) => item.id !== excludeProductId).slice(0, limitCount);
}

export interface ProductPayloadInput {
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
}

export async function saveProduct(
  input: ProductPayloadInput,
  existingId?: string
): Promise<string> {
  const id = existingId || generateDocId('prod');
  const price = Math.max(0, Math.min(500000, Number(input.price) || 0));
  const rawDiscount =
    input.discountPrice !== null && input.discountPrice !== undefined
      ? Number(input.discountPrice)
      : null;
  const discountPrice =
    rawDiscount !== null && Number.isFinite(rawDiscount) && rawDiscount > 0 && rawDiscount <= price
      ? rawDiscount
      : null;

  const basePayload = {
    name: input.name.trim().slice(0, 140),
    brand: input.brand.trim().slice(0, 80),
    categoryId: input.categoryId.trim().slice(0, 128),
    categorySlug: slugify(input.categorySlug).slice(0, 80),
    description: input.description.trim().slice(0, 2000),
    price,
    discountPrice,
    sizes: input.sizes.map((s) => s.trim()).filter(Boolean).slice(0, 20),
    colors: input.colors.map((c) => c.trim()).filter(Boolean).slice(0, 15),
    gender: input.gender,
    material: input.material.trim().slice(0, 120),
    stock: Math.max(0, Math.min(100000, Math.round(Number(input.stock) || 0))),
    unitsSold: Math.max(0, Math.min(10000000, Math.round(Number(input.unitsSold) || 0))),
    images: input.images.map((u) => u.trim()).filter(Boolean).slice(0, 10),
    featured: Boolean(input.featured),
    active: Boolean(input.active),
  };

  try {
    const docRef = doc(db, 'products', id);
    if (existingId) {
      await updateDoc(docRef, {
        ...basePayload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        ...basePayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return id;
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      `products/${id}`
    );
  }
}

export async function deleteProduct(product: Product): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', product.id));
    await Promise.all(product.images.map((url) => deleteImageFromStorage(url)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${product.id}`);
  }
}

// ======================== BANNERS ========================

export async function getBanners(activeOnly = false): Promise<Banner[]> {
  try {
    const q = query(collection(db, 'banners'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Banner, 'id'>),
    }));
    return activeOnly ? items.filter((b) => b.active).slice(0, 5) : items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'banners');
  }
}

export async function saveBanner(
  data: Omit<Banner, 'id'>,
  existingId?: string
): Promise<string> {
  const id = existingId || generateDocId('banner');
  const payload = {
    imageUrl: data.imageUrl.trim().slice(0, 1000),
    headline: data.headline.trim().slice(0, 120),
    subtext: data.subtext.trim().slice(0, 240),
    linkUrl: data.linkUrl.trim().slice(0, 300) || '/',
    order: Math.max(0, Math.min(100, Math.round(Number(data.order) || 1))),
    active: Boolean(data.active),
  };

  try {
    const docRef = doc(db, 'banners', id);
    if (existingId) {
      await updateDoc(docRef, payload);
    } else {
      await setDoc(docRef, payload);
    }
    return id;
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      `banners/${id}`
    );
  }
}

export async function deleteBanner(banner: Banner): Promise<void> {
  try {
    await deleteDoc(doc(db, 'banners', banner.id));
    if (banner.imageUrl) {
      await deleteImageFromStorage(banner.imageUrl);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `banners/${banner.id}`);
  }
}

// ======================== SITE INFO ========================

export async function getSiteInfo(): Promise<SiteInfo> {
  try {
    const snap = await getDoc(doc(db, 'siteInfo', 'main'));
    if (!snap.exists()) return DEFAULT_SITE_INFO;
    const raw = snap.data() as Partial<SiteInfo>;
    return {
      ...DEFAULT_SITE_INFO,
      ...raw,
      socialLinks: {
        ...DEFAULT_SITE_INFO.socialLinks,
        ...(raw.socialLinks || {}),
      },
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'siteInfo/main');
  }
}

export async function saveSiteInfo(info: SiteInfo): Promise<void> {
  const payload: SiteInfo = {
    shopName: info.shopName.trim().slice(0, 100) || 'SPG Footland',
    logoUrl: info.logoUrl.trim().slice(0, 1000),
    address: info.address.trim().slice(0, 400),
    phone: info.phone.trim().slice(0, 40),
    email: info.email.trim().slice(0, 160),
    whatsapp: info.whatsapp.trim().slice(0, 40),
    workingHours: info.workingHours.trim().slice(0, 200),
    socialLinks: {
      facebook: (info.socialLinks?.facebook || '').trim().slice(0, 300),
      instagram: (info.socialLinks?.instagram || '').trim().slice(0, 300),
      whatsapp: (info.socialLinks?.whatsapp || '').trim().slice(0, 300),
      youtube: (info.socialLinks?.youtube || '').trim().slice(0, 300),
    },
    aboutText: info.aboutText.trim().slice(0, 4000),
    footerText: info.footerText.trim().slice(0, 300),
    mapEmbedUrl: info.mapEmbedUrl.trim().slice(0, 1000),
  };

  try {
    await setDoc(doc(db, 'siteInfo', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'siteInfo/main');
  }
}

// ======================== ENQUIRIES & SUBSCRIBERS ========================

export async function createEnquiry(input: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<string> {
  const id = generateDocId('enq');
  const payload = {
    name: input.name.trim().slice(0, 100),
    email: input.email.trim().toLowerCase().slice(0, 160),
    phone: input.phone.trim().slice(0, 30),
    message: input.message.trim().slice(0, 2000),
    read: false,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'enquiries', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `enquiries/${id}`);
  }
}

export async function getEnquiries(): Promise<Enquiry[]> {
  try {
    const snap = await getDocs(collection(db, 'enquiries'));
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Enquiry, 'id'>),
      }))
      .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'enquiries');
  }
}

export async function toggleEnquiryRead(enquiryId: string, read: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'enquiries', enquiryId), { read });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `enquiries/${enquiryId}`);
  }
}

export async function deleteEnquiry(enquiryId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'enquiries', enquiryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `enquiries/${enquiryId}`);
  }
}

export async function createSubscriber(email: string): Promise<string> {
  const id = generateDocId('sub');
  const payload = {
    email: email.trim().toLowerCase().slice(0, 160),
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'subscribers', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `subscribers/${id}`);
  }
}

export async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const snap = await getDocs(collection(db, 'subscribers'));
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Subscriber, 'id'>),
      }))
      .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'subscribers');
  }
}

export async function deleteSubscriber(subscriberId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'subscribers', subscriberId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `subscribers/${subscriberId}`);
  }
}

// ======================== ADMINS ========================

export async function checkIsAdminEmail(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) return true;

  try {
    const snap = await getDoc(doc(db, 'admins', normalized));
    return snap.exists();
  } catch (error) {
    console.warn('Admin verification lookup error:', error);
    return false;
  }
}

export async function getAdmins(): Promise<AdminRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AdminRecord, 'id'>),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admins');
  }
}

export async function addAdminEmail(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  try {
    await setDoc(doc(db, 'admins', normalized), {
      email: normalized,
      addedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `admins/${normalized}`);
  }
}

export async function removeAdminEmail(adminId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'admins', adminId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `admins/${adminId}`);
  }
}

// ======================== ONE-CLICK SAMPLE SEEDING ========================

export async function seedSampleData(currentAdminEmail?: string | null): Promise<{
  categories: number;
  banners: number;
  products: number;
}> {
  try {
    // Batch 1: SiteInfo, Admin bootstrap doc, Categories, and Banners
    // Categories MUST commit first so product create rules' exists(/categories/{categoryId}) passes!
    const setupBatch = writeBatch(db);

    setupBatch.set(doc(db, 'siteInfo', 'main'), SEED_SITE_INFO);

    const ownerEmail = (currentAdminEmail || BOOTSTRAP_ADMIN_EMAIL).trim().toLowerCase();
    setupBatch.set(doc(db, 'admins', ownerEmail), {
      email: ownerEmail,
      addedAt: serverTimestamp(),
    });

    for (const cat of SEED_CATEGORIES) {
      setupBatch.set(doc(db, 'categories', cat.id), {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        bannerUrl: cat.bannerUrl,
        order: cat.order,
      });
    }

    for (const banner of SEED_BANNERS) {
      setupBatch.set(doc(db, 'banners', banner.id), {
        imageUrl: banner.imageUrl,
        headline: banner.headline,
        subtext: banner.subtext,
        linkUrl: banner.linkUrl,
        order: banner.order,
        active: banner.active,
      });
    }

    await setupBatch.commit();

    // Batch 2+: Commit products in chunks of 32 (64 total = 8 per category)
    // Check existing docs so re-seeding respects createdAt immutability on update vs create
    const existingSnap = await getDocs(collection(db, 'products'));
    const existingMap = new Map(existingSnap.docs.map((d) => [d.id, d.data()]));

    const chunkSize = 32;
    for (let i = 0; i < SEED_PRODUCTS.length; i += chunkSize) {
      const chunk = SEED_PRODUCTS.slice(i, i + chunkSize);
      const prodBatch = writeBatch(db);

      for (const prod of chunk) {
        const ref = doc(db, 'products', prod.id);
        const existingData = existingMap.get(prod.id);
        const baseData = {
          name: prod.name,
          brand: prod.brand,
          categoryId: prod.categoryId,
          categorySlug: prod.categorySlug,
          description: prod.description,
          price: prod.price,
          discountPrice: prod.discountPrice,
          sizes: prod.sizes,
          colors: prod.colors,
          gender: prod.gender,
          material: prod.material,
          stock: prod.stock,
          unitsSold: prod.unitsSold,
          images: prod.images,
          featured: prod.featured,
          active: prod.active,
        };

        if (existingData) {
          prodBatch.update(ref, {
            ...baseData,
            updatedAt: serverTimestamp(),
          });
        } else {
          prodBatch.set(ref, {
            ...baseData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      await prodBatch.commit();
    }

    return {
      categories: SEED_CATEGORIES.length,
      banners: SEED_BANNERS.length,
      products: SEED_PRODUCTS.length,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedSampleData');
  }
}
