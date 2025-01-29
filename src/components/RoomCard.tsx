import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock } from 'lucide-react';
import { Room } from '../types';
import { useStore } from '../store/useStore';
import {useMutation} from '@tanstack/react-query';
interface RoomCardProps {
  room: Room;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const updateStudentPresence = useStore((state) => state.updateStudentPresence);
  const setIsLoading = useStore((state) => state.setIsLoading);
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

    const mutation = useMutation({
          mutationFn: ({ roomId, studentId, isPresent }: { roomId: string; studentId: string; isPresent: boolean }) =>
            updateStudentPresence(roomId, studentId, isPresent),
          onSuccess: () => {
          setIsLoading(false);
          },
          onError: (error) => {
            console.error('Error al crear usuario:', error);
          },
        });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Habitación {room.number} {room.letter}
      </h3>
      <div className="space-y-4">
        {room.students.map((student) => (
          <div
            key={student.id}
            className="flex flex-col space-y-2"
          >
            <div
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              <span className="text-gray-700">{student.name}</span>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => mutation.mutate({ roomId: room.id, studentId: student.id, isPresent: true })}
                  className={`p-2 rounded-lg ${
                    student.isPresent === true || student.isPresent === 1
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-green-100'
                  }`}
                >
                  <Check size={20} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => mutation.mutate({ roomId: room.id, studentId: student.id, isPresent: false })}
                  className={`p-2 rounded-lg ${
                    student.isPresent === false || student.isPresent === 0
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-red-100'
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
                  Verificado por {student.lastCheckedBy} a las {formatDate(student.lastCheckedAt)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};