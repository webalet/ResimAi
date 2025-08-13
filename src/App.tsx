import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import './i18n/config'; // i18n konfigürasyonunu import et
import React, { useEffect } from 'react';

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";

import Gallery from "./pages/Gallery";
import Subscription from "./pages/Subscription";
import Profile from "./pages/Profile";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminJobs from "./pages/AdminJobs";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";


// Components
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import PublicLayout from "./components/PublicLayout";
import AdminLayout from "./components/admin/AdminLayout";

// Dil bazlı routing component'i
const LanguageRoutes: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  
  // Dil değişikliğini uygula
  useEffect(() => {
    if (lang && (lang === 'tr' || lang === 'en')) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
      <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
          
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/categories" element={
        <ProtectedRoute>
          <Layout>
            <Categories />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/gallery" element={
        <ProtectedRoute>
          <Layout>
            <Gallery />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/subscription" element={
        <ProtectedRoute>
          <Layout>
            <Subscription />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-gray-600">Sayfa bulunamadı</p>
          </div>
        </div>
      } />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Varsayılan dil yönlendirmesi */}
            <Route path="/" element={<Navigate to="/tr" replace />} />
            
            {/* Dil prefix'i olmayan URL'leri varsayılan dile yönlendir */}
            <Route path="/login" element={<Navigate to="/tr" replace />} />
            <Route path="/register" element={<Navigate to="/tr/register" replace />} />
            <Route path="/pricing" element={<Navigate to="/tr/pricing" replace />} />
            <Route path="/dashboard" element={<Navigate to="/tr/dashboard" replace />} />
            <Route path="/categories" element={<Navigate to="/tr/categories" replace />} />
            <Route path="/gallery" element={<Navigate to="/tr/gallery" replace />} />
            <Route path="/subscription" element={<Navigate to="/tr/subscription" replace />} />
            <Route path="/profile" element={<Navigate to="/tr/profile" replace />} />
            
            {/* Dil bazlı rotalar */}
            <Route path="/:lang/*" element={<LanguageRoutes />} />
            
            {/* Admin rotaları dil prefix'i olmadan */}
            <Route path="/admin/*" element={
              <Routes>
                <Route path="login" element={<PublicLayout><AdminLogin /></PublicLayout>} />
                <Route path="" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="dashboard" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="users" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminLayout>
                      <AdminUsers />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="jobs" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminLayout>
                      <AdminJobs />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="analytics" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminLayout>
                      <AdminAnalytics />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                <Route path="settings" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminLayout>
                      <AdminSettings />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
              </Routes>
            } />
          </Routes>
          
          <Toaster position="bottom-right" richColors />
        </div>
      </Router>
    </AuthProvider>
  );
}
