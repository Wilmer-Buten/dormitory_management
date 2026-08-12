import React, { useEffect, useState } from "react";
import { X, User as UserIcon, Mail, Building2, Shield, UserX, UserCheck } from "lucide-react";
import { useStore } from "../store/useStore";
import { User } from "../types";
import ModalComponent from "./ModalComponent";

interface EditUserModalProps {
  user: User;
  onClose: () => void;
}

export function EditUserModal({ user, onClose }: EditUserModalProps) {
  const { getTranslation, updateUser, setUserActiveStatus, buildings, fetchBuildings, currentUser } = useStore();
  const t = getTranslation();
  const isSupervisorViewer = currentUser?.role === "supervisor";
  const isActive = user.active !== false;

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);
  const [formData, setFormData] = useState({
    name: user.name,
    lastname: user.lastname ?? "",
    email: user.email,
    username: user.username ?? "",
    role: user.role,
    building: user.building,
    building_id: user.building_id,
  });
  const [userDeactivation, setUserDeactivation] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const trimmedUsername = formData.username.trim() ? formData.username.trim() : null;
      const trimmedLastname = formData.lastname.trim() ? formData.lastname.trim() : null;
      if (
        user.name !== formData.name.trim() ||
        (user.lastname ?? null) !== trimmedLastname ||
        user.email !== formData.email.trim() ||
        (user.username ?? null) !== trimmedUsername ||
        user.role !== formData.role ||
        user.building_id !== formData.building_id
      ) {
        onClose();
        await updateUser(user.id, { ...formData, username: trimmedUsername, lastname: trimmedLastname });
      }else {
        onClose();
      }

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar usuario"
      );
      console.log(err);
    }
  };

  const handleDeactivate = async () => {
    onClose();
    setUserDeactivation(false);
    await setUserActiveStatus(user.id, false);
  };

  const handleActivate = async () => {
    await setUserActiveStatus(user.id, true);
    onClose();
  };

  return (
    <>
       {userDeactivation ? (
        <ModalComponent
          title={t.users.userDeactivationModal.title}
          description={t.users.userDeactivationModal.description + " " + user.name + "?"}
          handleConfirmButton={handleDeactivate}
          handleCancelButton={onClose}
          confirmButtonText={t.users.deactivate}
        />
      ):
    (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-popover max-w-md w-full p-6 relative animate-slide-up">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold text-lg shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t.users.editUser}</h2>
              <span className={`badge mt-0.5 ${isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                {isActive ? t.users.statusActive : t.users.statusInactive}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t.users.name}</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input input-icon"
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
                  value={formData.lastname}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lastname: e.target.value }))
                  }
                  className="input input-icon"
                />
              </div>
            </div>

            <div>
              <label className="label">{t.users.email}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="input input-icon"
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
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  className="input input-icon"
                />
              </div>
            </div>

            <div>
              <label className="label">{t.users.building}</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                {isSupervisorViewer ? (
                  <div className="input input-icon bg-slate-50 text-slate-500 cursor-not-allowed">
                    {buildings.find((b) => b.id === formData.building_id)?.name ?? ""}
                  </div>
                ) : (
                  <select
                    value={formData.building_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        building_id: Number(e.target.value),
                      }))
                    }
                    className="input input-icon"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name.charAt(0).toUpperCase() + b.name.slice(1)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="label">{t.users.role}</label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                {isSupervisorViewer ? (
                  <div className="input input-icon bg-slate-50 text-slate-500 cursor-not-allowed">{t.users.roles.staff}</div>
                ) : (
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        role: e.target.value as "admin" | "supervisor" | "staff",
                      }))
                    }
                    className="input input-icon"
                  >
                    <option value="admin">{t.users.roles.admin}</option>
                    <option value="supervisor">{t.users.roles.supervisor}</option>
                    <option value="staff">{t.users.roles.staff}</option>
                  </select>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 rounded-xl py-2 px-3">{error}</div>
            )}

            <div className="flex justify-between items-center gap-3 pt-2">
              {isActive ? (
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={() => setUserDeactivation(true)}
                >
                  <UserX size={14} />
                  {t.users.deactivate}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={handleActivate}
                >
                  <UserCheck size={14} />
                  {t.users.activate}
                </button>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary btn-md text-sm"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-md text-sm"
                  onClick={handleSubmit}
                >
                  {t.common.save}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
  
}
