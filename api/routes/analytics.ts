import { Router } from 'express';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// Google Analytics Data API client
let analyticsDataClient: BetaAnalyticsDataClient;

// Initialize GA4 client with service account
const initializeGA4Client = () => {
  try {
    if (!process.env.GA4_PROPERTY_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.warn('GA4 credentials not configured. Analytics will use mock data.');
      return null;
    }

    analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    
    return analyticsDataClient;
  } catch (error) {
    console.error('Failed to initialize GA4 client:', error);
    return null;
  }
};

// Initialize client on module load
initializeGA4Client();

// Helper function to format GA4 date
const formatGA4Date = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Get basic analytics data
router.get('/overview', adminAuth, async (req, res) => {
  try {
    if (!analyticsDataClient || !process.env.GA4_PROPERTY_ID) {
      // Return mock data if GA4 not configured
      return res.json({
        totalUsers: 1250,
        totalSessions: 1890,
        totalPageViews: 3420,
        bounceRate: 0.35,
        avgSessionDuration: 180,
        newUsers: 890
      });
    }

    const propertyId = process.env.GA4_PROPERTY_ID;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Last 30 days

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: formatGA4Date(startDate),
          endDate: formatGA4Date(endDate),
        },
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'newUsers' }
      ],
    });

    const row = response.rows?.[0];
    if (!row) {
      return res.status(404).json({ error: 'No data returned from GA4' });
    }

    const data = {
      totalUsers: parseInt(row.metricValues?.[0]?.value || '0'),
      totalSessions: parseInt(row.metricValues?.[1]?.value || '0'),
      totalPageViews: parseInt(row.metricValues?.[2]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[3]?.value || '0'),
      avgSessionDuration: parseInt(row.metricValues?.[4]?.value || '0'),
      newUsers: parseInt(row.metricValues?.[5]?.value || '0')
    };

    return res.json(data);
  } catch (error) {
    console.error('Error fetching GA4 overview data:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get traffic sources data
router.get('/traffic-sources', adminAuth, async (req, res) => {
  try {
    if (!analyticsDataClient || !process.env.GA4_PROPERTY_ID) {
      // Return mock data if GA4 not configured
      return res.json([
        { source: 'google', sessions: 850, percentage: 45 },
        { source: 'direct', sessions: 420, percentage: 22 },
        { source: 'facebook', sessions: 320, percentage: 17 },
        { source: 'twitter', sessions: 180, percentage: 9 },
        { source: 'other', sessions: 130, percentage: 7 }
      ]);
    }

    const propertyId = process.env.GA4_PROPERTY_ID;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: formatGA4Date(startDate),
          endDate: formatGA4Date(endDate),
        },
      ],
      dimensions: [
        { name: 'sessionSource' }
      ],
      metrics: [
        { name: 'sessions' }
      ],
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ],
      limit: 10
    });

    const totalSessions = response.rows?.reduce((sum, row) => {
      return sum + parseInt(row.metricValues?.[0]?.value || '0');
    }, 0) || 1;

    const trafficSources = response.rows?.map(row => {
      const sessions = parseInt(row.metricValues?.[0]?.value || '0');
      return {
        source: row.dimensionValues?.[0]?.value || 'unknown',
        sessions,
        percentage: Math.round((sessions / totalSessions) * 100)
      };
    }) || [];

    return res.json(trafficSources);
  } catch (error) {
    console.error('Error fetching GA4 traffic sources:', error);
    return res.status(500).json({ error: 'Failed to fetch traffic sources data' });
  }
});

// Get country-based data
router.get('/countries', adminAuth, async (req, res) => {
  try {
    if (!analyticsDataClient || !process.env.GA4_PROPERTY_ID) {
      // Return mock data if GA4 not configured
      return res.json([
        { country: 'Turkey', users: 450, sessions: 680 },
        { country: 'United States', users: 320, sessions: 480 },
        { country: 'Germany', users: 180, sessions: 270 },
        { country: 'United Kingdom', users: 150, sessions: 220 },
        { country: 'France', users: 120, sessions: 180 }
      ]);
    }

    const propertyId = process.env.GA4_PROPERTY_ID;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: formatGA4Date(startDate),
          endDate: formatGA4Date(endDate),
        },
      ],
      dimensions: [
        { name: 'country' }
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' }
      ],
      orderBys: [
        {
          metric: { metricName: 'totalUsers' },
          desc: true
        }
      ],
      limit: 10
    });

    const countries = response.rows?.map(row => ({
      country: row.dimensionValues?.[0]?.value || 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0')
    })) || [];

    return res.json(countries);
  } catch (error) {
    console.error('Error fetching GA4 countries data:', error);
    return res.status(500).json({ error: 'Failed to fetch countries data' });
  }
});

// Get page views data
router.get('/page-views', adminAuth, async (req, res) => {
  try {
    if (!analyticsDataClient || !process.env.GA4_PROPERTY_ID) {
      // Return mock data if GA4 not configured
      const mockData = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        mockData.push({
          date: date.toISOString().split('T')[0],
          pageViews: Math.floor(Math.random() * 200) + 50,
          uniquePageViews: Math.floor(Math.random() * 150) + 30
        });
      }
      return res.json(mockData);
    }

    const propertyId = process.env.GA4_PROPERTY_ID;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: formatGA4Date(startDate),
          endDate: formatGA4Date(endDate),
        },
      ],
      dimensions: [
        { name: 'date' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' }
      ],
      orderBys: [
        {
          dimension: { dimensionName: 'date' },
          desc: false
        }
      ]
    });

    const pageViewsData = response.rows?.map(row => ({
      date: row.dimensionValues?.[0]?.value || '',
      pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
      uniquePageViews: parseInt(row.metricValues?.[1]?.value || '0')
    })) || [];

    return res.json(pageViewsData);
  } catch (error) {
    console.error('Error fetching GA4 page views data:', error);
    return res.status(500).json({ error: 'Failed to fetch page views data' });
  }
});

// Get real-time data
router.get('/realtime', adminAuth, async (req, res) => {
  try {
    if (!analyticsDataClient || !process.env.GA4_PROPERTY_ID) {
      // Return mock data if GA4 not configured
      return res.json({
        activeUsers: Math.floor(Math.random() * 50) + 10,
        activePages: [
          { page: '/', users: Math.floor(Math.random() * 20) + 5 },
          { page: '/dashboard', users: Math.floor(Math.random() * 15) + 3 },
          { page: '/pricing', users: Math.floor(Math.random() * 10) + 2 }
        ]
      });
    }

    const propertyId = process.env.GA4_PROPERTY_ID;

    const [response] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [
        { name: 'activeUsers' }
      ]
    });

    const activeUsers = parseInt(response.rows?.[0]?.metricValues?.[0]?.value || '0');

    // Get active pages
    const [pagesResponse] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [
        { name: 'unifiedPagePathScreen' }
      ],
      metrics: [
        { name: 'activeUsers' }
      ],
      orderBys: [
        {
          metric: { metricName: 'activeUsers' },
          desc: true
        }
      ],
      limit: 5
    });

    const activePages = pagesResponse.rows?.map(row => ({
      page: row.dimensionValues?.[0]?.value || '/',
      users: parseInt(row.metricValues?.[0]?.value || '0')
    })) || [];

    return res.json({
      activeUsers,
      activePages
    });
  } catch (error) {
    console.error('Error fetching GA4 realtime data:', error);
    return res.status(500).json({ error: 'Failed to fetch realtime data' });
  }
});

export default router;