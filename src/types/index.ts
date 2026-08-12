export interface Student {
  id: string;
  name: string;
  studentUid?: string | null;
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
  buildingId?: number;
  isClean?: boolean | null | 0 | 1;
  isCleanCheckDay?: boolean | null | 0 | 1;
  students: Student[];
}

/** 0=Sunday .. 6=Saturday (same as Date.getDay()) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Suite {
  id: string;
  number: string;
  building: string;
  rooms: Room[];
}

export interface Building {
  id: number;
  name: string;
  code: string;
  layout_type: 'suite' | 'shared_bath' | 'standalone';
  suite_count?: number;
  room_count?: number;
}

export interface User {
  id?: number;
  email: string;
  username?: string | null; // optional alternate identifier, not used for login
  name: string;
  lastname?: string | null;
  avatar?: string;
  role: 'admin' | 'supervisor' | 'staff';
  building?: string;
  building_id?: number; // Optional because admins don't need a building
  active?: boolean; // Deactivated users cannot log in
}

export interface AttendanceReportRecord {
  date: string;
  isPresent: boolean | null;
  inRoom: boolean | null;
  checkedBy: string | null;
  checkedAt: string | null;
}

export interface AttendanceReportStudent {
  id: number;
  name: string;
  building: string;
  room: string;
  records: AttendanceReportRecord[];
}

export interface AttendanceReportDailyBreakdown {
  date: string;
  present: number;
  absent: number;
  pending: number;
  total: number;
  rate: number;
}

export interface AttendanceReportSummary {
  totalStudents: number;
  totalCheckIns: number;
  presentCount: number;
  absentCount: number;
  pendingCount: number;
  attendanceRate: number;
}

export interface AttendanceReport {
  buildingId: number | null;
  buildingName: string | null;
  startDate: string;
  endDate: string;
  summary: AttendanceReportSummary;
  dailyBreakdown: AttendanceReportDailyBreakdown[];
  students: AttendanceReportStudent[];
}

export type Language = 'es' | 'en' | 'fr';

export interface Translation {
  welcome: string;
  title: string;
  subtitle: string;
  search: string;
  studentId: string;
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
  roomIsFull: string;
  profile: string; 
  forbidden: string;
  buildings: {
    all: string;
  };
  menu: {
    dashboard: string;
    attendance: string;
    users: string;
    reports: string;
    settings: string;
    import: string;
    setup: string;
    dormitories: string;
    cleanCheck: string;
  };
  accessRestricted: {
    title: string;
    description: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    buildings: string;
    staff: string;
    totalRooms: string;
    occupancy: string;
    attendanceRate: string;
    buildingsOverview: string;
    buildingsOverviewEmpty: string;
    todaysBreakdown: string;
    quickActions: string;
    quickActionAddBuilding: string;
    quickActionAddUser: string;
    quickActionImport: string;
    quickActionAttendance: string;
    recentActivity: string;
    recentActivityEmpty: string;
    viewAll: string;
    checkedAt: string;
  };
  attendance: {
    title: string;
    subtitle: string;
    cleanCheckDayBanner: string;
    cleanCheckDayHint: string;
    clean: string;
    notClean: string;
    manageCleanCheckDays: string;
    cleanCheckDaysTitle: string;
    cleanCheckDaysSubtitle: string;
    saveCleanCheckWeekdays: string;
    noCleanCheckDays: string;
    cleanCheckWeekdaysSaved: string;
    weekdays: {
      sunday: string;
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
    };
  };
  reports: {
    title: string;
    subtitle: string;
    startDate: string;
    endDate: string;
    allBuildings: string;
    exportButton: string;
    exporting: string;
    exportSuccess: string;
    exportError: string;
    kpiTotalStudents: string;
    kpiAttendanceRate: string;
    kpiTotalCheckIns: string;
    kpiAbsences: string;
    dailyTrendTitle: string;
    dailyTrendSubtitle: string;
    dailyTrendEmpty: string;
    studentDetailTitle: string;
    studentDetailSubtitleDaily: string;
    studentDetailSubtitleSummary: string;
    tableName: string;
    tableRoom: string;
    tableBuilding: string;
    tablePresentDays: string;
    tableAbsentDays: string;
    tablePendingDays: string;
    tableAttendanceRate: string;
    statusPresent: string;
    statusAbsent: string;
    statusPending: string;
    empty: string;
    loadError: string;
    retry: string;
    invalidRange: string;
    rangeTooLong: string;
    sheetSummary: string;
    sheetDaily: string;
    excelStatusPresent: string;
    excelStatusAbsent: string;
    excelStatusPending: string;
  };
  auth: {
    signIn: string;
    email: string;
    emailOrUsername: string;
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
    importButton: string;
    subtitle: string;
    success: string;
    error: string;
    columnError: string;
    ignoredRecord: string;
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
      id: string;
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
    dataPreview: {
      title: string;
      legend: {
        redLabel: string;
        yellowLabel: string;
      };
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
    deleteConfirmButton: string;
    addingStudent: string;
  };
  users: {
    title: string;
    subtitle: string;
    createNew: string;
    email: string;
    username: string;
    password: string;
    create: string;
    list: string;
    search: string;
    name: string;
    lastname: string;
    role: string;
    roles: {
      all: string;
      admin: string;
      supervisor: string;
      staff: string;
    };
    userDeactivationModal: {
      title: string;
      description: string;
    };
    building: string;
    actions: string;
    edit: string;
    editUser: string;
    cancelCreate: string;
    deactivate: string;
    activate: string;
    statusActive: string;
    statusInactive: string;
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
