export interface Student {
  id: string;
  name: string;
  isPresent: boolean | null | 1 | 0;
  lastCheckedBy?: string;
  lastCheckedAt?: string;
}

export interface Room {
  id: string;
  number: string;
  letter: 'A' | 'B' | 'C' | 'D';
  suiteId: string;
  building: string;
  students: Student[];
}

export interface Suite {
  id: string;
  number: string;
  building: string;
  rooms: Room[];
}

export interface User {
  username: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'staff';
  building?: string; // Optional because admins don't need a building
}

export type Language = 'es' | 'en' | 'fr';

export interface Translation {
  welcome: string;
  title: string;
  subtitle: string;
  search: string;
  rooms: string;
  suites: string;
  backToSuites: string;
  totalRooms: string;
  present: string;
  absent: string;
  pending: string;
  building: string;
  noStudents: string;
  verifiedBy: string;
  buildings: {
    all: string;
    edwards: string;
    holland: string;
    peterson: string;
    wade: string;
  };
  menu: {
    dashboard: string;
    users: string;
    settings: string;
  },
  students: {
    delete: string;
    deleteConfirm: string;
    deleteConfirmButton: string;
  };
  users: {
    title: string;
    subtitle: string;
    createNew: string;
    email: string;
    password: string;
    create: string;
    list: string;
    search: string;
    name: string;
    role: string;
    actions: string;
    edit: string;
  },
  settings: {
    title: string;
    subtitle: string;
    language: string;
    languageDescription: string; 
    languages: {
      en: string;
      es: string;
      fr: string;
    }, 
    theme: string;
    themeDescription: string;
    light: string;
    dark: string;
  }
}