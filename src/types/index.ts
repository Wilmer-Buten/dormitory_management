export interface Student {
  id: string;
  name: string;
  isPresent: boolean | null | 1 | 0;
  inRoom: boolean |  null | 1 | 0;
  lastCheckedBy?: string;
  lastCheckedAt?: string;
}

export interface PreviewData {
  sheet: string;
  headers: string[];
  rows: any[];
  allRows: any[]; // Store all rows
  currentPage: number;
  rowsPerPage: number;
}

export interface Room {
  id: string;
  letter: 'A' | 'B' | 'C' | 'D';
  suiteNumber: number;
  suiteId: string; // Suite ID
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
  id?: number;
  username: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'staff';
  building?: string;
  building_id?: number; // Optional because admins don't need a building
}

export type Language = 'es' | 'en' | 'fr';

export interface Translation {
  welcome: string;
  title: string;
  subtitle: string;
  search: string;
  rooms: string;
  room: string;
  suites: string;
  backToSuites: string;
  totalRooms: string;
  present: string;
  absent: string;
  pending: string;
  building: string;
  verifiedBy: string;
  noStudents: string;
  profile: string; 
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
    import: string;
  };
  auth: {
    signIn: string;
    email: string;
    password: string;
    invalidCredentials: string;
  };
  common: {
    cancel: string;
    save: string;
    delete: string;
  };
  import: {
    title: string;
    subtitle: string;
    success: string;
    error: string;
    confirm: {
      title: string;
      description: string;
      confirmButton: string;
    }
    instructions: {
      title: string;
      description: string;
      sheets: string;
      name: string;
      room: string;
      suite: string;
      building: string;
    };
    note: {
      title: string;
      description: string;
    };
    dropzone: {
      title: string;
      description: string;
      button: string;
    };
    template: {
      title: string;
      description: string;
      button: string;
    }
  };
  students: {
    delete: string;
    deleteConfirm: string;
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
    roles: {
      admin: string;
      staff: string;
    };
    building: string;
    actions: string;
    edit: string;
    editUser: string;
    cancelCreate: string;
  };
  settings: {
    title: string;
    subtitle: string;
    language: string;
    languageDescription: string;
    languages: {
      en: string;
      es: string;
      fr: string;
    };
    logout: string;
    theme: string;
    themeDescription: string;
    light: string;
    dark: string;
  };
}
