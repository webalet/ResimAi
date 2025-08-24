import React, { useState } from 'react';
import { X, Save, Shield, ShieldOff, Ban, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  is_admin: boolean;
  is_banned?: boolean;
  created_at: string;
}

interface UserEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated
}) => {
  const [formData, setFormData] = useState({
    credits: user.credits,
    password: '',
    is_admin: user.is_admin,
    is_banned: user.is_banned || false
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Admin token bulunamadı');
      }

      const updateData: any = {
        credits: parseInt(formData.credits.toString()),
        is_admin: formData.is_admin,
        is_banned: formData.is_banned
      };

      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://64.226.75.76';
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Kullanıcı başarıyla güncellendi');
        const updatedUser = {
          ...user,
          credits: parseInt(formData.credits.toString()),
          is_admin: formData.is_admin,
          is_banned: formData.is_banned
        };
        onUserUpdated(updatedUser);
        onClose();
      } else {
        toast.error(data.message || 'Güncelleme başarısız');
      }
    } catch (error) {

      toast.error('Kullanıcı güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Kullanıcı Düzenle
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="credits" className="block text-sm font-medium text-gray-700">
                  Kredi Miktarı
                </label>
                <input
                  type="number"
                  id="credits"
                  name="credits"
                  min="0"
                  value={formData.credits}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Yeni Şifre (Opsiyonel)
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Değiştirmek için yeni şifre girin"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Boş bırakırsanız şifre değiştirilmez
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_admin"
                  name="is_admin"
                  checked={formData.is_admin}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-900">
                  <div className="flex items-center">
                    {formData.is_admin ? (
                      <Shield className="h-4 w-4 text-purple-600 mr-1" />
                    ) : (
                      <ShieldOff className="h-4 w-4 text-gray-400 mr-1" />
                    )}
                    Admin yetkisi ver
                  </div>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_banned"
                  name="is_banned"
                  checked={formData.is_banned}
                  onChange={handleChange}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="is_banned" className="ml-2 block text-sm text-gray-900">
                  <div className="flex items-center">
                    {formData.is_banned ? (
                      <Ban className="h-4 w-4 text-red-600 mr-1" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-green-500 mr-1" />
                    )}
                    Kullanıcıyı yasakla
                  </div>
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <div className="text-sm text-yellow-800">
                    <strong>Dikkat:</strong> Admin yetkisi verilen kullanıcılar tüm sistem ayarlarına erişebilir.
                  </div>
                </div>
              </div>

              {formData.is_banned && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <div className="text-sm text-red-800">
                      <strong>Uyarı:</strong> Yasaklanan kullanıcılar sisteme giriş yapamayacak.
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Güncelleniyor...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;