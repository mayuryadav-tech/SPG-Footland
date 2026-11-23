# SPG Footland — Footwear E-Commerce Catalogue & Admin CMS

A responsive React + TypeScript + Tailwind CSS + Firebase footwear catalogue website and protected Admin CMS built for **SPG Footland**. Features INR (`₹`) pricing, UK/India sizing, a 5-slide auto-playing hero carousel, live Firestore best-seller shelves per footwear type, multi-facet category filtering, WhatsApp product enquiry integration, and full admin CRUD with one-click sample data seeding.

---

## Features

### Public Storefront
- **Sticky Navigation**: Custom SPG Footland SVG shoe mark, dynamic `Shop` dropdown listing all Firestore categories, `About Us`, `Contact`, expandable live catalogue search, and mobile drawer.
- **5-Banner Hero Carousel**: Auto-plays every 4 seconds, pauses on hover, supports arrows, dot indicators, and mobile touch swipe. Loaded live from Firestore `banners`.
- **Category Best-Seller Sections**: Separate homepage section for every category (`Sneakers`, `Sports Shoes`, `Formal Shoes`, `Casual Shoes`, `Sandals`, `Slippers & Flip-Flops`, `Boots`, `Kids Footwear`) displaying the 6 most-sold active products (`orderBy unitsSold desc, limit 6`).
- **Category Pages (`/category/:slug`)**: Category hero banner, brand/INR price/UK size/colour/gender filters, sorting (`Most Sold`, `Price Low–High`, `Price High–Low`, `Newest`), and Load More pagination.
- **Product Detail Page (`/product/:id`)**: Multi-image gallery with thumbnails and zoom lightbox, UK size & colour selectors, stock status, specifications, pre-filled **Enquire on WhatsApp** CTA, and related products.
- **About Us, Contact & Footer**: Driven live by Firestore `siteInfo/main` with embedded Google Map, contact form (`enquiries`), newsletter signup (`subscribers`), social icons, and Privacy/Terms/FAQs pages.

### Protected Admin Panel (`/admin`)
- **Google Sign-In Authentication (`/admin/login`)**: Protected by `AdminGuard` and verified against the Firestore `admins` collection (with `email_verified == true`).
- **Dashboard**: Total products, categories, enquiries (with unread count), low-stock alerts (`stock <= 5`), products per category breakdown, top 5 best-selling products, and **One-Click Seed Sample Data** (8 categories, 5 banners, `siteInfo`, and 64 products).
- **Full CRUD Modules**:
  - **Products**: Searchable/sortable/paginated table, category filter, multi-image Firebase Storage uploader with URL fallback, reorder & automatic Storage cleanup on delete.
  - **Categories**: Add/edit/delete, up/down display order reordering, banner image upload.
  - **Banners**: Manage hero carousel slides with strict 5-active-banner enforcement.
  - **Site Information**: Edit shop name, custom logo, address, phone, WhatsApp, email, working hours, social links, About Us copy, Google Map embed URL, and authorized admin emails.
  - **Enquiries & Subscribers**: View messages, mark read/unread, copy subscriber emails, and delete entries.

---

## Firebase Setup & Deployment Guide

### 1. Create / Connect a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project (or use the project already provisioned in `firebase-applet-config.json`).
2. Enable **Cloud Firestore**.
3. Enable **Firebase Authentication** → Sign-in method → **Google**.
4. Enable **Firebase Storage** (optional — if not yet enabled, the admin `ImageUploader` automatically offers a **Direct URL** mode so you can add image links immediately).

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` if deploying outside AI Studio:

```bash
cp .env.example .env.local
```

Fill in your `VITE_FIREBASE_*` keys. When running inside AI Studio, `firebase-applet-config.json` is automatically loaded.

### 3. Deploy Firestore & Storage Security Rules
- **Firestore Rules** (`firestore.rules`):
  - Public read on `categories`, `products`, `banners`, `siteInfo/main`.
  - Public write-only (`create`) on `enquiries` and `subscribers`.
  - Verified admin-only read/write on `enquiries`, `subscribers`, `admins`, and all catalogue mutations.
- **Storage Rules** (`storage.rules`):
  - Public read on `products/*`, `categories/*`, `banners/*`, `branding/*`; verified admin-only image uploads (max 5 MB).

Deploy with Firebase CLI:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 4. Required Composite Indexes (`firestore.indexes.json`)
Create the following composite indexes in Firestore (or deploy `firestore.indexes.json` via Firebase CLI):

| Collection | Fields Indexed | Used For |
|---|---|---|
| `products` | `categorySlug` ASC, `unitsSold` DESC | Homepage Top 6 most-sold products per category |
| `products` | `active` ASC, `categorySlug` ASC, `unitsSold` DESC | Active best-sellers per category |
| `products` | `active` ASC, `categorySlug` ASC, `createdAt` DESC | Newest arrivals per category |
| `banners` | `active` ASC, `order` ASC | Active homepage carousel slides |

> Note: The storefront includes a safe client-side fallback if an index is still building in Firestore, so the homepage remains functional immediately.

### 5. First Admin Login & Sample Data Seeding
1. Navigate to `/admin/login` and sign in with your verified Google account.
2. Add additional team admin emails anytime inside **Admin → Site Information → Authorized Admin Emails** (or add a document in Firestore `/admins/{lowercase-email}` with `{ "email": "name@domain.com" }`).
3. On the **Admin Dashboard**, click **Seed Sample Data** to populate `siteInfo/main`, all 8 footwear categories, 5 trending banners, and 64 sample INR products in one click.

### 6. Local Development & Production Build

```bash
npm install
npm run dev      # Starts Vite dev server on port 3000
npm run lint     # TypeScript type-check
npm run build    # Production bundle in /dist
```
