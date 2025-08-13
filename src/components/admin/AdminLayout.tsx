import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileImage, 
  BarChart3, 
  Settings, 
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Kullanıcılar', href: '/admin/users', icon: Users },
    { name: 'İşlemler', href: '/admin/jobs', icon: FileImage },
    { name: 'Analitik', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Ayarlar', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    toast.success('Çıkış yapıldı');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">


      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
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
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex h-16 items-center bg-white border-b border-gray-200 px-4 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900">
            {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
          </h2>
        </div>

        {/* Desktop header */}
        <div className="sticky top-0 z-10 hidden h-16 items-center bg-white border-b border-gray-200 px-6 lg:flex">
          <h2 className="text-lg font-semibold text-gray-900">
            {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
          </h2>
        </div>



        {/* Page content */}
        <main className="min-h-screen bg-gray-50 pt-0 lg:pt-0">
          <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;