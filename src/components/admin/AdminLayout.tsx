import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileImage, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Touch gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Body scroll lock when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Keyboard navigation - ESC to close sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // Close sidebar on left swipe when open
    if (isLeftSwipe && sidebarOpen) {
      setSidebarOpen(false);
    }
    
    // Open sidebar on right swipe from left edge when closed
    if (isRightSwipe && !sidebarOpen && touchStart < 50) {
      setSidebarOpen(true);
    }
  }, [touchStart, touchEnd, sidebarOpen]);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Kullanıcılar', href: '/admin/users', icon: Users },
    { name: 'İşlemler', href: '/admin/jobs', icon: FileImage },
    { name: 'Analitik', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Ayarlar', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminToken');
    toast.success('Çıkış yapıldı');
    navigate('/admin/login');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigasyon menüsü"
      >
        <div 
          className="fixed inset-0 bg-gray-900 z-40 transition-opacity duration-300" 
          style={{
            opacity: sidebarOpen ? 0.5 : 0,
            transform: 'translate3d(0, 0, 0)'
          }}
          onClick={useCallback(() => setSidebarOpen(false), [])}
          aria-hidden="true"
        />
        <div 
             id="mobile-sidebar"
             className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl z-50 transform translate3d(0,0,0) transition-transform duration-300 ease-in-out will-change-transform"
             style={{
               transform: sidebarOpen ? 'translate3d(0, 0, 0)' : 'translate3d(-100%, 0, 0)',
               transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
             }}
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
             role="navigation"
             aria-label="Mobil navigasyon menüsü"
           >
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={useCallback(() => setSidebarOpen(false), [])}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Menüyü kapat"
              type="button"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4" role="navigation" aria-label="Ana navigasyon">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={useCallback(() => setSidebarOpen(false), [])}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:will-change-transform">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm min-h-full">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div 
        className="lg:pl-64 min-h-screen flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile header */}
        <div className="sticky top-0 z-20 flex h-16 items-center bg-white border-b border-gray-200 px-4 lg:hidden will-change-transform backdrop-blur-sm bg-white/95">
          <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 transition-colors"
              onClick={useCallback(() => setSidebarOpen(true), [])}
              aria-label="Menüyü aç"
              aria-expanded={sidebarOpen}
              aria-controls="mobile-sidebar"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
        </div>

        {/* Page content */}
        <main className="flex-1 bg-gray-50 overflow-x-hidden">
           <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
             <div className="max-w-7xl mx-auto">
               {children}
             </div>
           </div>
         </main>
      </div>
    </div>
  );
};

export default AdminLayout;