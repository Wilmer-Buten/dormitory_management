import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { UserPlus, Search, Mail, Key, User as UserIcon, Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';

function UserManagement() {
  const { getTranslation, users, fetchUsers, createUser, enableFetchUsersQuery, setEnableFetchUsersQuery } = useStore();
  const t = getTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'staff' as 'admin' | 'staff',
    building: 'edwards'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser(formData);
    setFormData({ 
      username: '',
      password: '',
      name: '',
      role: 'staff',
      building: 'edwards'
    });
  };

     const { isLoading } = useQuery({
          queryKey: ['users'],
          queryFn: fetchUsers,
          enabled: enableFetchUsersQuery
        });

        if (isLoading) {
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          );
        }


  return (
    <div className="p-8">
      <Toaster position="top-right" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t.users.title}</h1>
        <p className="text-gray-600">{t.users.subtitle}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">{t.users.createNew}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.users.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.users.password}
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.users.name}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.users.role}
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="admin">{t.users.roles.admin}</option>
                <option value="staff">{t.users.roles.staff}</option>
              </select>
            </div>
            
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.users.building}
                </label>
                <select
                  name="building"
                  value={formData.building}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="edwards">{t.buildings.edwards}</option>
                  <option value="holland">{t.buildings.holland}</option>
                  <option value="peterson">{t.buildings.peterson}</option>
                  <option value="wade">{t.buildings.wade}</option>
                </select>
              </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            {t.users.create}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t.users.list}</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t.users.search}
                className="pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-4">{t.users.name}</th>
                <th className="pb-4">{t.users.email}</th>
                <th className="pb-4">{t.users.role}</th>
                <th className="pb-4">{t.users.building}</th>
                <th className="pb-4">{t.users.actions}</th>
              </tr>
            </thead>
            <tbody>
              {/* Example rows */}
              {users.map((user) => (
                  <tr className="border-b">
                  <td className="py-4">{user.name}</td>
                  <td className="py-4">{user.username}</td>
                  <td className="py-4">{user.role}</td>
                  <td className="py-4">{user.building}</td>
                  <td className="py-4">
                    <button className="text-blue-600 hover:text-blue-700">
                      {t.users.edit}
                    </button>
                  </td>
                </tr>
              ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;