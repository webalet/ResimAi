import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FileImage, User, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Activity {
  id: string;
  category_type: string;
  style: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  users: {
    name: string;
    email: string;
  };
}

interface RecentActivitiesProps {
  activities: Activity[];
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'failed':
        return 'Başarısız';
      case 'processing':
        return 'İşleniyor';
      case 'pending':
        return 'Bekliyor';
      default:
        return status;
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

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileImage className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Henüz aktivite bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            <div className="p-2 bg-white rounded-full">
              <FileImage className="h-4 w-4 text-gray-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {getCategoryDisplayName(activity.category_type)}
                </span>
                <span className="text-sm text-gray-500 flex-shrink-0">•</span>
                <span className="text-sm text-gray-600 truncate">{activity.style}</span>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                {getStatusIcon(activity.status)}
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {getStatusText(activity.status)}
                </span>
              </div>
            </div>
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <User className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{activity.users.name}</span>
              <span className="mx-2 flex-shrink-0">•</span>
              <span className="whitespace-nowrap">
                {(() => {
                  try {
                    if (!activity.created_at) return 'Tarih belirtilmemiş';
                    const date = new Date(activity.created_at);
                    if (isNaN(date.getTime())) return 'Geçersiz tarih';
                    return formatDistanceToNow(date, {
                      addSuffix: true,
                      locale: tr
                    });
                  } catch (error) {
                    
                    return 'Tarih formatlanamadı';
                  }
                })()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivities;