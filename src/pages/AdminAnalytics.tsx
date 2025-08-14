import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, FileImage, DollarSign, BarChart3, PieChart, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface AnalyticsData {
  userRegistrations: {
    date: string;
    count: number;
  }[];
  jobCompletions: {
    date: string;
    completed: number;
    failed: number;
  }[];
  categoryUsage: {
    category: string;
    count: number;
    percentage: number;
  }[];
  revenueData: {
    date: string;
    revenue: number;
    transactions: number;
  }[];
  topUsers: {
    id: string;
    name: string;
    email: string;
    jobCount: number;
    creditsUsed: number;
  }[];
  summary: {
    totalUsers: number;
    totalJobs: number;
    totalRevenue: number;
    avgJobsPerUser: number;
    successRate: number;
  };
}

const AdminAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [activeChart, setActiveChart] = useState<'users' | 'jobs' | 'revenue'>('users');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        const errorMsg = 'Admin token bulunamadı';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Hem analytics hem de stats verilerini al
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://64.226.75.76';
      const [analyticsResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/analytics?${new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        })}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!analyticsResponse.ok || !statsResponse.ok) {
        const errorMsg = `Analitik veriler alınamadı (Analytics: ${analyticsResponse.status}, Stats: ${statsResponse.status})`;
        throw new Error(errorMsg);
      }

      const analyticsResult = await analyticsResponse.json();
      const statsResult = await statsResponse.json();
      
      console.log('Analytics API response:', analyticsResult);
      console.log('Stats API response:', statsResult);
      
      if (analyticsResult.success && statsResult.success) {
        // API'den gelen veriyi uygun formata dönüştür
        const mockAnalyticsData: AnalyticsData = {
          userRegistrations: analyticsResult.data?.userGrowth || [],
          jobCompletions: [],
          categoryUsage: Object.entries(analyticsResult.data?.categoryStats || {}).map(([category, stats]: [string, any]) => ({
            category,
            count: stats.total || 0,
            percentage: 0
          })),
          revenueData: [],
          topUsers: [],
          summary: {
            totalUsers: statsResult.data?.totalUsers || 0,
            totalJobs: analyticsResult.data?.jobStats?.total || statsResult.data?.totalJobs || 0,
            totalRevenue: 0,
            avgJobsPerUser: 0,
            successRate: analyticsResult.data?.jobStats ? (analyticsResult.data.jobStats.completed / analyticsResult.data.jobStats.total * 100) : 0
          }
        };
        setAnalyticsData(mockAnalyticsData);
      } else {
        const errorMsg = 'API yanıtları başarısız durumda';
        setError(errorMsg);
        setAnalyticsData(null);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Fetch analytics error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Analitik veriler yüklenirken hata oluştu';
      setError(errorMsg);
      toast.error(errorMsg);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Admin token bulunamadı');
        return;
      }

      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: 'csv'
      });

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://64.226.75.76';
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Veri dışa aktarılamadı');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `analytics-${dateRange.startDate}-${dateRange.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Veriler başarıyla dışa aktarıldı');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Veri dışa aktarılırken hata oluştu');
    }
  };

  const getCategoryDisplayName = (categoryType: string) => {
    const categoryNames: Record<string, string> = {
      'Corporate': 'Kurumsal',
      'Creative': 'Yaratıcı',
      'Avatar': 'Avatar',
      'Outfit': 'Kıyafet',
      'Background': 'Arka Plan',
      'Skincare': 'Cilt Bakımı'
    };
    return categoryNames[categoryType] || categoryType;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 mx-4 max-w-md mx-auto">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Analitik Verileri Yüklenemedi</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchAnalytics}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Tekrar Dene
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Analitik veriler yüklenemedi</p>
      </div>
    );
  }

  return (
      <div className="space-y-6">

        {/* Date Range Filter */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchAnalytics}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Filtrele
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.summary.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileImage className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam İşlem</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.summary.totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-semibold text-gray-900">₺{analyticsData.summary.totalRevenue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ort. İşlem/Kullanıcı</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.summary.avgJobsPerUser.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Başarı Oranı</p>
                <p className="text-2xl font-semibold text-gray-900">%{analyticsData.summary.successRate.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveChart('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeChart === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Kullanıcı Kayıtları
              </button>
              <button
                onClick={() => setActiveChart('jobs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeChart === 'jobs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                İşlem Trendleri
              </button>
              <button
                onClick={() => setActiveChart('revenue')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeChart === 'revenue'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gelir Analizi
              </button>
            </nav>
          </div>

          <div className="p-6">
            <div className="h-80">
              {activeChart === 'users' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.userRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: tr })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: tr })}
                      formatter={(value: number) => [value, 'Yeni Kayıt']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeChart === 'jobs' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.jobCompletions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: tr })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: tr })}
                      formatter={(value: number, name: string) => [
                        value, 
                        name === 'completed' ? 'Başarılı' : 'Başarısız'
                      ]}
                    />
                    <Bar dataKey="completed" fill="#10B981" name="completed" />
                    <Bar dataKey="failed" fill="#EF4444" name="failed" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeChart === 'revenue' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: tr })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: tr })}
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? `₺${value}` : value,
                        name === 'revenue' ? 'Gelir' : 'İşlem Sayısı'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                      name="revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Usage */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kategori Kullanımı</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value} (${analyticsData.categoryUsage.find(c => getCategoryDisplayName(c.category) === name)?.percentage.toFixed(1)}%)`,
                      'İşlem Sayısı'
                    ]}
                  />
                  <Pie
                    data={analyticsData.categoryUsage.map(item => ({
                      ...item,
                      name: getCategoryDisplayName(item.category)
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                  >
                    {analyticsData.categoryUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">En Aktif Kullanıcılar</h3>
            <div className="space-y-4">
              {analyticsData.topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.jobCount} işlem</p>
                    <p className="text-xs text-gray-500">{user.creditsUsed} kredi</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default AdminAnalytics;