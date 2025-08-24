import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, FileImage, DollarSign, BarChart3, PieChart, Download, Globe, Eye, MousePointer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

/*
 * Google Analytics Gerçek Veri Entegrasyonu
 * 
 * Şu anda mock data kullanılıyor. Gerçek Google Analytics verilerini almak için:
 * 
 * 1. Google Analytics Reporting API v4 kullanın
 * 2. Service Account oluşturun ve JSON key dosyası indirin
 * 3. Backend'de @google-analytics/data paketini kurun:
 *    npm install @google-analytics/data
 * 
 * 4. Backend'de API endpoint'i oluşturun:
 * 
 * const { BetaAnalyticsDataClient } = require('@google-analytics/data');
 * 
 * const analyticsDataClient = new BetaAnalyticsDataClient({
 *   keyFilename: 'path/to/service-account-key.json'
 * });
 * 
 * router.get('/analytics/ga-data', async (req, res) => {
 *   try {
 *     const [response] = await analyticsDataClient.runReport({
 *       property: 'properties/YOUR_PROPERTY_ID',
 *       dateRanges: [{
 *         startDate: req.query.startDate || '30daysAgo',
 *         endDate: req.query.endDate || 'today'
 *       }],
 *       dimensions: [
 *         { name: 'country' },
 *         { name: 'source' },
 *         { name: 'pagePath' }
 *       ],
 *       metrics: [
 *         { name: 'activeUsers' },
 *         { name: 'sessions' },
 *         { name: 'pageviews' },
 *         { name: 'bounceRate' }
 *       ]
 *     });
 * 
 *     // Veriyi işle ve frontend formatına dönüştür
 *     const processedData = {
 *       trafficStats: {
 *         totalVisits: response.rows?.length || 0,
 *         uniqueVisitors: response.metricHeaders?.[0]?.name || 0,
 *         pageViews: response.metricHeaders?.[2]?.name || 0,
 *         bounceRate: response.metricHeaders?.[3]?.name || 0
 *       },
 *       referrerSources: response.rows?.map(row => ({
 *         source: row.dimensionValues?.[1]?.value || 'Unknown',
 *         count: parseInt(row.metricValues?.[1]?.value || '0'),
 *         percentage: 0 // Hesaplanacak
 *       })) || [],
 *       countryStats: response.rows?.map(row => ({
 *         country: row.dimensionValues?.[0]?.value || 'Unknown',
 *         visits: parseInt(row.metricValues?.[0]?.value || '0'),
 *         flag: getCountryFlag(row.dimensionValues?.[0]?.value)
 *       })) || [],
 *       pageViews: response.rows?.map(row => ({
 *         url: row.dimensionValues?.[2]?.value || '/',
 *         views: parseInt(row.metricValues?.[2]?.value || '0'),
 *         uniqueVisitors: parseInt(row.metricValues?.[0]?.value || '0')
 *       })) || []
 *     };
 * 
 *     res.json({ success: true, data: processedData });
 *   } catch (error) {
 *     console.error('GA API Error:', error);
 *     res.status(500).json({ success: false, error: error.message });
 *   }
 * });
 * 
 * 5. Frontend'de gerçek API'yi çağırın:
 *    const response = await fetch(`${API_BASE_URL}/api/admin/analytics/ga-data?startDate=${startDate}&endDate=${endDate}`);
 * 
 * Not: Şu anda güvenlik ve basitlik için mock data kullanılıyor.
 */

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

interface WebAnalytics {
  referrerSources: {
    source: string;
    count: number;
    percentage: number;
  }[];
  countryStats: {
    country: string;
    visits: number;
    flag: string;
  }[];
  pageViews: {
    url: string;
    views: number;
    uniqueVisitors: number;
  }[];
  trafficStats: {
    totalVisits: number;
    uniqueVisitors: number;
    pageViews: number;
    bounceRate: number;
  };
}

