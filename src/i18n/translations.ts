export const translations = {
  en: {
    welcome: 'Welcome',
    title: 'Dorm Control',
    subtitle: 'Manage your dormitory efficiently',
    search: 'Search...',
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
    noStudents: 'No students',
    profile: 'Profile',
    forbidden: 'You are not authorized to perform this action',
    buildings: {
      edwards: 'Edwards Hall',
      holland: 'Holland Hall',
      peterson: 'Peterson Hall',
      wade: 'Wade Hall',
      all: 'All Buildings'
    },
    menu: {
      dashboard: 'Dashboard',
      users: 'Users',
      settings: 'Settings',
      import: 'Import Data'
    },
    auth: {
      signIn: 'Sign in to your account',
      email: 'Email address',
      password: 'Password',
      invalidCredentials: 'Invalid email or password'
    },
    common: {
      cancel: 'Cancel',
      delete: 'Delete',
      save: 'Save'
    },
    import: {
      title: 'Import Data',
      importButton: 'Import Data',
      subtitle: 'Upload your Excel file with students, rooms, and suites data',
      success: 'Data imported successfully',
      error: 'Error importing data. Please check your file format',
      confirm: {
        title: 'Confirm Import',
        description: 'students match existing records. If you proceed, their data will be overwritten. Are you sure you want to continue?',
        confirmButton: 'Confirm Import'
      },
      instructions: {
        title: 'Import Instructions',
        description: 'Please prepare your Excel file with a sheet called "Students" with the following columns:',
        sheets: 'Required Columns: ',
        name: 'Name (Ex: Paul)',
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
          yellowLabel: 'yellow records indicate matches with existing student names (will be ignored).'
        }
      },
      template: {
        title: 'Download Template',
        description: 'Need a starting point? Download our Excel template with the correct format for importing student data.',
        button: 'Download Excel Template'
      }
    },
    students: {
      delete: 'Delete Student',
      deleteConfirm: 'Are you sure you want to delete this student?',
      deleteConfirmButton: 'Confirm Deletion'
    },
    users: {
      title: 'User Management',
      subtitle: 'Create and manage user accounts',
      createNew: 'Create New User',
      email: 'Email',
      password: 'Password',
      create: 'Create User',
      list: 'User List',
      search: 'Search users...',
      name: 'Name',
      role: 'Role',
      roles: {
        admin: 'Administrator',
        staff: 'Staff'
      },
      userDeletionModal: {
        title: 'Confirm Deletion',
        description: 'Are you sure you want to delete'
      },
      building: 'Building',
      actions: 'Actions',
      edit: 'Edit',
      editUser: 'Edit User',
      cancelCreate: 'Cancel Creation'
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
    search: 'Buscar...',
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
    noStudents: 'No hay estudiantes',
    profile: 'Perfil',
    forbidden: 'No tienes autorización para realizar esta acción',
    buildings: {
      all: 'Todos los Edificios',
      edwards: 'Edificio Edwards',
      holland: 'Edificio Holland',
      peterson: 'Edificio Peterson',
      wade: 'Edificio Wade'
    },
    menu: {
      dashboard: 'Panel',
      users: 'Usuarios',
      settings: 'Ajustes',
      import: 'Importar Datos'
    },
    common: {
      cancel: 'Cancelar',
      delete: 'Eliminar',
      save: 'Guardar'
    },
    auth: {
      signIn: 'Iniciar sesión en tu cuenta',
      email: 'Dirección de correo electrónico',
      password: 'Contraseña',
      invalidCredentials: 'Correo electrónico o contraseña inválidos'
    }, 
    import: {
      title: 'Importar Datos',
      importButton: 'Importar Datos',
      subtitle: 'Sube tu archivo Excel con datos de estudiantes, habitaciones y suites',
      success: 'Datos importados exitosamente',
      error: 'Error al importar datos. Por favor verifica el formato del archivo',
      confirm: {
        title: 'Confirmar Importación',
        description: 'estudiantes coinciden con los registros existentes. Si continúas, sus datos serán sobrescritos. ¿Estás seguro de que quieres continuar?',
        confirmButton: 'Confirmar Importación'
      },
      instructions: {
        title: 'Instrucciones de Importación',
        description: 'Por favor prepara tu archivo Excel con la hoja llamada "Estudiantes" con las siguientes columnas:',
        sheets: 'Columnas Requeridas: ',
        name: 'Nombre (Ex: Paul)',
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
          yellowLabel: 'los registros amarillos indican que se encontraron coincidencias en las habitaciones con los mismos estudiantes (¡se ignorarán!)'
        }
      },
      template: {
        title: 'Descargar Plantilla',
        description: '¿Necesitas un punto de partida? Descarga nuestra plantilla Excel con el formato correcto para importar los datos de los estudiantes.',
        button: 'Descargar Plantilla Excel'
      }
    },
    students: {
      delete: 'Eliminar Estudiante',
      deleteConfirm: '¿Estás seguro de que quieres eliminar este estudiante?',
      deleteConfirmButton: 'Confirmar Eliminación'
    },
    users: {
      title: 'Gestión de Usuarios',
      subtitle: 'Crea y administra cuentas de usuario',
      createNew: 'Crear Nuevo Usuario',
      email: 'Correo',
      password: 'Contraseña',
      create: 'Crear Usuario',
      list: 'Lista de Usuarios',
      search: 'Buscar usuarios...',
      name: 'Nombre',
      role: 'Rol',
      userDeletionModal: {
        title: 'Confirmar Eliminación',
        description: 'Confirma que deseas eliminar el usuario'
      },
      roles: {
        admin: 'Administrador',
        staff: 'Personal'
      },
      building: 'Edificio',
      actions: 'Acciones',
      edit: 'Editar',
      editUser: 'Editar Usuario',
      cancelCreate: 'Cancelar Creación'
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
    search: 'Rechercher...',
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
    noStudents: 'Pas d\'étudiants',
    profile: 'Profil',
    forbidden: 'Vous n\'êtes pas autorisé à effectuer cette action',
    buildings: {
      all: 'Tous les Bâtiments',
      edwards: 'Bâtiment Edwards',
      holland: 'Bâtiment Holland',
      peterson: 'Bâtiment Peterson',
      wade: 'Bâtiment Wade'
    },
    common: {
      cancel: 'Annuler',
      delete: 'Supprimer',
      save: 'Enregistrer'
    },
    menu: {
      dashboard: 'Tableau de Bord',
      users: 'Utilisateurs',
      settings: 'Paramètres',
      import: 'Importer des Données'
    },
    auth: {
      signIn: 'Connexion à votre compte',
      email: 'Adresse e-mail',
      password: 'Mot de passe',
      invalidCredentials: 'E-mail ou mot de passe invalide'
    },
    import: {
      title: 'Importer des Données',
      subtitle: 'Téléchargez votre fichier Excel avec les données des étudiants, des chambres et des suites',
      success: 'Données importées avec succès',
      error: 'Erreur lors de l\'importation des données. Veuillez vérifier le format du fichier',
      confirm: {
        title: 'Confirmer l\'importation',
        description: 'étudiants correspondent aux enregistrements existants. Si vous continuez, leurs données seront écrasées. Êtes-vous sûr de vouloir continuer?',
        confirmButton: 'Confirmer l\'importation'
      },
      instructions: {
        title: 'Instructions d\'Importation',
        description: 'Veuillez préparer votre fichier Excel avec la feuille nommée "Étudiants" avec les colonnes suivantes:',
        sheets: 'Colonnes Requises: ',
        name: 'Nom (Ex: Paul)',
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
          yellowLabel: 'les enregistrements jaunes indiquent des correspondances avec les noms des étudiants existants (seront ignorés).'
        }
    },
      template: {
        title: 'Télécharger le Modèle',
        description: 'Besoin d\'un point de départ? Téléchargez notre modèle Excel avec le format correct pour importer les données des étudiants.',
        button: 'Télécharger le Modèle Excel'
      }
    },
    students: {
      delete: 'Supprimer Étudiant',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cet étudiant?',
      deleteConfirmButton: 'Confirmer la Suppression'
    },
    users: {
      title: 'Gestion des Utilisateurs',
      subtitle: 'Créer et gérer les comptes utilisateurs',
      createNew: 'Créer un Nouvel Utilisateur',
      email: 'Email',
      password: 'Mot de passe',
      create: 'Créer Utilisateur',
      list: 'Liste des Utilisateurs',
      search: 'Rechercher des utilisateurs...',
      name: 'Nom',
      role: 'Rôle',
      userDeletionModal: {
        title: 'Confirmer la suppression',
        description: 'Êtes-vous sûr de vouloir supprimer cet utilisateur?'
      },
      roles: {
        admin: 'Administrateur',
        staff: 'Personnel'
      },
      building: 'Bâtiment',
      actions: 'Actions',
      edit: 'Modifier',
      editUser: 'Modifier Utilisateur',
      cancelCreate: 'Annuler Création'
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