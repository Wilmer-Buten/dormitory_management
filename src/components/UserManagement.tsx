"use client"

import React, { useMemo, useState, useCallback, useEffect } from "react"
import { useStore } from "../store/useStore"
import { UserPlus, Search, Mail, Key, UserIcon, Loader2, Plus, X, Shield, Building2, Pencil } from "lucide-react"
import { Toaster } from "react-hot-toast"
import { useQuery } from "@tanstack/react-query"
import type { Building, Translation, User } from "../types"
import { EditUserModal } from "./EditUserModal"

// Componente para el formulario de creación
const CreateUserForm = React.memo(
  ({
    onSubmit,
    onCancel,
    t,
    buildings,
    isSupervisor,
    ownBuildingName,
  }: {
    onSubmit: (formData: User) => void
    onCancel: () => void
    t: Translation
    buildings: Building[]
    isSupervisor: boolean
    ownBuildingName: string
  }) => {
    const [formData, setFormData] = useState({
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      lastname: "",
      role: "staff" as "admin" | "supervisor" | "staff",
      building: buildings[0]?.name || "",
    })
    const [passwordError, setPasswordError] = useState("")

    useEffect(() => {
      if (!formData.building && buildings.length > 0) {
        setFormData((prev) => ({ ...prev, building: buildings[0].name }))
      }
    }, [buildings, formData.building])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))

      if (name === "password" || name === "confirmPassword") {
        setPasswordError("")
      }
    }, [])

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
          setPasswordError("Passwords do not match")
          return
        }

        const { confirmPassword, username, lastname, ...rest } = formData
        onSubmit({
          ...rest,
          username: username.trim() ? username.trim() : undefined,
          lastname: lastname.trim() ? lastname.trim() : undefined,
        })
      },
      [formData, onSubmit],
    )

    return (
      <div className="card p-5 sm:p-6 mb-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">{t.users.createNew}</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">{t.users.email}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input input-icon"
                  placeholder="jdoe@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">{t.users.username}</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="input input-icon"
                  placeholder="e.g. jdoe (optional)"
                />
              </div>
            </div>

            <div>
              <label className="label">{t.users.name}</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input input-icon"
                  placeholder="John"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">{t.users.lastname}</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  className="input input-icon"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="label">{t.users.password}</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input input-icon"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Confirm {t.users.password}</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`input input-icon ${passwordError ? "border-red-400 focus:ring-red-400/30" : ""}`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {passwordError && <p className="mt-1.5 text-sm text-red-500">{passwordError}</p>}
            </div>

            <div>
              <label className="label">{t.users.role}</label>
              {isSupervisor ? (
                <div className="input bg-slate-50 text-slate-500 cursor-not-allowed">{t.users.roles.staff}</div>
              ) : (
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="admin">{t.users.roles.admin}</option>
                  <option value="supervisor">{t.users.roles.supervisor}</option>
                  <option value="staff">{t.users.roles.staff}</option>
                </select>
              )}
            </div>

            <div>
              <label className="label">{t.users.building}</label>
              {isSupervisor ? (
                <div className="input bg-slate-50 text-slate-500 cursor-not-allowed">
                  {ownBuildingName.charAt(0).toUpperCase() + ownBuildingName.slice(1)}
                </div>
              ) : (
                <select
                  name="building"
                  value={formData.building}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name.charAt(0).toUpperCase() + b.name.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary btn-md text-sm"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="btn-primary btn-md text-sm"
            >
              <UserPlus size={18} />
              {t.users.create}
            </button>
          </div>
        </form>
      </div>
    )
  },
)

const ROLE_LABELS: Record<string, (t: any) => string> = {
  admin: (t) => t.users.roles.admin,
  supervisor: (t) => t.users.roles.supervisor,
  staff: (t) => t.users.roles.staff,
}

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700",
  supervisor: "bg-indigo-50 text-indigo-700",
  staff: "bg-slate-100 text-slate-600",
}

const RoleBadge = ({ role, t }: { role: string; t: any }) => (
  <span className={`badge ${ROLE_STYLES[role] ?? ROLE_STYLES.staff}`}>
    <Shield size={12} />
    {(ROLE_LABELS[role] ?? ROLE_LABELS.staff)(t)}
  </span>
)

