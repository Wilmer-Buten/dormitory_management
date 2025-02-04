import React, { useMemo, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { UserPlus, Search, Mail, Key, User as UserIcon, Loader2, Plus, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { Translation, User } from '../types';
import { EditUserModal } from './EditUserModal';

// Componente para el formulario de creación
const CreateUserForm = React.memo(({ onSubmit, onCancel, t }: {
  onSubmit: (formData: User) => void;
  onCancel: () => void;
  t: Translation;
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'staff' as 'admin' | 'staff',
    building: 'edwards'
  });
  const [passwordError, setPasswordError] = useState('');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    const { confirmPassword, ...submitData } = formData;
    onSubmit(submitData);
  }, [formData, onSubmit]);

  return (
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
              Confirm {t.users.password}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`pl-10 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  passwordError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                required
              />
            </div>
            {passwordError && (
              <p className="mt-1 text-sm text-red-500">{passwordError}</p>
            )}
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
          
          <div>
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

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus size={20} />
            {t.users.create}
          </button>
        </div>
      </form>
    </div>
  );
});

// Componente para la tabla de usuarios
const UsersTable = React.memo(({ users, onEdit, t, getBuildingName }: {
  users: User[];
  onEdit: (user: User) => void;
  t: any;
  getBuildingName: (id: number | undefined) => string;
}) => (
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
      {users.map((user) => (
        <tr key={user.id} className="border-b">
          <td className="py-4">{user.name}</td>
          <td className="py-4">{user.username}</td>
          <td className="py-4">{user.role}</td>
          <td className="py-4">{getBuildingName(user.building_id)}</td>
          <td className="py-4">
            <button 
              className="text-blue-600 hover:text-blue-700"
              onClick={() => onEdit(user)}
            >
              {t.users.edit}
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
));

function UserManagement() {
  const { getTranslation, users, fetchUsers, createUser, enableFetchUsersQuery, isLoading } = useStore();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const t = getTranslation();

  const getBuildingName = useCallback((id: number | undefined) => {
    switch (id) {
      case 1:
        return 'Edwards Hall';
      case 2:
        return 'Holland Hall';
      case 3:
        return 'Peterson Hall';
      case 4:
        return 'Wade Hall';
      default:
        return 'All Buildings';
    }
  }, []);

  const filteredUsers = useMemo(() => users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.building?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [users, searchTerm]);

  const handleCreateUser = useCallback(async (formData: any) => {
    await createUser(formData);
    setShowCreateForm(false);
  }, [createUser]);

  const { isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: enableFetchUsersQuery
  });

  if (isLoading || isLoadingUsers) {
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

      <div className="mb-8">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          {showCreateForm ? <X size={20} /> : <Plus size={20} />}
          {showCreateForm ? t.users.cancelCreate : t.users.createNew}
        </button>
      </div>

      {showCreateForm && (
        <CreateUserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateForm(false)}
          t={t}
        />
      )}

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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <UsersTable
            users={filteredUsers}
            onEdit={setEditingUser}
            t={t}
            getBuildingName={getBuildingName}
          />
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={{...editingUser, building: getBuildingName(editingUser.building_id), id: editingUser.id}}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}

export default UserManagement;

export { UserManagement }