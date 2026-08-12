import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Clock, Pencil, Trash2, Eye, DoorOpen, Plus, Sparkles } from "lucide-react";
import { Room } from "../types";
import { useStore } from "../store/useStore";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import ModalComponent from "./ModalComponent";
import Skeleton from "./Skeleton";
import { LoadingMorph } from "./LoadingMorph";

interface RoomCardProps {
  room: Room;
  isLoading: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, isLoading }) => {
  const { getTranslation, setIsLoading, addStudent, updateStudentPresence, deleteStudent, updateRoomCleanliness } = useStore();
  const t = getTranslation();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentUid, setNewStudentUid] = useState("");
  const [studentToDeleteId, setStudentToDeleteId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingClean, setIsUpdatingClean] = useState(false);

  const showCleanCheck = room.isCleanCheckDay === true || room.isCleanCheckDay === 1;
  const roomIsClean = room.isClean === true || room.isClean === 1;
  const roomIsDirty = room.isClean === false || room.isClean === 0;

  const mutation = useMutation({
    mutationFn: ({
      roomId,
      studentId,
      isPresent,
      inRoom
    }: {
      roomId: string;
      studentId: string;
      isPresent: boolean | null;
      inRoom: boolean | null;
    }) => {
      setIsUpdating(true);
      return updateStudentPresence(roomId, studentId, isPresent, inRoom);
    },
    onSuccess: () => {
      setTimeout(() => {
        setIsUpdating(false);
        setIsLoading(false);
      }, 500); // Add a small delay before hiding the loading animation
    },
    onError: (error) => {
      console.error("Error al actualizar estado:", error);
      setIsUpdating(false);
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: ({ roomId, studentName, studentUid }: { roomId: string; studentName: string; studentUid?: string }) => addStudent(roomId, studentName, studentUid),
    onSuccess: () => {
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Error al actualizar estado:", error);
    },
  });

  const handleAddStudent = () => {
    const hasNullStudent = room.students.some(student => student.id === null);
    if ((room.students.length === 2 && !hasNullStudent) || (room.students.length > 2 && hasNullStudent)) {
      toast.error(t.roomIsFull);
      return;
    }
    setIsAddingStudent(true);
  };

  const handleEdit = () => {
    setIsFlipped(true);
  };

  const deleteStudentMutation = useMutation({
    mutationFn: ({ roomId, studentId }: { roomId: string; studentId: string }) => deleteStudent(studentId, roomId),
    onSuccess: () => {
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Error deleting student:", error);
    },
  });

  const handleSaveNewStudent = () => {
    if (newStudentName.trim()) {
      setIsAddingStudent(false);
      const studentUid = newStudentUid.trim() || undefined;
      setNewStudentName("");
      setNewStudentUid("");
      addStudentMutation.mutate({ roomId: room.id, studentName: newStudentName, studentUid });
    }
  };

  const handleCancelAddStudent = () => {
    setIsAddingStudent(false);
    setNewStudentName("");
    setNewStudentUid("");
  };

  const flipBack = () => {
    setIsFlipped(false);
    setIsAddingStudent(false);
    setNewStudentName("");
    setNewStudentUid("");
  };

  const handleDelete = async (studentId: string) => {
    setStudentToDeleteId(studentId);
  };

  const confirmDelete = () => {
    if (studentToDeleteId) {
      deleteStudentMutation.mutate({ roomId: room.id, studentId: studentToDeleteId });
      setStudentToDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setStudentToDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((index) => (
            <div key={index} className="flex flex-col space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <Skeleton className="h-5 w-1/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ perspective: "1000px" }}>
      <AnimatePresence>
        {isUpdating && <LoadingMorph />}
      </AnimatePresence>
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: "preserve-3d" }}
        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card hover:shadow-card-hover transition-shadow"
      >
        {/* Front side */}
        <div
          style={{
            backfaceVisibility: "hidden",
            position: isFlipped ? "absolute" : "relative",
            width: "100%",
            height: "100%",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {!isFlipped && (
            <>
              <div className="flex justify-between items-start gap-2 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <DoorOpen size={17} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate leading-tight">
                      {t.room} {room.suiteNumber} {room.letter}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">{room.building}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEdit}
                  className="p-2.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors shrink-0"
                  aria-label="Edit room"
                >
                  <Pencil size={16} />
                </motion.button>
              </div>
              <div className="space-y-3">
                {(!room.students[0] || (room.students[0].id === null && room.students.length === 1)) ? (
                  <div className="text-sm text-slate-400 py-3 text-center">{t.noStudents}</div>
                ) : (
                  room.students.map((student) => {
                    if(student.id !== null) return (
                      <div key={student.id} className="flex flex-col space-y-1.5">
                        <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl">
                          <div className="flex flex-col min-w-0">
                            <span className="text-slate-700 text-sm font-medium truncate">{student.name}</span>
                            {student.studentUid && (
                              <span className="text-xs text-slate-400 truncate">{t.studentId}: {student.studentUid}</span>
                            )}
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              title={t.present}
                              onClick={() =>
                                {
                                  ((student.isPresent === false || student.isPresent === 0 || student.isPresent === null) || (student.inRoom === true || student.inRoom === 1)) && mutation.mutate({
                                    roomId: room.id,
                                    studentId: student.id,
                                    isPresent: true,
                                    inRoom: false
                                  })
                                }
                              }
                              className={`p-2.5 rounded-lg transition-colors ${
                                (student.isPresent === true ||
                                  student.isPresent === 1) &&
                                (student.inRoom === false ||
                                  student.inRoom === 0 ||
                                  student.inRoom === null)
                                  ? "bg-green-500 text-white"
                                  : "bg-white text-slate-400 hover:bg-green-50 hover:text-green-600"
                              }`}
                            >
                              <Check size={18} />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              title="In room"
                              onClick={() =>
                              {
                                (student.inRoom === false || student.inRoom === 0 || student.inRoom === null) && mutation.mutate({
                                  roomId: room.id,
                                  studentId: student.id,
                                  isPresent: false,
                                  inRoom: true
                                })
                              }
                              }
                              className={`p-2.5 rounded-lg transition-colors ${
                                student.inRoom === true || student.inRoom === 1
                                  ? "bg-yellow-500 text-white"
                                  : "bg-white text-slate-400 hover:bg-yellow-50 hover:text-yellow-600"
                              }`}
                            >
                              <Eye size={18} />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              title={t.absent}
                              onClick={() =>
                              {
                                ((student.isPresent === true || student.isPresent === 1 || student.isPresent === null) || (student.inRoom === true || student.inRoom === 1)) && mutation.mutate({
                                  roomId: room.id,
                                  studentId: student.id,
                                  isPresent: false,
                                  inRoom: false
                                })
                              }
                              }
                              className={`p-2.5 rounded-lg transition-colors ${
                                (student.isPresent === false ||
                                  student.isPresent === 0) &&
                                (student.inRoom === false ||
                                  student.inRoom === 0 ||
                                  student.inRoom === null)
                                  ? "bg-red-500 text-white"
                                  : "bg-white text-slate-400 hover:bg-red-50 hover:text-red-600"
                              }`}
                            >
                              <X size={18} />
                            </motion.button>
                          </div>
                        </div>
                        {student.lastCheckedBy && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 px-1">
                            <Clock size={12} />
                            <span className="truncate">
                              {t.verifiedBy} {student.lastCheckedBy} · {student.lastCheckedAt}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}

                {showCleanCheck && (
                  <div className="pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Sparkles size={14} className="text-teal-600 shrink-0" />
                        <span className="text-xs font-medium text-teal-800 truncate">
                          {t.attendance.cleanCheckDayBanner}
                        </span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          disabled={isUpdatingClean}
                          title={t.attendance.clean}
                          onClick={async () => {
                            if (roomIsClean) return;
                            setIsUpdatingClean(true);
                            try {
                              await updateRoomCleanliness(room.id, true);
                            } finally {
                              setIsUpdatingClean(false);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            roomIsClean
                              ? "bg-teal-600 text-white"
                              : "bg-white text-slate-500 hover:bg-teal-100 hover:text-teal-700"
                          }`}
                        >
                          {t.attendance.clean}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          disabled={isUpdatingClean}
                          title={t.attendance.notClean}
                          onClick={async () => {
                            if (roomIsDirty) return;
                            setIsUpdatingClean(true);
                            try {
                              await updateRoomCleanliness(room.id, false);
                            } finally {
                              setIsUpdatingClean(false);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            roomIsDirty
                              ? "bg-orange-500 text-white"
                              : "bg-white text-slate-500 hover:bg-orange-50 hover:text-orange-600"
                          }`}
                        >
                          {t.attendance.notClean}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Back side */}
        <div
          style={{
            backfaceVisibility: "hidden",
            position: isFlipped ? "relative" : "absolute",
            width: "100%",
            height: "100%",
            transform: "rotateY(180deg)",
          }}
        >
          {isFlipped && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800">
                  Edit Room {room.suiteNumber} {room.letter}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={flipBack}
                  className="p-2.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </div>
              <div className="space-y-2">
                {(room.students[0].id === null && room.students.length === 1) ? (
                  <div className="text-sm text-slate-400 py-2">{t.noStudents}</div>
                ) : (
                  room.students.map((student) => {
                    if(student.id !== null) return (
                      <div key={student.id} className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl">
                        <span className="text-slate-700 text-sm font-medium truncate">{student.name}</span>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(student.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    )
                  })
                )}
              </div>
              {isAddingStudent ? (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Student name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveNewStudent()}
                    className="input mb-2"
                  />
                  <input
                    type="text"
                    placeholder={t.studentId + " (optional)"}
                    value={newStudentUid}
                    onChange={(e) => setNewStudentUid(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveNewStudent()}
                    className="input mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={handleCancelAddStudent} className="btn-secondary btn-sm">
                      {t.common.cancel}
                    </button>
                    <button onClick={handleSaveNewStudent} className="btn-primary btn-sm">
                      {t.common.save}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex justify-center">
                  <button onClick={handleAddStudent} className="btn-secondary btn-sm">
                    <Plus size={16} /> Add Student
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        {studentToDeleteId && (
          <AnimatePresence>
            <ModalComponent
              title={t.students.delete}
              description={t.students.deleteConfirm}
              handleConfirmButton={confirmDelete}
              handleCancelButton={cancelDelete}
              confirmButtonText={t.students.deleteConfirmButton}
            />
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};
