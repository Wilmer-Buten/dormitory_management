export const translations = {
  en: {
    welcome: 'Welcome',
    title: 'Dorm Control',
    subtitle: 'Manage your dormitory efficiently',
    search: 'Search by name or resident ID...',
    studentId: 'Resident ID',
    rooms: 'Rooms',
    room: 'Room',
    suites: 'Suites',
    backToSuites: 'Back to Suites',
    totalRooms: 'Total Rooms',
    present: 'Present',
    absent: 'Absent',
    pending: 'Pending',
    building: 'Building',
    verifiedBy: 'Verified by',
    noStudents: 'No residents',
    profile: 'Profile',
    roomIsFull: 'Room is full',
    forbidden: 'You are not authorized to perform this action',
    buildings: {
      all: 'All Buildings'
    },
    menu: {
      dashboard: 'Dashboard',
      attendance: 'Attendance',
      users: 'Users',
      reports: 'Reports',
      settings: 'Settings',
      import: 'Import Residents',
      setup: 'Setup',
      dormitories: 'Dormitories',
      cleanCheck: 'Clean Check Days'
    },
    accessRestricted: {
      title: 'Access Restricted',
      description: 'Dormitory setup (buildings, suites and rooms) is managed by administrators only. Contact an administrator if you need a change made.'
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: "Here's what's happening across your dormitories today",
      buildings: 'Buildings',
      staff: 'Staff Members',
      totalRooms: 'Total Rooms',
      occupancy: 'Residents Housed',
      attendanceRate: "Today's Attendance",
      buildingsOverview: 'Buildings Overview',
      buildingsOverviewEmpty: 'No buildings have been set up yet.',
      todaysBreakdown: "Today's Breakdown",
      quickActions: 'Quick Actions',
      quickActionAddBuilding: 'Add Building',
      quickActionAddUser: 'Add User',
      quickActionImport: 'Import Residents',
      quickActionAttendance: 'Go to Attendance',
      recentActivity: 'Recent Check-ins',
      recentActivityEmpty: 'No check-ins recorded yet for this date.',
      viewAll: 'View all',
      checkedAt: 'at'
    },
    attendance: {
      title: 'Attendance',
      subtitle: 'Check residents in and out, room by room',
      cleanCheckDayBanner: 'Clean Check Day!',
      cleanCheckDayHint: 'Mark each room as clean or not clean in addition to attendance.',
      clean: 'Clean',
      notClean: 'Not clean',
      manageCleanCheckDays: 'Clean check days',
      cleanCheckDaysTitle: 'Clean Check Days',
      cleanCheckDaysSubtitle: 'Choose which weekdays require a clean check for this building. Those days repeat every week.',
      saveCleanCheckWeekdays: 'Save weekdays',
      noCleanCheckDays: 'No weekdays selected. Staff will not see clean check controls.',
      cleanCheckWeekdaysSaved: 'Clean check weekdays saved',
      weekdays: {
        sunday: 'Sunday',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
      },
    },
    reports: {
      title: 'Reports',
      subtitle: 'Attendance trends and check-in history over any date range',
      startDate: 'Start date',
      endDate: 'End date',
      allBuildings: 'All Buildings',
      exportButton: 'Export to Excel',
      exporting: 'Exporting...',
      exportSuccess: 'Report exported successfully',
      exportError: 'Failed to export report',
      kpiTotalStudents: 'Total Residents',
      kpiAttendanceRate: 'Attendance Rate',
      kpiTotalCheckIns: 'Total Check-ins',
      kpiAbsences: 'Absences',
      dailyTrendTitle: 'Daily Attendance Trend',
      dailyTrendSubtitle: 'Present, absent, and pending check-ins per day',
      dailyTrendEmpty: 'No data available for the selected range.',
      studentDetailTitle: 'Resident Detail',
      studentDetailSubtitleDaily: 'Day-by-day attendance status for each resident',
      studentDetailSubtitleSummary: 'Attendance summary for each resident over the selected range',
      tableName: 'Name',
      tableRoom: 'Room',
      tableBuilding: 'Building',
      tablePresentDays: 'Present',
      tableAbsentDays: 'Absent',
      tablePendingDays: 'Pending',
      tableAttendanceRate: 'Rate',
      statusPresent: 'Present',
      statusAbsent: 'Absent',
      statusPending: 'Pending',
      empty: 'No active residents found for the selected building and date range.',
      loadError: 'Error loading the report',
      retry: 'Retry',
      invalidRange: 'Please select a valid start and end date.',
      rangeTooLong: 'The selected range is too long. Please select up to 92 days.',
      sheetSummary: 'Summary',
      sheetDaily: 'Daily Detail',
      excelStatusPresent: 'Present',
      excelStatusAbsent: 'Absent',
      excelStatusPending: 'Pending'
    },
    auth: {
      signIn: 'Sign in to your account',
      email: 'Email address',
      emailOrUsername: 'Email or username',
      password: 'Password',
      invalidCredentials: 'Invalid email or password'
    },
    common: {
      cancel: 'Cancel',
      delete: 'Delete',
      save: 'Save'
    },
    import: {
      title: 'Import Residents',
      importButton: 'Import Residents',
      subtitle: 'Upload your Excel file with students, rooms, and suites data',
      success: 'Data imported successfully',
      error: 'Error importing data. Please check your file format',
      columnError: 'One or more required columns are missing from the \'Students\' sheet. Please make sure the sheet contains the following columns: Name, Building, Suite, Room.',
      ignoredRecord: 'Ignored record. This student does not belong to your building.',
      confirm: {
        title: 'Confirm Import',
        description: 'residents match existing records. If you proceed, their data will be overwritten. Are you sure you want to continue?',
        confirmButton: 'Confirm Import'
      },
      instructions: {
        title: 'Import Instructions',
        description: 'Please prepare your Excel file with a sheet called "Students" with the following columns:',
        sheets: 'Required Columns: ',
        name: 'Name (Ex: Paul)',
        id: 'ID (Ex: 12345678) — optional',
        room: 'Room (Ex: A)',
        suite: 'Suite (Ex: 101)',
        building: 'Building (Ex: Edwards)'
      },
      note: {
        title: 'Important Note',
        description: 'Make sure the data is formatted correctly in the file, and that the "Students" sheet is present.'
      },
      dropzone: {
        title: 'Upload Excel File',
        description: 'Drag and drop your Excel file here, or click to select',
        button: 'Select File'
      },
      dataPreview: {
        title: 'Data Preview',
        legend: {
          redLabel: 'red records indicate matches with existing room data (action required).',
          yellowLabel: 'yellow records indicate matches with existing resident names (will be ignored).'
        }
      },
      template: {
        title: 'Download Template',
        description: 'Need a starting point? Download our Excel template with the correct format for importing resident data.',
        button: 'Download Excel Template'
      }
    },
    students: {
      delete: 'Delete Resident',
      deleteConfirm: 'Are you sure you want to delete this resident?',
      deleteConfirmButton: 'Confirm Deletion',
      addingStudent: 'Adding Resident'
    },
    users: {
      title: 'User Management',
      subtitle: 'Create and manage user accounts',
      createNew: 'Create New User',
      email: 'Email',
      username: 'Username (optional)',
      password: 'Password',
      create: 'Create User',
      list: 'User List',
      search: 'Search users...',
      name: 'First name',
      lastname: 'Last name',
      role: 'Role',
      roles: {
        all: 'All',
        admin: 'Administrator',
        supervisor: 'Supervisor',
        staff: 'Staff'
      },
      userDeactivationModal: {
        title: 'Confirm Deactivation',
        description: 'Are you sure you want to deactivate'
      },
      building: 'Building',
      actions: 'Actions',
      edit: 'Edit',
      editUser: 'Edit User',
      cancelCreate: 'Cancel Creation',
      deactivate: 'Deactivate',
      activate: 'Activate',
      statusActive: 'Active',
      statusInactive: 'Inactive'
    },
    settings: {
      title: 'Settings',
      subtitle: 'Customize your experience',
      language: 'Language',
      languageDescription: 'Choose your preferred language',
      languages: {
        en: 'English',
        es: 'Español',
        fr: 'Français'
      },
      logout: 'Logout',
      theme: 'Theme',
      themeDescription: 'Choose your preferred theme',
      light: 'Light',
      dark: 'Dark'
    }
  },
  es: {
    welcome: 'Bienvenido',
    title: 'Control de Dormitorios',
    subtitle: 'Gestiona tu dormitorio de manera eficiente',
    search: 'Buscar por nombre o ID institucional...',
    studentId: 'ID Institucional',
    rooms: 'Habitaciones',
    room: 'Habitación',
    suites: 'Suites',
    backToSuites: 'Volver a Suites',
    totalRooms: 'Total de Habitaciones',
    present: 'Presente',
    absent: 'Ausente',
    pending: 'Pendiente',
    building: 'Edificio',
    verifiedBy: 'Verificado por',
    noStudents: 'No hay residentes',
    profile: 'Perfil',
    roomIsFull: 'La habitación está llena',
    forbidden: 'No tienes autorización para realizar esta acción',
    buildings: {
      all: 'Todos los Edificios'
    },
    menu: {
      dashboard: 'Panel',
      attendance: 'Asistencia',
      users: 'Usuarios',
      reports: 'Reportes',
      settings: 'Ajustes',
      import: 'Importar Residentes',
      setup: 'Configuración',
      dormitories: 'Dormitorios',
      cleanCheck: 'Días de Clean Check'
    },
    accessRestricted: {
      title: 'Acceso Restringido',
      description: 'La configuración de dormitorios (edificios, suites y habitaciones) es gestionada solo por administradores. Contacta a un administrador si necesitas algún cambio.'
    },
    dashboard: {
      title: 'Panel',
      subtitle: 'Esto es lo que pasa hoy en tus dormitorios',
      buildings: 'Edificios',
      staff: 'Miembros del Personal',
      totalRooms: 'Total de Habitaciones',
      occupancy: 'Residentes Alojados',
      attendanceRate: 'Asistencia de Hoy',
      buildingsOverview: 'Resumen de Edificios',
      buildingsOverviewEmpty: 'Aún no se han configurado edificios.',
      todaysBreakdown: 'Resumen de Hoy',
      quickActions: 'Acciones Rápidas',
      quickActionAddBuilding: 'Agregar Edificio',
      quickActionAddUser: 'Agregar Usuario',
      quickActionImport: 'Importar Residentes',
      quickActionAttendance: 'Ir a Asistencia',
      recentActivity: 'Registros Recientes',
      recentActivityEmpty: 'Aún no hay registros para esta fecha.',
      viewAll: 'Ver todo',
      checkedAt: 'a las'
    },
    attendance: {
      title: 'Asistencia',
      subtitle: 'Marca la entrada y salida de residentes, habitación por habitación',
      cleanCheckDayBanner: '¡Día de Clean Check!',
      cleanCheckDayHint: 'Marca cada habitación como limpia o no limpia además de la asistencia.',
      clean: 'Limpio',
      notClean: 'No limpio',
      manageCleanCheckDays: 'Días de clean check',
      cleanCheckDaysTitle: 'Días de Clean Check',
      cleanCheckDaysSubtitle: 'Elige qué días de la semana requieren clean check en este edificio. Se repiten cada semana.',
      saveCleanCheckWeekdays: 'Guardar días',
      noCleanCheckDays: 'Ningún día seleccionado. El staff no verá controles de clean check.',
      cleanCheckWeekdaysSaved: 'Días de clean check guardados',
      weekdays: {
        sunday: 'Domingo',
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
      },
    },
    reports: {
      title: 'Reportes',
      subtitle: 'Tendencias de asistencia e historial de registros en cualquier rango de fechas',
      startDate: 'Fecha inicial',
      endDate: 'Fecha final',
      allBuildings: 'Todos los Edificios',
      exportButton: 'Exportar a Excel',
      exporting: 'Exportando...',
      exportSuccess: 'Reporte exportado exitosamente',
      exportError: 'Error al exportar el reporte',
      kpiTotalStudents: 'Total de Residentes',
      kpiAttendanceRate: 'Tasa de Asistencia',
      kpiTotalCheckIns: 'Total de Registros',
      kpiAbsences: 'Ausencias',
      dailyTrendTitle: 'Tendencia Diaria de Asistencia',
      dailyTrendSubtitle: 'Presentes, ausentes y pendientes por día',
      dailyTrendEmpty: 'No hay datos disponibles para el rango seleccionado.',
      studentDetailTitle: 'Detalle por Residente',
      studentDetailSubtitleDaily: 'Estado de asistencia día por día para cada residente',
      studentDetailSubtitleSummary: 'Resumen de asistencia de cada residente durante el rango seleccionado',
      tableName: 'Nombre',
      tableRoom: 'Habitación',
      tableBuilding: 'Edificio',
      tablePresentDays: 'Presente',
      tableAbsentDays: 'Ausente',
      tablePendingDays: 'Pendiente',
      tableAttendanceRate: 'Tasa',
      statusPresent: 'Presente',
      statusAbsent: 'Ausente',
      statusPending: 'Pendiente',
      empty: 'No se encontraron residentes activos para el edificio y rango de fechas seleccionados.',
      loadError: 'Error al cargar el reporte',
      retry: 'Reintentar',
      invalidRange: 'Por favor selecciona una fecha inicial y final válidas.',
      rangeTooLong: 'El rango seleccionado es demasiado amplio. Selecciona hasta 92 días.',
      sheetSummary: 'Resumen',
      sheetDaily: 'Detalle Diario',
      excelStatusPresent: 'Presente',
      excelStatusAbsent: 'Ausente',
      excelStatusPending: 'Pendiente'
    },
    common: {
      cancel: 'Cancelar',
      delete: 'Eliminar',
      save: 'Guardar'
    },
    auth: {
      signIn: 'Iniciar sesión en tu cuenta',
      email: 'Dirección de correo electrónico',
      emailOrUsername: 'Correo electrónico o usuario',
      password: 'Contraseña',
      invalidCredentials: 'Correo electrónico o contraseña inválidos'
    }, 
    import: {
      title: 'Importar Residentes',
      importButton: 'Importar Residentes',
      subtitle: 'Sube tu archivo Excel con datos de estudiantes, habitaciones y suites',
      success: 'Datos importados exitosamente',
      error: 'Error al importar datos. Por favor verifica el formato del archivo',
      columnError: 'Una o más columnas requeridas no están presentes en la hoja \'Estudiantes\' o están mal escritas. Por favor asegúrate de que la hoja contenga las siguientes columnas: Name, Building, Suite, Room.',
      ignoredRecord: "Registro ignorado (no pertenece a su edificio)",
      confirm: {
        title: 'Confirmar Importación',
        description: 'residentes coinciden con los registros existentes. Si continúas, sus datos serán sobrescritos. ¿Estás seguro de que quieres continuar?',
        confirmButton: 'Confirmar Importación'
      },
      instructions: {
        title: 'Instrucciones de Importación',
        description: 'Por favor prepara tu archivo Excel con la hoja llamada "Estudiantes" con las siguientes columnas:',
        sheets: 'Columnas Requeridas: ',
        name: 'Nombre (Ex: Paul)',
        id: 'ID (Ex: 12345678) — opcional',
        room: 'Habitación (Ex: A)',
        suite: 'Suite (Ex: 101)',
        building: 'Edificio (Ex: Edwards)'
      },
      note: {
        title: 'Nota Importante',
        description: 'Asegurese de que los datos esten correctamente formateados en el archivo, y que la hoja llamada "Estudiantes" esté presente.'
      },
      dropzone: {
        title: 'Subir Archivo Excel',
        description: 'Arrastra y suelta tu archivo Excel aquí, o haz clic para seleccionar',
        button: 'Seleccionar Archivo'
      },
      dataPreview: {
        title: 'Vista Previa de Datos',
        legend: {
          redLabel: 'los registros rojos indican que se encontraron coincidencias en las habitaciones (acción requerida)',
          yellowLabel: 'los registros amarillos indican que se encontraron coincidencias en las habitaciones con los mismos residentes (¡se ignorarán!)'
        }
      },
      template: {
        title: 'Descargar Plantilla',
        description: '¿Necesitas un punto de partida? Descarga nuestra plantilla Excel con el formato correcto para importar los datos de los residentes.',
        button: 'Descargar Plantilla Excel'
      }
    },
    students: {
      delete: 'Eliminar Residente',
      deleteConfirm: '¿Estás seguro de que quieres eliminar este residente?',
      deleteConfirmButton: 'Confirmar Eliminación',
      addingStudent: 'Añadiendo Residente'
    },
    users: {
      title: 'Gestión de Usuarios',
      subtitle: 'Crea y administra cuentas de usuario',
      createNew: 'Crear Nuevo Usuario',
      email: 'Correo electrónico',
      username: 'Usuario (opcional)',
      password: 'Contraseña',
      create: 'Crear Usuario',
      list: 'Lista de Usuarios',
      search: 'Buscar usuarios...',
      name: 'Nombre',
      lastname: 'Apellido',
      role: 'Rol',
      userDeactivationModal: {
        title: 'Confirmar Desactivación',
        description: 'Confirma que deseas desactivar el usuario'
      },
      roles: {
        all: 'Todos',
        admin: 'Administrador',
        supervisor: 'Supervisor',
        staff: 'Personal'
      },
      building: 'Edificio',
      actions: 'Acciones',
      edit: 'Editar',
      editUser: 'Editar Usuario',
      cancelCreate: 'Cancelar Creación',
      deactivate: 'Desactivar',
      activate: 'Activar',
      statusActive: 'Activo',
      statusInactive: 'Inactivo'
    },
    settings: {
      title: 'Ajustes',
      subtitle: 'Personaliza tu experiencia',
      language: 'Idioma',
      languageDescription: 'Elige tu idioma preferido',
      languages: {
        en: 'English',
        es: 'Español',
        fr: 'Français'
      },
      logout: 'Cerrar sesión',
      theme: 'Tema',
      themeDescription: 'Elige tu tema preferido',
      light: 'Claro',
      dark: 'Oscuro'
    }
  },
  fr: {
    welcome: 'Bienvenue',
    title: 'Contrôle des Dortoirs',
    subtitle: 'Gérez votre dortoir efficacement',
    search: 'Rechercher par nom ou ID résident...',
    studentId: 'ID Résident',
    rooms: 'Chambres',
    room: 'Chambre',
    suites: 'Suites',
    backToSuites: 'Retour aux Suites',
    totalRooms: 'Total des Chambres',
    present: 'Présent',
    absent: 'Absent',
    pending: 'En attente',
    building: 'Bâtiment',
    verifiedBy: 'Vérifié par',
    noStudents: 'Pas de résidents',
    profile: 'Profil',
    roomIsFull: 'La chambre est pleine',
    forbidden: 'Vous n\'êtes pas autorisé à effectuer cette action',
    buildings: {
      all: 'Tous les Bâtiments'
    },
    common: {
      cancel: 'Annuler',
      delete: 'Supprimer',
      save: 'Enregistrer'
    },
    menu: {
      dashboard: 'Tableau de Bord',
      attendance: 'Présence',
      users: 'Utilisateurs',
      reports: 'Rapports',
      settings: 'Paramètres',
      import: 'Importer des Résidents',
      setup: 'Configuration',
      dormitories: 'Dortoirs',
      cleanCheck: 'Jours de Clean Check'
    },
    accessRestricted: {
      title: 'Accès Restreint',
      description: 'La configuration des dortoirs (bâtiments, suites et chambres) est gérée uniquement par les administrateurs. Contactez un administrateur si vous avez besoin d\'un changement.'
    },
    dashboard: {
      title: 'Tableau de Bord',
      subtitle: "Voici ce qui se passe aujourd'hui dans vos dortoirs",
      buildings: 'Bâtiments',
      staff: 'Membres du Personnel',
      totalRooms: 'Total des Chambres',
      occupancy: 'Résidents Logés',
      attendanceRate: "Présence du Jour",
      buildingsOverview: 'Aperçu des Bâtiments',
      buildingsOverviewEmpty: "Aucun bâtiment n'a encore été configuré.",
      todaysBreakdown: 'Résumé du Jour',
      quickActions: 'Actions Rapides',
      quickActionAddBuilding: 'Ajouter un Bâtiment',
      quickActionAddUser: 'Ajouter un Utilisateur',
      quickActionImport: 'Importer des Résidents',
      quickActionAttendance: 'Aller à la Présence',
      recentActivity: 'Activité Récente',
      recentActivityEmpty: "Aucun enregistrement pour cette date.",
      viewAll: 'Voir tout',
      checkedAt: 'à'
    },
    attendance: {
      title: 'Présence',
      subtitle: 'Enregistrez les entrées et sorties, chambre par chambre',
      cleanCheckDayBanner: 'Jour de Clean Check !',
      cleanCheckDayHint: 'Marquez chaque chambre comme propre ou non, en plus de la présence.',
      clean: 'Propre',
      notClean: 'Pas propre',
      manageCleanCheckDays: 'Jours de clean check',
      cleanCheckDaysTitle: 'Jours de Clean Check',
      cleanCheckDaysSubtitle: 'Choisissez les jours de la semaine où un clean check est requis pour ce bâtiment. Ils se répètent chaque semaine.',
      saveCleanCheckWeekdays: 'Enregistrer les jours',
      noCleanCheckDays: 'Aucun jour sélectionné. Le personnel ne verra pas les contrôles de clean check.',
      cleanCheckWeekdaysSaved: 'Jours de clean check enregistrés',
      weekdays: {
        sunday: 'Dimanche',
        monday: 'Lundi',
        tuesday: 'Mardi',
        wednesday: 'Mercredi',
        thursday: 'Jeudi',
        friday: 'Vendredi',
        saturday: 'Samedi',
      },
    },
    reports: {
      title: 'Rapports',
      subtitle: "Tendances de présence et historique des enregistrements sur toute période",
      startDate: 'Date de début',
      endDate: 'Date de fin',
      allBuildings: 'Tous les Bâtiments',
      exportButton: 'Exporter vers Excel',
      exporting: 'Exportation...',
      exportSuccess: 'Rapport exporté avec succès',
      exportError: "Erreur lors de l'exportation du rapport",
      kpiTotalStudents: "Total d'Étudiants",
      kpiAttendanceRate: 'Taux de Présence',
      kpiTotalCheckIns: "Total d'Enregistrements",
      kpiAbsences: 'Absences',
      dailyTrendTitle: 'Tendance de Présence Quotidienne',
      dailyTrendSubtitle: 'Présents, absents et en attente par jour',
      dailyTrendEmpty: "Aucune donnée disponible pour la période sélectionnée.",
      studentDetailTitle: 'Détail par Résident',
      studentDetailSubtitleDaily: 'Statut de présence jour par jour pour chaque résident',
      studentDetailSubtitleSummary: 'Résumé de présence de chaque résident sur la période sélectionnée',
      tableName: 'Nom',
      tableRoom: 'Chambre',
      tableBuilding: 'Bâtiment',
      tablePresentDays: 'Présent',
      tableAbsentDays: 'Absent',
      tablePendingDays: 'En attente',
      tableAttendanceRate: 'Taux',
      statusPresent: 'Présent',
      statusAbsent: 'Absent',
      statusPending: 'En attente',
      empty: "Aucun résident actif trouvé pour le bâtiment et la période sélectionnés.",
      loadError: 'Erreur lors du chargement du rapport',
      retry: 'Réessayer',
      invalidRange: 'Veuillez sélectionner une date de début et de fin valides.',
      rangeTooLong: 'La période sélectionnée est trop longue. Veuillez sélectionner jusqu\'à 92 jours.',
      sheetSummary: 'Résumé',
      sheetDaily: 'Détail Quotidien',
      excelStatusPresent: 'Présent',
      excelStatusAbsent: 'Absent',
      excelStatusPending: 'En attente'
    },
    auth: {
      signIn: 'Connexion à votre compte',
      email: 'Adresse e-mail',
      emailOrUsername: 'E-mail ou nom d\'utilisateur',
      password: 'Mot de passe',
      invalidCredentials: 'E-mail ou mot de passe invalide'
    },
    import: {
      title: 'Importer des Résidents',
      importButton: 'Importer des Résidents',
      subtitle: 'Téléchargez votre fichier Excel avec les données des résidents, des chambres et des suites',
      success: 'Données importées avec succès',
      error: 'Erreur lors de l\'importation des données. Veuillez vérifier le format du fichier',
      columnError: 'Une ou plusieurs colonnes requises sont manquantes dans la feuille \'Étudiants\'. Veuillez vous assurer que la feuille contient les colonnes suivantes: Name, Building, Suite, Room.',
      ignoredRecord: 'Enregistrement ignoré (n\'appartient pas à votre bâtiment)',
      confirm: {
        title: 'Confirmer l\'importation',
        description: 'résidents correspondent aux enregistrements existants. Si vous continuez, leurs données seront écrasées. Êtes-vous sûr de vouloir continuer?',
        confirmButton: 'Confirmer l\'importation'
      },
      instructions: {
        title: 'Instructions d\'Importation',
        description: 'Veuillez préparer votre fichier Excel avec la feuille nommée "Étudiants" avec les colonnes suivantes:',
        sheets: 'Colonnes Requises: ',
        name: 'Nom (Ex: Paul)',
        id: 'ID (Ex: 12345678) — optionnel',
        room: 'Chambre (Ex: A)',
        suite: 'Suite (Ex: 101)',
        building: 'Bâtiment (Ex: Edwards)'      
      },
      note: {

        title: 'Note Importante',
        description: 'Assurez-vous que les données sont correctement formatées dans le fichier, et que la feuille nommée "Étudiants" est présente.'
      },
      dropzone: {
        title: 'Télécharger un Fichier Excel',
        description: 'Glissez et déposez votre fichier Excel ici, ou cliquez pour sélectionner',
        button: 'Sélectionner un Fichier'
      },
      dataPreview: {
        title: 'Aperçu des Données',
        legend: {
          redLabel: 'les enregistrements rouges indiquent des correspondances avec les chambres existantes (action requise).',
          yellowLabel: 'les enregistrements jaunes indiquent des correspondances avec les noms des résidents existants (seront ignorés).'
        }
    },
      template: {
        title: 'Télécharger le Modèle',
        description: 'Besoin d\'un point de départ? Téléchargez notre modèle Excel avec le format correct pour importer les données des résidents.',
        button: 'Télécharger le Modèle Excel'
      }
    },
    students: {
      delete: 'Supprimer Résident',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce résident?',
      deleteConfirmButton: 'Confirmer la Suppression',
      addingStudent: 'Ajout d\'un résident'
    },
    users: {
      title: 'Gestion des Utilisateurs',
      subtitle: 'Créer et gérer les comptes utilisateurs',
      createNew: 'Créer un Nouvel Utilisateur',
      email: 'E-mail',
      username: 'Nom d\'utilisateur (optionnel)',
      password: 'Mot de passe',
      create: 'Créer Utilisateur',
      list: 'Liste des Utilisateurs',
      search: 'Rechercher des utilisateurs...',
      name: 'Prénom',
      lastname: 'Nom de famille',
      role: 'Rôle',
      userDeactivationModal: {
        title: 'Confirmer la désactivation',
        description: 'Êtes-vous sûr de vouloir désactiver cet utilisateur?'
      },
      roles: {
        all: 'Tous',
        admin: 'Administrateur',
        supervisor: 'Superviseur',
        staff: 'Personnel'
      },
      building: 'Bâtiment',
      actions: 'Actions',
      edit: 'Modifier',
      editUser: 'Modifier Utilisateur',
      cancelCreate: 'Annuler Création',
      deactivate: 'Désactiver',
      activate: 'Activer',
      statusActive: 'Actif',
      statusInactive: 'Inactif'
    },
    settings: {
      title: 'Paramètres',
      subtitle: 'Personnalisez votre expérience',
      language: 'Langue',
      languageDescription: 'Choisissez votre langue préférée',
      languages: {
        en: 'English',
        es: 'Español',
        fr: 'Français'
      },
      logout: 'Déconnexion',
      theme: 'Thème',
      themeDescription: 'Choisissez votre thème préféré',
      light: 'Clair',
      dark: 'Sombre'
    }
  }
} as const;