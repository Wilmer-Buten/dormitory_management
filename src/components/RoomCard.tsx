import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Clock, DoorOpen, Sparkles, Eye } from "lucide-react";
import { Room, formatRoomLabel } from "../types";
import { useStore } from "../store/useStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Skeleton from "./Skeleton";
import { LoadingMorph } from "./LoadingMorph";

interface RoomCardProps {
  room: Room;
  isLoading: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, isLoading }) => {
  const { getTranslation, setIsLoading, updateStudentPresence, updateRoomCleanliness } = useStore();
  const queryClient = useQueryClient();
  const t = getTranslation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingClean, setIsUpdatingClean] = useState(false);

  const showCleanCheck = room.isCleanCheckDay === true || room.isCleanCheckDay === 1;
  const roomIsClean = room.isClean === true || room.isClean === 1;
  const roomIsDirty = room.isClean === false || room.isClean === 0;
  const hasStudents = room.students.some((s) => s.id != null);
  const isEmptyRoom = !hasStudents;

  const mutation = useMutation({
    mutationFn: ({
      roomId,
      studentId,
      isPresent,
      inRoom,
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
      queryClient.invalidateQueries({ queryKey: ["attendance-report"] });
      queryClient.invalidateQueries({ queryKey: ["clean-check-report"] });
      queryClient.invalidateQueries({ queryKey: ["students-list"] });
      queryClient.invalidateQueries({ queryKey: ["student-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["overview-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setTimeout(() => {
        setIsUpdating(false);
        setIsLoading(false);
      }, 500);
    },
    onError: (error) => {
      console.error("Error al actualizar estado:", error);
      setIsUpdating(false);
    },
  });

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
    <div className="relative">
      <AnimatePresence>
        {isUpdating && <LoadingMorph />}
      </AnimatePresence>
      <div
        className={`rounded-2xl p-5 border shadow-card hover:shadow-card-hover transition-shadow ${
          isEmptyRoom
            ? "bg-slate-300 border-slate-400/60"
            : "bg-white border-slate-100"
        }`}
      >
        <div className="flex justify-between items-start gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isEmptyRoom ? "bg-slate-500/25 text-slate-700" : "bg-brand-50 text-brand-600"
              }`}
            >
              <DoorOpen size={17} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 truncate leading-tight">
                {t.room} {formatRoomLabel(room)}
              </h3>
              <p className={`text-xs truncate ${isEmptyRoom ? "text-slate-600" : "text-slate-400"}`}>
                {room.building}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {isEmptyRoom ? (
            <div className="text-sm text-slate-700 font-medium py-3 text-center rounded-xl bg-slate-400/30 border border-slate-500/20">
              {t.noStudents}
            </div>
          ) : (
            room.students.map((student) => {
              if (student.id === null) return null;
              return (
                <div key={student.id} className="flex flex-col space-y-1.5">
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl">
                    <div className="flex flex-col min-w-0">
                      <span className="text-slate-700 text-sm font-medium truncate">
                        {[student.name, student.lastname].filter(Boolean).join(" ")}
                      </span>
                      {student.studentUid && (
                        <span className="text-xs text-slate-400 truncate">
                          {t.studentId}: {student.studentUid}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        title={t.present}
                        onClick={() => {
                          ((student.isPresent === false || student.isPresent === 0 || student.isPresent === null) ||
                            student.inRoom === true ||
                            student.inRoom === 1) &&
                            mutation.mutate({
                              roomId: room.id,
                              studentId: student.id,
                              isPresent: true,
                              inRoom: false,
                            });
                        }}
                        className={`p-2.5 rounded-lg transition-colors ${
                          (student.isPresent === true || student.isPresent === 1) &&
                          (student.inRoom === false || student.inRoom === 0 || student.inRoom === null)
                            ? "bg-green-500 text-white"
                            : "bg-white text-slate-400 hover:bg-green-50 hover:text-green-600"
                        }`}
                      >
                        <Check size={18} />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        title={t.inRoom}
                        onClick={() => {
                          (student.inRoom === false || student.inRoom === 0 || student.inRoom === null) &&
                            mutation.mutate({
                              roomId: room.id,
                              studentId: student.id,
                              isPresent: false,
                              inRoom: true,
                            });
                        }}
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
                        onClick={() => {
                          ((student.isPresent === true || student.isPresent === 1 || student.isPresent === null) ||
                            student.inRoom === true ||
                            student.inRoom === 1) &&
                            mutation.mutate({
                              roomId: room.id,
                              studentId: student.id,
                              isPresent: false,
                              inRoom: false,
                            });
                        }}
                        className={`p-2.5 rounded-lg transition-colors ${
                          (student.isPresent === false || student.isPresent === 0) &&
                          (student.inRoom === false || student.inRoom === 0 || student.inRoom === null)
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
              );
            })
          )}

          {showCleanCheck && (
            <div className={`pt-1 border-t ${isEmptyRoom ? "border-slate-400/40" : "border-slate-100"}`}>
              <div
                className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border ${
                  isEmptyRoom
                    ? "bg-slate-400/35 border-slate-500/30"
                    : "bg-teal-50/70 border-teal-100"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Sparkles
                    size={14}
                    className={`shrink-0 ${isEmptyRoom ? "text-slate-700" : "text-teal-600"}`}
                  />
                  <span
                    className={`text-xs font-medium truncate ${
                      isEmptyRoom ? "text-slate-800" : "text-teal-800"
                    }`}
                  >
                    {t.attendance.cleanCheckDayBanner}
                  </span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isEmptyRoom || isUpdatingClean || roomIsClean}
                    title={
                      isEmptyRoom
                        ? "No students in this room"
                        : t.attendance.clean
                    }
                    onClick={async () => {
                      if (isEmptyRoom || roomIsClean) return;
                      setIsUpdatingClean(true);
                      try {
                        await updateRoomCleanliness(room.id, true);
                        queryClient.invalidateQueries({ queryKey: ["clean-check-report"] });
                        queryClient.invalidateQueries({ queryKey: ["overview-rooms"] });
                      } finally {
                        setIsUpdatingClean(false);
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      isEmptyRoom
                        ? "bg-slate-200 text-slate-500"
                        : roomIsClean
                          ? "bg-teal-600 text-white"
                          : "bg-white text-slate-500 hover:bg-teal-100 hover:text-teal-700"
                    }`}
                  >
                    {t.attendance.clean}
                  </button>
                  <button
                    type="button"
                    disabled={isEmptyRoom || isUpdatingClean || roomIsDirty}
                    title={
                      isEmptyRoom
                        ? "No students in this room"
                        : t.attendance.notClean
                    }
                    onClick={async () => {
                      if (isEmptyRoom || roomIsDirty) return;
                      setIsUpdatingClean(true);
                      try {
                        await updateRoomCleanliness(room.id, false);
                        queryClient.invalidateQueries({ queryKey: ["clean-check-report"] });
                        queryClient.invalidateQueries({ queryKey: ["overview-rooms"] });
                      } finally {
                        setIsUpdatingClean(false);
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      isEmptyRoom
                        ? "bg-slate-200 text-slate-500"
                        : roomIsDirty
                          ? "bg-orange-500 text-white"
                          : "bg-white text-slate-500 hover:bg-orange-50 hover:text-orange-600"
                    }`}
                  >
                    {t.attendance.notClean}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
