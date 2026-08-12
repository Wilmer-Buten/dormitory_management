import { create } from 'zustand';
import { Room, User, Suite, Building, Language, AttendanceReport } from '../types';
import { translations } from '../i18n/translations';
import toast from 'react-hot-toast';

interface Store {
  rooms: Room[];
  users: User[];
  buildings: Building[];
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
  currentSection: 'dashboard' | 'attendance' | 'users' | 'reports' | 'settings' | 'import' | 'setup' | 'students';
  enableFetchRoomsQuery: boolean;
  enableFetchUsersQuery: boolean;
  selectedStat: 'all' | 'present' | 'inRoom' | 'absent' | 'pending';
  usersRoleFilter: 'all' | 'admin' | 'supervisor' | 'staff';
  err: string | null;
  theme: 'light' | 'dark';
  setSelectedStat: (stat: 'all' | 'present' | 'inRoom' | 'absent' | 'pending') => void;
  setUsersRoleFilter: (role: 'all' | 'admin' | 'supervisor' | 'staff') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  onPageChange: (page: number) => void
  setCurrentSection: (section: 'dashboard' | 'attendance' | 'users' | 'reports' | 'settings' | 'import' | 'setup' | 'students') => void;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: string) => void;
  setCurrentUser: (user: User) => void;
  setViewMode: (mode: 'rooms' | 'suites') => void;
  setSelectedSuite: (suiteId: string | null) => void;
  setSelectedBuilding: (building: string) => void;
  setLanguage: (lang: Language) => void;
  updateStudentPresence: (roomId: string, studentId: string, isPresent: boolean | 1 | 0 | null, inRoom: boolean | null) => Promise<void>;
  fetchRooms: () => Promise<Room[] | undefined>;
  fetchBuildings: () => Promise<Building[]>;
  fetchAttendanceReport: (params: { startDate: string; endDate: string; buildingId?: number | null }) => Promise<AttendanceReport>;
  getBuildingName: (id: number | null | undefined) => string;
  fetchUsers: () => Promise<void>;
  createUser: (user: User) => Promise<void>;
  setEnableFetchRoomsQuery: (enable: boolean) => void;
  setEnableFetchUsersQuery: (enable: boolean) => void;
  setRooms: (rooms: Room[]) => void;
  setError: (error: string) => void;
  updateUser: (userId: number | undefined, userData: Partial<User>) => Promise<void>;
  setUserActiveStatus: (userId: number | undefined, active: boolean) => Promise<void>;
  importStudents: (students: any[], studentSelections?: Record<string, string>) => Promise<void>;
  setIsLoading: (isLoading: boolean) => void; 
  setIsAuthenticated: (status: boolean) => void;
  setAccessToken: (accessToken: string) => void;
  getSuites: () => Suite[];
  getDefaultViewMode: () => 'rooms' | 'suites';
  canSelectSuiteView: () => boolean;
  addStudent: (roomId: string, studentName: String, studentUid?: string) => Promise<void>;
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

