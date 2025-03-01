import { create } from 'zustand';
import { Room, User, Suite, Language, PreviewData } from '../types';
import { translations } from '../i18n/translations';
import toast from 'react-hot-toast';

const getBuilding = (building_id : Number) => {
  switch (building_id) {
    case 1:
      return 'edwards';
    case 2:
      return 'holland';
    case 3:
      return 'peterson';
    case 4:
      return 'wade';
    default:
      return 'all';
  }
}

interface Store {
  rooms: Room[];
  users: User[];
  currentUser: User | null;
  currentPage: number
  totalPages: number
  searchQuery: string;
  selectedDate: string;
  viewMode: 'rooms' | 'suites';
  selectedSuite: string | null;
  selectedBuilding: string;
  language: Language;
  isLoading: boolean;
  accessToken: string;
  isAuthenticated: boolean;
  currentSection: 'dashboard' | 'users' | 'settings' | 'import';
  enableFetchRoomsQuery: boolean;
  enableFetchUsersQuery: boolean;
  selectedStat: 'all' | 'present' | 'inRoom' | 'absent' | 'pending';
  err: string | null;
  theme: 'light' | 'dark';
  setSelectedStat: (stat: 'all' | 'present' | 'inRoom' | 'absent' | 'pending') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  onPageChange: (page: number) => void
  setCurrentSection: (section: 'dashboard' | 'users' | 'settings' | 'import') => void;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: string) => void;
  setCurrentUser: (user: User) => void;
  setViewMode: (mode: 'rooms' | 'suites') => void;
  setSelectedSuite: (suiteId: string | null) => void;
  setSelectedBuilding: (building: string) => void;
  setLanguage: (lang: Language) => void;
  updateStudentPresence: (roomId: string, studentId: string, isPresent: boolean | 1 | 0 | null, inRoom: boolean | null) => Promise<void>;
  resetDailyChecks: () => Promise<void>;
  fetchRooms: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  createUser: (user: User) => Promise<void>;
  setEnableFetchRoomsQuery: (enable: boolean) => void;
  setEnableFetchUsersQuery: (enable: boolean) => void;
  setRooms: (rooms: Room[]) => void;
  setError: (error: string) => void;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (userId: number | undefined, userData: Partial<User>) => Promise<void>;
  deleteUser: (userId: number | undefined) => Promise<void>;
  importStudents: (students: PreviewData, studentSelections?: Record<string, string>) => Promise<void>;
  setIsLoading: (isLoading: boolean) => void; 
  setIsAuthenticated: (status: boolean) => void;
  setAccessToken: (accessToken: string) => void;
  getSuites: () => Suite[];
  addStudent: (roomId: string, studentName: String) => Promise<void>;
  getStats: () => {
    totalRooms: number;
    presentCount: number;
    absentCount: number;
    pendingCount: number;
    inRoomCount: number;
  };
  getFilteredRooms: () => Room[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  deleteStudent: (studentId: string, roomId: string) => Promise<void>;
  getTranslation: () => typeof translations.en;
}

