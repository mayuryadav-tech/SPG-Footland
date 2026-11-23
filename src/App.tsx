import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminBannersPage } from './admin/AdminBannersPage';
import { AdminCategoriesPage } from './admin/AdminCategoriesPage';
import { AdminDashboardPage } from './admin/AdminDashboardPage';
import { AdminEnquiriesPage } from './admin/AdminEnquiriesPage';
import { AdminGuard } from './admin/AdminGuard';
import { AdminLayout } from './admin/AdminLayout';
import { AdminLoginPage } from './admin/AdminLoginPage';
import { AdminProductsPage } from './admin/AdminProductsPage';
import { AdminSiteInfoPage } from './admin/AdminSiteInfoPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { SiteProvider } from './context/SiteContext';
import { ToastProvider } from './context/ToastContext';
import { AboutPage } from './pages/AboutPage';
import { CategoryPage } from './pages/CategoryPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { LegalFaqPage } from './pages/LegalFaqPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { PublicLayout } from './pages/PublicLayout';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <SiteProvider>
              <Routes>
                {/* Public Storefront Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/privacy-policy" element={<LegalFaqPage mode="privacy" />} />
                  <Route path="/terms" element={<LegalFaqPage mode="terms" />} />
                  <Route path="/faqs" element={<LegalFaqPage mode="faqs" />} />
                </Route>

                {/* Admin Login (Public Route) */}
                <Route path="/admin/login" element={<AdminLoginPage />} />

                {/* Protected Admin CMS Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminGuard>
                      <AdminLayout />
                    </AdminGuard>
                  }
                >
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="banners" element={<AdminBannersPage />} />
                  <Route path="site-info" element={<AdminSiteInfoPage />} />
                  <Route path="enquiries" element={<AdminEnquiriesPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SiteProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