const fetchWithAuth = async (url: string, options: RequestInit = {}, get: any, set: any) => {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${get().accessToken}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    try {
      const refreshResponse = await fetch(`${API_URL}/refresh_token`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        set({ accessToken: data.accessToken, currentUser: data.user });
        
        // Retry original request with new token
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${data.accessToken}`,
          },
        });
      } else {
        throw new Error('Session expired');
      }
    } catch (error) {
      set({
        currentUser: null,
        isAuthenticated: false,
        accessToken: '',
        viewMode: 'rooms',
        selectedSuite: null,
        rooms: [],
        users: [],
        currentPage: 1,
        isLoading: false,
        searchQuery: '',
        currentSection: 'dashboard',
      });
      localStorage.removeItem('isAuthenticated');
      throw new Error('Session expired. Please log in again.');
    }
  }
  return response;
};

export const useStore = create<Store>((set, get) => ({
  rooms: [],
  users: [],
  buildings: [],
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
  usersRoleFilter: 'all',
  onPageChange: (page) => set({ currentPage: page }),
  setUsersRoleFilter: (role) => set({ usersRoleFilter: role }),
  setSelectedStat: (stat) => set({ selectedStat: stat, currentPage: 1, viewMode: stat !== 'all' ? 'rooms' : get().viewMode, selectedSuite: null, searchQuery: '' }),
  setEnableFetchRoomsQuery: (enable) => set({ enableFetchRoomsQuery: enable }),
  setEnableFetchUsersQuery: (enable) => set({ enableFetchUsersQuery: enable }),
  setError: (err) => set({ err }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDate: (date) => {set({ selectedDate: date, selectedStat: 'all', searchQuery: '' })},
  setAccessToken: (accessToken) => set({ accessToken: accessToken }),
  setCurrentUser: (user) => set({ currentUser: user, currentSection: user.role === 'staff' ? 'attendance' : 'dashboard' }),
  setViewMode: (mode) => set({ viewMode: mode, selectedSuite: null, selectedStat: 'all', searchQuery: '', currentPage: 1 }),
  setSelectedSuite: (suiteId) => set({ selectedSuite: suiteId }),
  setLanguage: (lang) => set({ language: lang }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setTheme: (theme) => set({ theme: theme }),
  setCurrentSection: (section: 'dashboard' | 'attendance' | 'users' | 'reports' | 'settings' | 'import' | 'setup' | 'students') => set((state) => ({
    currentSection: section,
    currentPage: 1,
    viewMode: section === 'attendance' ? state.getDefaultViewMode() : 'rooms',
    selectedStat: 'all',
    searchQuery: ''
  })),
  setSelectedBuilding: (building) => {
    const currentUserBuildingId = get().currentUser?.building_id;
    if (currentUserBuildingId === null || currentUserBuildingId === undefined) {
      set({ selectedBuilding: building, currentPage: 1, selectedStat: 'all', searchQuery: '' })
      set({ viewMode: get().getDefaultViewMode() })
    } else {
      toast.error(get().getTranslation().forbidden);
    }
  },  
  
  fetchRooms: async () => {
    try {
      await get().fetchBuildings();
      let dateQueryParam = get().selectedDate ? `?building_id=${get().currentUser?.building_id}&date=${get().selectedDate}` : '';
      const response = await fetchWithAuth(`${API_URL}/rooms${dateQueryParam}`, {}, get, set);
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      const userBuildingId = get().currentUser?.building_id;
      const matchedBuilding = get().buildings.find((b) => b.id === userBuildingId);
      set({ selectedBuilding: matchedBuilding ? matchedBuilding.name : 'all' });
      set({ isLoading: false, enableFetchRoomsQuery: false });
      return data as Room[] | undefined; // Might return undefined
    } catch (error) {
      set({ err: (error as Error).message, isLoading: false });
      toast.error('Error loading rooms');
    }
  },

  fetchBuildings: async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/setup/buildings`, {}, get, set);
      if (!response.ok) throw new Error('Failed to fetch buildings');
      const data: Building[] = await response.json();
      set({ buildings: data });
      return data;
    } catch (error) {
      toast.error('Error loading buildings');
      return [];
    }
  },

  fetchAttendanceReport: async ({ startDate, endDate, buildingId }) => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (get().currentUser?.role === 'admin') {
      params.set('building_id', buildingId === null || buildingId === undefined ? 'null' : String(buildingId));
    }
    const response = await fetchWithAuth(`${API_URL}/reports/attendance?${params.toString()}`, {}, get, set);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch attendance report');
    return data as AttendanceReport;
  },

  getBuildingName: (id) => {
    if (id === null || id === undefined) return get().getTranslation().buildings.all;
    const building = get().buildings.find((b) => b.id === id);
    if (!building) return get().getTranslation().buildings.all;
    return building.name.charAt(0).toUpperCase() + building.name.slice(1);
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
          email: data.user.email,
          username: data.user.username,
          name: data.user.name,
          lastname: data.user.lastname,
          role: data.user.role,
          building_id: data.user.building_id
        },
        isAuthenticated: true,
        accessToken: data.accessToken,
        isLoading: false,
        searchQuery: '',
        viewMode: 'rooms',
        selectedStat: 'all',
        currentPage: 1,
        currentSection: data.user.role === 'staff' ? 'attendance' : 'dashboard'
      });
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
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
          currentPage: 1,
          isLoading: false,
          searchQuery: '',
          currentSection: 'dashboard'
        });
        localStorage.removeItem('isAuthenticated');

      } else {
        toast.error('Error logging out');
      }
    } catch (error) {
      toast.error('Error logging out');
    }
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
          room.suiteNumber.toString().includes(searchLower) ||
          room.students.some((student) => 
            student.name?.toLowerCase().includes(searchLower) ||
            student.studentUid?.toLowerCase().includes(searchLower)
          );
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
    
    const response = await fetchWithAuth(`${API_URL}/users`, {}, get, set);
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
      const response = await fetchWithAuth(`${API_URL}/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      }, get, set);

      const data = await response.json();
      if (!response.ok) {
        toast.error('Error creating user');
        throw new Error('Error creating user: ' + data.message);
      }
      set({
        users: [...get().users, {
          id: data.id,
          email: data.email,
          username: data.username,
          name: data.name,
          lastname: data.lastname,
          role: data.role,
          building_id: data.building_id,
          active: true,
        }],
        isLoading: false,
      });
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

  updateUser: async (userId: number | undefined, userData: Partial<User>) => {
    try {
      
      let user = {...userData, id: userId};
      set({ isLoading: true });
      const response = await fetchWithAuth(`${API_URL}/users/edit/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user)
      }, get, set);
      
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

  setUserActiveStatus: async (userId: number | undefined, active: boolean) => {
    set({ isLoading: true });
    try {
      const response = await fetchWithAuth(`${API_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      }, get, set);
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
        throw new Error('Failed to update user status');
      }

      set((state) => ({
        users: state.users.map((user) => (user.id === userId ? { ...user, active } : user)),
        isLoading: false,
      }));
      toast.success(active ? 'User activated successfully' : 'User deactivated successfully');
    } catch (error) {
      set({ isLoading: false });
      toast.error('Failed to update user status');
    }
  },

  addStudent: async (roomId: string, studentName: String, studentUid?: string) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;
    // set({ isLoading: true });
    toast.loading(get().getTranslation().students.addingStudent + '...', { id: 'add-student' });
    try {
      const response = await fetchWithAuth(`${API_URL}/students/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName,
          roomId,
          studentUid: studentUid || null
        })
      }, get, set);
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          toast.error('A student with this ID already exists', { id: 'add-student' });
        }
        throw new Error('Failed to add student');
      }

      set((state) => ({
        rooms: state.rooms.map((room ) => {
          if (room.id === Number(roomId)) {
            return { ...room, students: [...room.students, data.student]};
          }
          return room;
        }),
      }));
      toast.dismiss('add-student');
      toast.success('Student added successfully', { id: 'add-student' });
    } catch (error) {
      toast.error('Failed to add student');
    }
  },

  updateStudentPresence: async (roomId, studentId, isPresent, inRoom) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;
    try {
      const response = await fetchWithAuth(`${API_URL}/rooms/${roomId}/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPresent,
          lastCheckedBy: currentUser.name,
          lastCheckedAt: get().selectedDate,
          inRoom
        })
      }, get, set);
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
                    lastCheckedBy: currentUser.name,
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
      rooms: rooms.sort((a, b) => (a.letter || '').localeCompare(b.letter || ''))
    }));
  },

  // Defaults to 'suites' when the relevant building (the current user's
  // assigned building, or the currently selected building) uses the
  // suite layout; otherwise defaults to 'rooms'.
  getDefaultViewMode: () => {
    const { buildings, currentUser, selectedBuilding } = get();
    let targetBuilding;
    if (currentUser?.building_id) {
      targetBuilding = buildings.find((b) => b.id === currentUser.building_id);
    } else if (selectedBuilding && selectedBuilding !== 'all') {
      targetBuilding = buildings.find((b) => b.name === selectedBuilding);
    }
    return targetBuilding?.layout_type === 'suite' ? 'suites' : 'rooms';
  },

  // Whether the "Suites" view is a meaningful option for the relevant
  // building context. When a specific building is in scope (the current
  // user's assigned building, or the selected building) and it does not
  // use the suite layout, suite view doesn't apply and should be hidden.
  // When no single building is in scope (admin viewing "all"), keep it
  // available since buildings may be mixed.
  canSelectSuiteView: () => {
    const { buildings, currentUser, selectedBuilding } = get();
    let targetBuilding;
    if (currentUser?.building_id) {
      targetBuilding = buildings.find((b) => b.id === currentUser.building_id);
    } else if (selectedBuilding && selectedBuilding !== 'all') {
      targetBuilding = buildings.find((b) => b.name === selectedBuilding);
    }
    if (!targetBuilding) return true;
    return targetBuilding.layout_type === 'suite';
  },

  deleteStudent: async (studentId: string, roomId: string) => {
    try {
      set({ isLoading: true });
      const response = await fetchWithAuth(`${API_URL}/students/delete/${studentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }, get, set);
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
    if(previewData.length === 0) return;
    set({ isLoading: true, err: null });
    try {
      const response = await fetchWithAuth(`${API_URL}/students/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          students: previewData,
          studentSelections
        })
      }, get, set);
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
        throw new Error('Failed to import students');
      }
      const newRooms: Room[] | undefined = await get().fetchRooms();
      set({ rooms: newRooms });
    } catch (error) {
      set({ isLoading: false });
      toast.error('Error importing students');
    }
  },

  getTranslation: () => translations[get().language],
}));