const API_URL = import.meta.env.VITE_API_URL;
const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
export const useStore = create<Store>((set, get) => ({
  rooms: [],
  users: [],
  currentPage: 1,
  totalPages: 9,
  currentUser: null,
  searchQuery: '',
  selectedDate: new Date().toISOString().split('T')[0],
  viewMode: 'rooms',
  selectedSuite: null,
  selectedBuilding: 'all',
  language: 'en',
  isLoading: isAuthenticated,
  err: null,
  enableFetchRoomsQuery: false,
  enableFetchUsersQuery: true,
  theme: 'light',
  currentSection: 'dashboard',
  isAuthenticated: isAuthenticated, 
  accessToken: '',
  selectedStat: 'all',
  onPageChange: (page) => set({ currentPage: page }),
  setSelectedStat: (stat) => set({ selectedStat: stat, currentPage: 1, viewMode: stat !== 'all' ? 'rooms' : get().viewMode }),
  setEnableFetchRoomsQuery: (enable) => set({ enableFetchRoomsQuery: enable }),
  setEnableFetchUsersQuery: (enable) => set({ enableFetchUsersQuery: enable }),
  setError: (err) => set({ err }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDate: (date) => {set({ selectedDate: date, selectedStat: 'all', searchQuery: '' })},
  setAccessToken: (accessToken) => set({ accessToken: accessToken }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setViewMode: (mode) => set({ viewMode: mode, selectedSuite: null, selectedStat: 'all', searchQuery: '' }),
  setSelectedSuite: (suiteId) => set({ selectedSuite: suiteId }),
  setLanguage: (lang) => set({ language: lang }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setTheme: (theme) => set({ theme: theme }),
  setCurrentSection: (section) => set({ currentSection: section }),
  setSelectedBuilding: (building) => {
    const currentUserBuildingId = get().currentUser?.building_id;
    if (currentUserBuildingId === null || currentUserBuildingId === 5) {
      set({ selectedBuilding: building, currentPage: 1, viewMode: 'rooms', selectedStat: 'all', searchQuery: '' })
    } else {
      toast.error(get().getTranslation().forbidden);
    }
  },  
  
  fetchRooms: async () => {
    try {
      let dateQueryParam = get().selectedDate ? `?building_id=${get().currentUser?.building_id}&date=${get().selectedDate}` : '';
      const response = await fetch(`${API_URL}/rooms${dateQueryParam}`);
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      set({selectedBuilding: getBuilding(get().currentUser?.building_id || 0)});
     return data;
    } catch (error) {
      set({ err: (error as Error).message, isLoading: false });
      toast.error('Error loading rooms');
    }
  },
  login: async (email: string, password: string) => {
    set({ isLoading: true, err: null });
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        set({ isLoading: false });
        throw new Error('Credenciales inválidas');
      }

      const data = await response.json();
      localStorage.setItem('isAuthenticated', JSON.stringify(true));
      set({
        currentUser: {
          id: data.user.id,
          username: data.user.username,
          name: data.user.name,
          role: data.user.role,
          building_id: data.user.building_id
        },
        isAuthenticated: true,
        accessToken: data.accessToken,
        isLoading: false
      });
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      // Hacer la solicitud de logout al backend
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include', // Para que envíe la cookie
      });
      
      if (response.ok) {
        // Limpiar el estado de autenticación
        set({
          currentUser: null,
          isAuthenticated: false,
          accessToken: '',
          viewMode: 'rooms',
          selectedSuite: null,
          enableFetchRoomsQuery: true,
          enableFetchUsersQuery: true,
          rooms: [],
          users: [],
          currentPage: 1
        });
        localStorage.removeItem('isAuthenticated');

      } else {
        toast.error('Error logging out');
      }
    } catch (error) {
      toast.error('Error logging out');
    }
    set({
      currentUser: null,
      isAuthenticated: false,
      currentSection: 'dashboard',
      accessToken: '',
      viewMode: 'rooms',
      selectedSuite: null,
      enableFetchRoomsQuery: true,
      rooms: [],
      users: [],
      currentPage: 1
    });
  },
  
  getFilteredRooms: () => {
    
    const { rooms, selectedBuilding, searchQuery, selectedStat, selectedSuite } = get();

    return rooms.filter((room) => {
      // Suite filter
      if (selectedSuite && room.suiteId !== selectedSuite) return false;
      
      // Building filter
      if (selectedBuilding !== 'all' && room.building !== selectedBuilding) return false;
      
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = room.building.toLowerCase().includes(searchLower) ||
          room.students.some((student) => student.name?.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      
      // Stats filter
      if (selectedStat !== 'all') {

        switch (selectedStat) {
          case 'present':
            return room.students.some(s => s.isPresent === true || s.isPresent === 1);
          case 'inRoom':
              return room.students.some(s => s.inRoom === true || s.inRoom === 1);
          case 'absent':
            return room.students.some(s => ((s.isPresent === false || s.isPresent === 0) && (s.inRoom === false || s.inRoom === 0)));
          case 'pending':
            return room.students.some(s => (s.isPresent === null && s.inRoom === null));
        }
      }
      
      return true;
    });
  },

  fetchUsers: async () => {
    
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    set({ users: [...get().users, ...data], enableFetchUsersQuery: false });
    return data; // Devuelve los datos correctamente
  },

  createUser: async (user) => {

    set({ isLoading: true});
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
        toast.error('Error creating user');
        throw new Error('Error creating user: ' + data.message);
      }
      set({ users: [...get().users, user], isLoading: false });
      toast.success('User created successfully');
      return data;
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.message);
      }
  },

  setRooms: (rooms) => {
    set({ rooms: rooms, isLoading: false });
  },

  fetchCurrentUser: async () => {
    try {
      const response = await fetch(`${API_URL}/current_user`);
      if (!response.ok) throw new Error('Failed to fetch user');
      
    } catch (error) {
      toast.error('Error loading user data');
    }
  },
  updateUser: async (userId: number | undefined, userData: Partial<User>) => {
    try {
      
      let user = {...userData, id: userId};
      set({ isLoading: true });
      const response = await fetch(`${API_URL}/users/edit/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user)
      });
      
      const updatedUser = await response.json();
      if (!response.ok) {
        toast.error(updatedUser.message);
        throw new Error('Error al actualizar usuario');
      }
      set({
        users: get().users.map((user) => {
          if (user.id === updatedUser.id) {
            return updatedUser;
          }
          return user;
        }),
        isLoading: false
      })
      toast.success('User updated successfully');
      return updatedUser;
    } catch (error) {
      set({ isLoading: false });
      toast.error('Error updating user');
      throw error;
    }
  },

  deleteUser: async (userId: number | undefined) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/users/delete/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${get().accessToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
        throw new Error('Failed to delete user');
      }

      set((state) => ({
        users: state.users.filter((user) => {
          if (user.id === userId) {
            return false;
          }
          return true;
        })
      }));
      set({ isLoading: false });
      toast.success('User deleted successfully');
    } catch (error) {
      set({ isLoading: false });
      toast.error('Failed to delete user');
    }
  },

  addStudent: async (roomId: string, studentName: String) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/students/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName,
          roomId,
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to add student');

      set((state) => ({
        rooms: state.rooms.map((room ) => {
          if (room.id === Number(roomId)) {
            return { ...room, students: [...room.students, data.student]};
          }
          return room;
        }),
      }));
      toast.success('Student added successfully');
    } catch (error) {
      toast.error('Failed to add student');
    }
  },

  updateStudentPresence: async (roomId, studentId, isPresent, inRoom) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_URL}/rooms/${roomId}/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPresent,
          lastCheckedBy: currentUser.name,
          lastCheckedAt: get().selectedDate,
          inRoom
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
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
                    inRoom,
                    lastCheckedBy: currentUser.username,
                    lastCheckedAt: data.lastCheckedAt
                  };
                }
                return student;
              }),
            };
          }
          return room;
        }),
      }));
      toast.success(isPresent ? 'Marked as present' : inRoom ? 'Marked as in room' : 'Marked as absent');
    } catch (error: any) {
      toast.error('Failed to update status');
      toast.error(error.message);
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

  deleteStudent: async (studentId: string, roomId: string) => {
    try {
      set({ isLoading: true });
      const response = await fetch(`${API_URL}/students/delete/${studentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to delete student');

      set((state) => ({
        rooms: state.rooms.map((room) => {
          if (room.id === roomId) {
            return { ...room, students: room.students.filter((student) => student.id !== studentId) };
          }
          return room;
        }),
      }));

      toast.success('Student deleted successfully');
    } catch (error) {
      toast.error('Failed to delete student');
    }
  },
  getStats: () => {
    const rooms = get().rooms;
    if(rooms.length === 0){
      return {
        totalRooms: 0,
        presentCount: 0,
        absentCount: 0,
        pendingCount: 0,
        inRoomCount: 0
      };
    }
    const selectedBuilding = get().selectedBuilding;
    const filteredRooms = selectedBuilding === 'all' 
    ? rooms 
      : rooms.filter(room => room.building === selectedBuilding);
    let presentCount = 0;
    let absentCount = 0;
    let pendingCount = 0;
    let inRoomCount = 0;
    filteredRooms.forEach((room) => {
      room.students.forEach((student) => {
        if (student.isPresent === true || student.isPresent === 1) presentCount++;
        else if ((student.isPresent === false || student.isPresent === 0) && (student.inRoom === false || student.inRoom === 0)) absentCount++;
        else if (student.inRoom === true || student.inRoom === 1) inRoomCount++;
        else pendingCount++;
      });
    });
    
    return {
      totalRooms: filteredRooms.length,
      presentCount,
      absentCount,
      pendingCount,
      inRoomCount
    };
  },

  setIsAuthenticated: (status: boolean) => {
    set({ isAuthenticated: status });
    localStorage.setItem("isAuthenticated", JSON.stringify(status)); // Guardar en localStorage
  },

  importStudents: async (previewData, studentSelections = {}) => {
    console.log(previewData, studentSelections)
    set({ isLoading: true, err: null });
    try {
      const response = await fetch(`${API_URL}/students/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          students: previewData.allRows,
          studentSelections
        })
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
        throw new Error('Failed to import students');
      }
      set({ isLoading: false, enableFetchRoomsQuery: true });
    } catch (error) {
      set({ isLoading: false });
      toast.error('Error importing students');
    }
  },

  getTranslation: () => translations[get().language],
}));
