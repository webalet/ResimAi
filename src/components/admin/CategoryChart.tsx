import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CategoryChartProps {
  data: Record<string, number>;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
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

  const chartData = Object.entries(data).map(([category, count]) => ({
    category: getCategoryDisplayName(category),
    count,
    originalCategory: category
  })).sort((a, b) => b.count - a.count);

  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#8B5CF6', // purple
    '#F59E0B', // orange
    '#EF4444', // red
    '#6B7280'  // gray
  ];

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>Henüz kategori verisi bulunmuyor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="category" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: number) => [value, 'İşlem Sayısı']}
            labelStyle={{ color: '#374151' }}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}
          />
          <Bar 
            dataKey="count" 
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.originalCategory} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;