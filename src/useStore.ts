import { create } from 'zustand';
import { Room, User, Suite, Language } from '../types';
import { translations } from '../i18n/translations';
import toast from 'react-hot-toast';
import React from 'react';

interface Store {
  rooms: Room[];
  users: User[];
  currentUser: User | null;
  searchQuery: string;
  selectedDate: string;
  viewMode: 'rooms' | 'suites';
  selectedSuite: string | null;
  selectedBuilding: string;
  language: Language;
  isLoading: boolean;
  currentSection: 'dashboard' | 'users' | 'settings';
  enableFetchRoomsQuery: boolean;
  enableFetchUsersQuery: boolean;
  err: string | null;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrentSection: (section: 'dashboard' | 'users' | 'settings') => void;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: string) => void;
  setCurrentUser: (user: User) => void;
  setViewMode: (mode: 'rooms' | 'suites') => void;
  setSelectedSuite: (suiteId: string | null) => void;
  setSelectedBuilding: (building: string) => void;
  setLanguage: (lang: Language) => void;
  updateStudentPresence: (roomId: string, studentId: string, isPresent: boolean | 1 | 0) => Promise<void>;
  resetDailyChecks: () => Promise<void>;
  fetchRooms: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  createUser: (user: User) => Promise<void>;
  setEnableFetchRoomsQuery: (enable: boolean) => void;
  setEnableFetchUsersQuery: (enable: boolean) => void;
  setRooms: (rooms: Room[]) => void;
  setError: (error: string) => void;
  fetchCurrentUser: () => Promise<void>;
  setIsLoading: (isLoading: boolean) => void; 
  getSuites: () => Suite[];
  getStats: () => {
    totalRooms: number;
    presentCount: number;
    absentCount: number;
    pendingCount: number;
  };
  getTranslation: () => typeof translations.en;
}

const API_URL = 'http://localhost:4000';

export const useStore = create<Store>((set, get) => ({
  rooms: [],
  users: [],
  currentUser: null,
  searchQuery: '',
  selectedDate: new Date().toISOString().split('T')[0],
  viewMode: 'rooms',
  selectedSuite: null,
  selectedBuilding: 'all',
  language: 'en',
  isLoading: true,
  err: null,
  enableFetchRoomsQuery: true,
  enableFetchUsersQuery: true,
  theme: 'light',
  currentSection: 'dashboard',
  setEnableFetchRoomsQuery: (enable) => set({ enableFetchRoomsQuery: enable }),
  setEnableFetchUsersQuery: (enable) => set({ enableFetchUsersQuery: enable }),
  setError: (err) => set({ err }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setViewMode: (mode) => set({ viewMode: mode, selectedSuite: null }),
  setSelectedSuite: (suiteId) => set({ selectedSuite: suiteId }),
  setSelectedBuilding: (building) => set({ selectedBuilding: building }),
  setLanguage: (lang) => set({ language: lang }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setTheme: (theme) => set({ theme: theme }),
  setCurrentSection: (section) => set({ currentSection: section }),
  fetchRooms: async () => {
    set({ isLoading: true, err: null });
    try {
      console.log(get().selectedDate);
      let dateQueryParam = get().selectedDate ? `?date=${get().selectedDate}` : '';
      const response = await fetch(`${API_URL}/rooms${dateQueryParam}`);
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
     return data;
    } catch (error) {
      set({ err: (error as Error).message, isLoading: false });
      toast.error('Error loading rooms');
    }
  },

  fetchUsers: async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      set({ users: [...get().users, ...data] });
      return data;
    } catch (error) {
      toast.error('Error loading users');
    }
  },

  createUser: async (user) => {
    console.log(user)
    try {
      const response = await fetch(`${API_URL}/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error('Error creating user: ' + data.message);
        throw new Error('Failed to create user');
      }

      toast.success('User created successfully');
      set({ users: [...get().users, user] });
      return data;
    } catch (error) {
      }
  },

  setRooms: (rooms) => {
    console.log(rooms)
    set({ rooms: rooms, isLoading: false });
  },

  fetchCurrentUser: async () => {
    try {
      const response = await fetch(`${API_URL}/current_user`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
    } catch (error) {
      toast.error('Error loading user data');
    }
  },
  
  updateStudentPresence: async (roomId, studentId, isPresent) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    try {
      const response = await fetch(`${API_URL}/rooms/${roomId}/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPresent,
          lastCheckedBy: currentUser.username,
          lastCheckedAt: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to update student presence');

      set((state) => ({
        rooms: state.rooms.map((room) => {
          if (room.id === roomId) {
            return {
              ...room,
              students: room.students.map((student) => {
                if (student.id === studentId) {
                  return { 
                    ...student, 
                    isPresent,
                    lastCheckedBy: currentUser.username,
                    lastCheckedAt: new Date().toISOString()
                  };
                }
                return student;
              }),
            };
          }
          return room;
        }),
      }));

      toast.success(isPresent ? 'Marked as present' : 'Marked as absent');
    } catch (error) {
      toast.error('Failed to update status');
    }
  },

  resetDailyChecks: async () => {
    try {
      const response = await fetch(`${API_URL}/reset`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to reset checks');

      set((state) => ({
        rooms: state.rooms.map((room) => ({
          ...room,
          students: room.students.map((student) => ({
            ...student,
            isPresent: null,
            lastCheckedBy: undefined,
            lastCheckedAt: undefined
          }))
        }))
      }));

      toast.success('Daily checks reset successfully');
    } catch (error) {
      toast.error('Failed to reset daily checks');
    }
  },

  getSuites: () => {
    const rooms = get().rooms;
    const selectedBuilding = get().selectedBuilding;
    const filteredRooms = selectedBuilding === 'all' 
      ? rooms 
      : rooms.filter(room => room.building === selectedBuilding);
    const suiteMap = new Map<string, Room[]>();
    
    filteredRooms.forEach(room => {
      const currentRooms = suiteMap.get(room.suiteId) || [];
      suiteMap.set(room.suiteId, [...currentRooms, room]);
    });

    return Array.from(suiteMap.entries()).map(([id, rooms]) => ({
      id,
      number: id,
      building: rooms[0].building,
      rooms: rooms.sort((a, b) => a.letter.localeCompare(b.letter))
    }));
  },
  
  getStats: () => {
    const rooms = get().rooms;
    if(rooms.length === 0){
      return {
        totalRooms: 0,
        presentCount: 0,
        absentCount: 0,
        pendingCount: 0
      };
    }
    const selectedBuilding = get().selectedBuilding;
    const filteredRooms = selectedBuilding === 'all' 
    ? rooms 
      : rooms.filter(room => room.building === selectedBuilding);
    console.log(filteredRooms)
    let presentCount = 0;
    let absentCount = 0;
    let pendingCount = 0;
    
    filteredRooms.forEach((room) => {
      room.students.forEach((student) => {
        if (student.isPresent === true || student.isPresent === 1) presentCount++;
        else if (student.isPresent === false || student.isPresent === 0) absentCount++;
        else pendingCount++;
      });
    });
    
    return {
      totalRooms: filteredRooms.length,
      presentCount,
      absentCount,
      pendingCount,
    };
  },

  getTranslation: () => translations[get().language],
}));