// Helper function to get country flag emoji
const getCountryFlag = (countryName: string): string => {
  const countryFlags: { [key: string]: string } = {
    'Turkey': '🇹🇷',
    'Türkiye': '🇹🇷',
    'United States': '🇺🇸',
    'Germany': '🇩🇪',
    'Almanya': '🇩🇪',
    'United Kingdom': '🇬🇧',
    'İngiltere': '🇬🇧',
    'France': '🇫🇷',
    'Fransa': '🇫🇷',
    'Netherlands': '🇳🇱',
    'Hollanda': '🇳🇱',
    'Spain': '🇪🇸',
    'İspanya': '🇪🇸',
    'Italy': '🇮🇹',
    'İtalya': '🇮🇹',
    'Canada': '🇨🇦',
    'Kanada': '🇨🇦',
    'Australia': '🇦🇺',
    'Avustralya': '🇦🇺',
    'Japan': '🇯🇵',
    'Japonya': '🇯🇵',
    'South Korea': '🇰🇷',
    'Güney Kore': '🇰🇷',
    'Brazil': '🇧🇷',
    'Brezilya': '🇧🇷',
    'India': '🇮🇳',
    'Hindistan': '🇮🇳',
    'China': '🇨🇳',
    'Çin': '🇨🇳',
    'Russia': '🇷🇺',
    'Rusya': '🇷🇺'
  };
  
  return countryFlags[countryName] || '🌍';
};

const AdminAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [webAnalytics, setWebAnalytics] = useState<WebAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [webLoading, setWebLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [activeChart, setActiveChart] = useState<'users' | 'jobs' | 'revenue'>('users');

  useEffect(() => {
    fetchAnalytics();
    fetchWebAnalytics();
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
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://64.226.75.76';
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
        const analyticsData: AnalyticsData = {
          userRegistrations: analyticsResult.data?.userGrowth || [],
          jobCompletions: analyticsResult.data?.jobCompletions || [],
          categoryUsage: analyticsResult.data?.categoryStats || [],
          revenueData: analyticsResult.data?.revenueData || [],
          topUsers: analyticsResult.data?.topUsers || [],
          summary: analyticsResult.data?.summary || {
            totalUsers: 0,
            totalJobs: 0,
            totalRevenue: 0,
            avgJobsPerUser: 0,
            successRate: 0
          }
        };
        setAnalyticsData(analyticsData);
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

  const fetchWebAnalytics = async () => {
    try {
      setWebLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://64.226.75.76';
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      // Gerçek Google Analytics 4 API çağrıları
      const [overviewResponse, trafficSourcesResponse, countriesResponse, pageViewsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analytics/overview?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/api/analytics/traffic-sources?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/api/analytics/countries?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/api/analytics/page-views?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      // API yanıtlarını kontrol et
      if (!overviewResponse.ok || !trafficSourcesResponse.ok || !countriesResponse.ok || !pageViewsResponse.ok) {
        throw new Error(`GA4 API hatası: ${overviewResponse.status}`);
      }

      const [overviewData, trafficSourcesData, countriesData, pageViewsData] = await Promise.all([
        overviewResponse.json(),
        trafficSourcesResponse.json(),
        countriesResponse.json(),
        pageViewsResponse.json()
      ]);

      // GA4 verilerini frontend formatına dönüştür
      const webAnalyticsData: WebAnalytics = {
        trafficStats: {
          totalVisits: overviewData.totalSessions || 0,
          uniqueVisitors: overviewData.totalUsers || 0,
          pageViews: overviewData.totalPageViews || 0,
          bounceRate: overviewData.bounceRate || 0
        },
        referrerSources: trafficSourcesData.map((item: any) => ({
          source: item.source || 'Unknown',
          count: item.sessions || 0,
          percentage: item.percentage || 0
        })),
        countryStats: countriesData.map((item: any) => ({
          country: item.country || 'Unknown',
          visits: item.sessions || 0,
          flag: getCountryFlag(item.country)
        })),
        pageViews: pageViewsData.map((item: any) => ({
          url: item.date || '/',
          views: item.pageViews || 0,
          uniqueVisitors: item.uniquePageViews || 0
        }))
      };

      setWebAnalytics(webAnalyticsData);
      console.log('GA4 Analytics Data:', webAnalyticsData);
    } catch (error) {
      console.error('GA4 Analytics Error:', error);
      toast.error('Google Analytics verileri alınamadı, mock data kullanılıyor');
      
      // Hata durumunda mock data kullan
      const mockWebAnalytics: WebAnalytics = {
        trafficStats: {
          totalVisits: 12450,
          uniqueVisitors: 8320,
          pageViews: 18750,
          bounceRate: 42.5
        },
        referrerSources: [
          { source: 'Google', count: 5200, percentage: 41.8 },
          { source: 'Direct', count: 3100, percentage: 24.9 },
          { source: 'YouTube', count: 1850, percentage: 14.9 },
          { source: 'Facebook', count: 1200, percentage: 9.6 },
          { source: 'Instagram', count: 800, percentage: 6.4 },
          { source: 'Diğer', count: 300, percentage: 2.4 }
        ],
        countryStats: [
          { country: 'Türkiye', visits: 7200, flag: '🇹🇷' },
          { country: 'Almanya', visits: 1800, flag: '🇩🇪' },
          { country: 'ABD', visits: 1200, flag: '🇺🇸' },
          { country: 'İngiltere', visits: 900, flag: '🇬🇧' },
          { country: 'Fransa', visits: 650, flag: '🇫🇷' },
          { country: 'Hollanda', visits: 450, flag: '🇳🇱' },
          { country: 'Diğer', visits: 250, flag: '🌍' }
        ],
        pageViews: [
          { url: '/', views: 4200, uniqueVisitors: 3100 },
          { url: '/pricing', views: 2800, uniqueVisitors: 2200 },
          { url: '/categories', views: 2100, uniqueVisitors: 1800 },
          { url: '/login', views: 1900, uniqueVisitors: 1600 },
          { url: '/register', views: 1500, uniqueVisitors: 1300 },
          { url: '/about', views: 1200, uniqueVisitors: 1000 },
          { url: '/contact', views: 800, uniqueVisitors: 650 },
          { url: '/terms', views: 400, uniqueVisitors: 350 }
        ]
      };
      setWebAnalytics(mockWebAnalytics);
    } finally {
      setWebLoading(false);
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

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://64.226.75.76';
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
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.summary.avgJobsPerUser ? analyticsData.summary.avgJobsPerUser.toFixed(1) : '0.0'}</p>
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
                <p className="text-2xl font-semibold text-gray-900">%{analyticsData.summary.successRate ? analyticsData.summary.successRate.toFixed(1) : '0.0'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Web Analytics Cards */}
        {webAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <MousePointer className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Ziyaret</p>
                  <p className="text-2xl font-semibold text-gray-900">{webAnalytics.trafficStats.totalVisits.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Users className="h-6 w-6 text-cyan-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Benzersiz Ziyaretçi</p>
                  <p className="text-2xl font-semibold text-gray-900">{webAnalytics.trafficStats.uniqueVisitors.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Eye className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sayfa Görüntüleme</p>
                  <p className="text-2xl font-semibold text-gray-900">{webAnalytics.trafficStats.pageViews.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Çıkış Oranı</p>
                  <p className="text-2xl font-semibold text-gray-900">%{webAnalytics.trafficStats.bounceRate}</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    formatter={(value: number, name: string) => {
                      const percentage = analyticsData.categoryUsage.find(
                        c => getCategoryDisplayName(c.category) === name
                      )?.percentage;
                      return [
                        `${value} (${percentage ? percentage.toFixed(1) : 0}%)`,
                        'İşlem Sayısı'
                      ];
                    }}
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
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
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

        {/* Web Analytics Section */}
        {webAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Referrer Sources */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-blue-600" />
                Yönlendiren Kaynaklar
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Tooltip 
                       formatter={(value: number, name: string) => {
                         const percentage = webAnalytics.referrerSources.find(
                           r => r.source === name
                         )?.percentage;
                         return [
                           `${value.toLocaleString()} (%${percentage ? percentage.toFixed(1) : 0})`,
                           'Ziyaret'
                         ];
                       }}
                     />
                    <Pie
                      data={webAnalytics.referrerSources}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="source"
                      label={({ payload, percent }) => `${payload.source} (${(percent * 100).toFixed(1)}%)`}
                    >
                      {webAnalytics.referrerSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Country Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-green-600" />
                Ülke Bazlı Ziyaretler
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {webAnalytics.countryStats.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{country.country}</p>
                        <p className="text-xs text-gray-500">#{index + 1} sırada</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{country.visits.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">ziyaret</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Page Views Table */}
        {webAnalytics && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Eye className="h-5 w-5 mr-2 text-purple-600" />
                Sayfa Ziyaret Analitikleri
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sayfa URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Toplam Görüntüleme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Benzersiz Ziyaretçi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ort. Görüntüleme/Ziyaretçi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {webAnalytics.pageViews.map((page, index) => (
                    <tr key={page.url} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{page.url}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {page.views.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {page.uniqueVisitors.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(page.views / page.uniqueVisitors).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  );
};

export default AdminAnalytics;