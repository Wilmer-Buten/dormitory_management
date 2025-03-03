import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Clock, Edit, Trash2, Eye } from "lucide-react";
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
  const { currentUser, getTranslation, setIsLoading, addStudent, updateStudentPresence, deleteStudent } = useStore();
  const t = getTranslation();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [studentToDeleteId, setStudentToDeleteId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
    mutationFn: ({ roomId, studentName }: { roomId: string; studentName: string }) => addStudent(roomId, studentName),
    onSuccess: () => {
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Error al actualizar estado:", error);
    },
  });

  const handleAddStudent = () => {
    if (room.students.length > 1) {
      toast.error("Room is full");
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
      console.log("Nuevo estudiante:", newStudentName);
      setIsAddingStudent(false);
      setNewStudentName("");
      addStudentMutation.mutate({ roomId: room.id, studentName: newStudentName });
    }
  };

  const handleCancelAddStudent = () => {
    setIsAddingStudent(false);
    setNewStudentName("");
  };

  const flipBack = () => {
    setIsFlipped(false);
    setIsAddingStudent(false);
    setNewStudentName("");
  };

  const handleDelete = async (studentId: string) => {
    console.log("Deleting student:", studentId);
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
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((index) => (
            <div key={index} className="flex flex-col space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <Skeleton className="h-5 w-1/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center gap-2 px-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-2/3" />
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
        className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Room {room.suiteNumber} {room.letter} - {room.building}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEdit}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Edit size={18} />
                </motion.button>
              </div>
              <div className="space-y-4">
                {(room.students[0].id === null && room.students.length === 1) ? (
                  <div>{t.noStudents}</div>
                ) : (
                  room.students.map((student) => {
                    if(student.id !== null) return (
                      <div key={student.id} className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <span className="text-gray-700">{student.name}</span>
                          <div className="flex gap-2">
                            <motion.button
                              whileTap={{ scale: 0.95 }}
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
                              className={`p-2 rounded-lg ${
                                (student.isPresent === true ||
                                  student.isPresent === 1) &&
                                (student.inRoom === false ||
                                  student.inRoom === 0 ||
                                  student.inRoom === null)
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-100 text-gray-500 hover:bg-green-100"
                              }`}
                            >
                              <Check size={20} />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                              {
                                console.log(student.inRoom);
                                (student.inRoom === false || student.inRoom === 0 || student.inRoom === null) && mutation.mutate({
                                  roomId: room.id,
                                  studentId: student.id,
                                  isPresent: false,
                                  inRoom: true
                                })
                              }
                              }
                              className={`p-2 rounded-lg ${
                                student.inRoom === true || student.inRoom === 1
                                  ? "bg-yellow-500 text-white"
                                  : "bg-gray-100 text-gray-500 hover:bg-red-100"
                              }`}
                            >
                              <Eye size={20} />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
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
                              className={`p-2 rounded-lg ${
                                (student.isPresent === false ||
                                  student.isPresent === 0) &&
                                (student.inRoom === false ||
                                  student.inRoom === 0 ||
                                  student.inRoom === null)
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-100 text-gray-500 hover:bg-red-100"
                              }`}
                            >
                              <X size={20} />
                            </motion.button>
                          </div>
                        </div>
                        {student.lastCheckedBy && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 px-3">
                            <Clock size={14} />
                            <span>
                              {t.verifiedBy} {currentUser?.name} ||{" "}
                              {student.lastCheckedAt}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })
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
                <h3 className="text-xl font-semibold text-gray-800">
                  Edit Room {room.suiteNumber} {room.letter}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={flipBack}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </motion.button>
              </div>
              {(room.students[0].id === null && room.students.length === 1) ? (
                <div>{t.noStudents}</div>
              ) : (
                room.students.map((student) => {
                  if(student.id !== null) return (
                    <div key={student.id} className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-700">{student.name}</span>
                        <div className="flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(student.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-500 hover:bg-red-200"
                          >
                            <Trash2 size={20} />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              {isAddingStudent ? (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow-lg">
                  <input
                    type="text"
                    placeholder="Nombre del estudiante"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="p-2 w-full border border-gray-300 rounded-lg mb-2"
                  />
                  <div className="flex justify-end space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveNewStudent}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Guardar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCancelAddStudent}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancelar
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddStudent}
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    Add New Student
                  </motion.button>
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