import React, { useState, useEffect } from 'react';
import { Users, FileImage, TrendingUp, Activity, Calendar, BarChart3 } from 'lucide-react';
import StatsCard from '../../components/admin/StatsCard';
import RecentActivities from '../../components/admin/RecentActivities';
import CategoryChart from '../../components/admin/CategoryChart';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  dailyJobs: number;
  monthlyJobs: number;
  categoryUsage: Record<string, number>;
  recentActivities: any[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Admin token bulunamadı');
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://64.226.75.76:5173';
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('İstatistikler alınamadı');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchDashboardStats}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
      <div className="space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatsCard
            title="Toplam Kullanıcı"
            value={stats?.totalUsers || 0}
            icon={Users}
            color="blue"
            change="+12%"
            changeType="increase"
          />
          <StatsCard
            title="Aktif Kullanıcı"
            value={stats?.activeUsers || 0}
            icon={Activity}
            color="green"
            change="+8%"
            changeType="increase"
          />
          <StatsCard
            title="Toplam İşlem"
            value={stats?.totalJobs || 0}
            icon={FileImage}
            color="purple"
            change="+23%"
            changeType="increase"
          />
          <StatsCard
            title="Günlük İşlem"
            value={stats?.dailyJobs || 0}
            icon={TrendingUp}
            color="orange"
            change="-5%"
            changeType="decrease"
          />
        </div>

        {/* Charts and Activities */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Category Usage Chart */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Kategori Kullanımı</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <CategoryChart data={stats?.categoryUsage || {}} />
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <RecentActivities activities={stats?.recentActivities || []} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İstatistikler</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.monthlyJobs || 0}</div>
              <div className="text-sm text-blue-800">Aylık İşlem</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats?.totalJobs && stats?.totalUsers 
                  ? Math.round(stats.totalJobs / stats.totalUsers * 10) / 10 
                  : 0}
              </div>
              <div className="text-sm text-green-800">Kullanıcı Başına Ortalama İşlem</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(stats?.categoryUsage || {}).length}
              </div>
              <div className="text-sm text-purple-800">Aktif Kategori</div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AdminDashboard;