// Tabla de usuarios (desktop)
const UsersTable = React.memo(
  ({
    users,
    onEdit,
    t,
    getBuildingName,
    currentUser
  }: {
    users: User[]
    onEdit: (user: User) => void
    t: any
    getBuildingName: (id: number | undefined) => string
    currentUser: User | null 
  }) => (
    <table className="w-full min-w-[850px]">
      <thead>
        <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
          <th className="pb-3 px-2 whitespace-nowrap">{t.users.name}</th>
          <th className="pb-3 px-2 whitespace-nowrap">{t.users.lastname}</th>
          <th className="pb-3 px-2 whitespace-nowrap">{t.users.username}</th>
          <th className="pb-3 px-2 whitespace-nowrap">{t.users.email}</th>
          <th className="pb-3 px-2 whitespace-nowrap">{t.users.role}</th>
          <th className="pb-3 px-2 whitespace-nowrap">{t.users.building}</th>
          <th className="pb-3 px-2 whitespace-nowrap text-right">{t.users.actions}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {users.map((user) => (
          <tr key={user.id} className={`hover:bg-slate-50/70 transition-colors ${user.active === false ? "opacity-60" : ""}`}>
            <td className="py-3.5 px-2 font-medium text-slate-800">
              <div className="flex items-center gap-2">
                {user.name}
                {user.active === false && (
                  <span className="badge bg-slate-100 text-slate-500">{t.users.statusInactive}</span>
                )}
              </div>
            </td>
            <td className="py-3.5 px-2 text-slate-500">{user.lastname || "—"}</td>
            <td className="py-3.5 px-2 text-slate-500">{user.username || "—"}</td>
            <td className="py-3.5 px-2 text-slate-500">{user.email}</td>
            <td className="py-3.5 px-2"><RoleBadge role={user.role} t={t} /></td>
            <td className="py-3.5 px-2 text-slate-500">{getBuildingName(user.building_id)}</td>
            <td className="py-3.5 px-2 text-right">
              {user.id === currentUser?.id ? (
                <span className="text-slate-300 text-sm cursor-not-allowed">{t.users.edit}</span>
              ) : (
                <button
                  className="text-brand-600 hover:text-brand-700 font-medium text-sm inline-flex items-center gap-1"
                  onClick={() => onEdit(user)}
                >
                  <Pencil size={14} /> {t.users.edit}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
);

// Lista de usuarios en tarjetas (mobile)
const UsersCardList = React.memo(
  ({
    users,
    onEdit,
    t,
    getBuildingName,
    currentUser
  }: {
    users: User[]
    onEdit: (user: User) => void
    t: any
    getBuildingName: (id: number | undefined) => string
    currentUser: User | null
  }) => (
    <div className="space-y-2.5">
      {users.map((user) => {
        const isSelf = user.id === currentUser?.id
        return (
          <div
            key={user.id}
            className={`flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-white ${!isSelf ? "active:bg-slate-50" : ""} ${user.active === false ? "opacity-60" : ""}`}
            onClick={() => !isSelf && onEdit(user)}
          >
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{[user.name, user.lastname].filter(Boolean).join(" ") || user.name}</p>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
              <p className="text-xs text-slate-400 truncate">@{user.username || "—"}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <RoleBadge role={user.role} t={t} />
                <span className="badge bg-slate-100 text-slate-600">
                  <Building2 size={12} /> {getBuildingName(user.building_id)}
                </span>
                {user.active === false && (
                  <span className="badge bg-slate-100 text-slate-500">{t.users.statusInactive}</span>
                )}
              </div>
            </div>
            {!isSelf && (
              <button
                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors shrink-0"
                onClick={(e) => { e.stopPropagation(); onEdit(user) }}
              >
                <Pencil size={16} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
);

function UserManagement() {
  const { getTranslation, users, fetchUsers, createUser, enableFetchUsersQuery, isLoading, currentUser, buildings, fetchBuildings, getBuildingName, usersRoleFilter, setUsersRoleFilter } = useStore()
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const t = getTranslation()
  const isSupervisor = currentUser?.role === "supervisor"
  const ownBuildingName = getBuildingName(currentUser?.building_id)

  const roleTabs = useMemo(
    () =>
      (isSupervisor
        ? (["all", "supervisor", "staff"] as const)
        : (["all", "admin", "supervisor", "staff"] as const)
      ).map((value) => ({ value, label: t.users.roles[value] })),
    [isSupervisor, t],
  )

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

  const filteredUsers = useMemo(
    () =>
      users
        .filter((user) => usersRoleFilter === "all" || user.role === usersRoleFilter)
        .filter(
          (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.lastname ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.username ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.building?.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    [users, searchTerm, usersRoleFilter],
  )

  const handleCreateUser = useCallback(
    async (formData: any) => {
      await createUser(formData)
    },
    [createUser],
  )

  const { isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    enabled: enableFetchUsersQuery,
  })

  const handleModalClose = () => {
    setEditingUser(null)
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t.users.title}</h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">{t.users.subtitle}</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary btn-md text-sm w-full sm:w-auto"
        >
          {showCreateForm ? <X size={18} /> : <Plus size={18} />}
          {showCreateForm ? t.users.cancelCreate : t.users.createNew}
        </button>
      </div>

      {isLoading ? (
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-6" />
      ) : (
        showCreateForm && (
          <CreateUserForm
            onSubmit={handleCreateUser}
            onCancel={() => setShowCreateForm(false)}
            t={t}
            buildings={buildings}
            isSupervisor={isSupervisor}
            ownBuildingName={ownBuildingName}
          />
        )
      )}

      <div className="card">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-800">{t.users.list}</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={t.users.search}
                className="input input-icon text-sm"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-1 mt-4 overflow-x-auto -mx-1 px-1">
            {roleTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setUsersRoleFilter(tab.value)}
                className={`shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  usersRoleFilter === tab.value
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="hidden md:block overflow-x-auto">
            <UsersTable users={filteredUsers} onEdit={setEditingUser} t={t} getBuildingName={getBuildingName} currentUser={currentUser} />
          </div>
          <div className="md:hidden">
            <UsersCardList users={filteredUsers} onEdit={setEditingUser} t={t} getBuildingName={getBuildingName} currentUser={currentUser} />
          </div>
          {filteredUsers.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">No users found.</p>
          )}
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={{
            ...editingUser,
            building: getBuildingName(editingUser.building_id),
            id: editingUser.id,
          }}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

export default UserManagement;

export { UserManagement }
