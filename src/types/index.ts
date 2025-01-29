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
  buildings: {
    all: string;
    edwards: string;
    holland: string;
    peterson: string;
    wade: string;
  };
}