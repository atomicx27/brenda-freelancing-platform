import React, { createContext, useContext, useState, useEffect } from 'react';

// Translation files
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.findWork': 'Find Work',
    'nav.hire': 'Hire',
    'nav.howItWorks': 'How It Works',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'nav.profile': 'Profile',
    'nav.messages': 'Messages',
    'nav.dashboard': 'Dashboard',
    'nav.adminPanel': 'Admin Panel',
    'nav.reviews': 'Reviews',
    
    // Common
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.clear': 'Clear',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view': 'View',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Info',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.page': 'Page',
    'common.of': 'of',
    'common.total': 'Total',
    'common.results': 'Results',
    
    // Authentication
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.firstName': 'First Name',
    'auth.lastName': 'Last Name',
    'auth.userType': 'User Type',
    'auth.client': 'Client',
    'auth.freelancer': 'Freelancer',
    'auth.rememberMe': 'Remember Me',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.loginSuccess': 'Login successful!',
    'auth.signupSuccess': 'Account created successfully!',
    'auth.logoutSuccess': 'Logged out successfully!',
    
    // Jobs
    'jobs.title': 'Jobs',
    'jobs.allJobs': 'All Jobs',
    'jobs.todaysJobs': "Today's Jobs",
    'jobs.postJob': 'Post a Job',
    'jobs.myJobs': 'My Jobs',
    'jobs.jobTitle': 'Job Title',
    'jobs.description': 'Description',
    'jobs.budget': 'Budget',
    'jobs.category': 'Category',
    'jobs.skills': 'Skills',
    'jobs.location': 'Location',
    'jobs.remote': 'Remote',
    'jobs.duration': 'Duration',
    'jobs.deadline': 'Deadline',
    'jobs.status': 'Status',
    'jobs.open': 'Open',
    'jobs.closed': 'Closed',
    'jobs.inProgress': 'In Progress',
    'jobs.completed': 'Completed',
    'jobs.apply': 'Apply',
    'jobs.viewDetails': 'View Details',
    'jobs.editJob': 'Edit Job',
    'jobs.deleteJob': 'Delete Job',
    'jobs.jobPosted': 'Job posted successfully!',
    'jobs.jobUpdated': 'Job updated successfully!',
    'jobs.jobDeleted': 'Job deleted successfully!',
    
    // Proposals
    'proposals.title': 'Proposals',
    'proposals.myProposals': 'My Proposals',
    'proposals.submitProposal': 'Submit Proposal',
    'proposals.coverLetter': 'Cover Letter',
    'proposals.proposedRate': 'Proposed Rate',
    'proposals.timeline': 'Timeline',
    'proposals.status': 'Status',
    'proposals.pending': 'Pending',
    'proposals.accepted': 'Accepted',
    'proposals.rejected': 'Rejected',
    'proposals.submitted': 'Proposal submitted successfully!',
    'proposals.updated': 'Proposal updated successfully!',
    
    // Messages
    'messages.title': 'Messages',
    'messages.newMessage': 'New Message',
    'messages.send': 'Send',
    'messages.typeMessage': 'Type a message...',
    'messages.noMessages': 'No messages yet',
    'messages.messageSent': 'Message sent successfully!',
    'messages.unread': 'Unread',
    'messages.read': 'Read',
    
    // Reviews
    'reviews.title': 'Reviews',
    'reviews.myReviews': 'My Reviews',
    'reviews.writeReview': 'Write Review',
    'reviews.rating': 'Rating',
    'reviews.comment': 'Comment',
    'reviews.submitReview': 'Submit Review',
    'reviews.reviewSubmitted': 'Review submitted successfully!',
    'reviews.averageRating': 'Average Rating',
    'reviews.totalReviews': 'Total Reviews',
    
    // Profile
    'profile.title': 'Profile',
    'profile.editProfile': 'Edit Profile',
    'profile.skills': 'Skills',
    'profile.experience': 'Experience',
    'profile.hourlyRate': 'Hourly Rate',
    'profile.availability': 'Availability',
    'profile.languages': 'Languages',
    'profile.portfolio': 'Portfolio',
    'profile.companyProfile': 'Company Profile',
    'profile.profileUpdated': 'Profile updated successfully!',
    
    // Admin
    'admin.title': 'Admin Panel',
    'admin.dashboard': 'Dashboard',
    'admin.userManagement': 'User Management',
    'admin.contentModeration': 'Content Moderation',
    'admin.systemMonitoring': 'System Monitoring',
    'admin.backup': 'Backup',
    'admin.users': 'Users',
    'admin.jobs': 'Jobs',
    'admin.proposals': 'Proposals',
    'admin.reviews': 'Reviews',
    'admin.systemHealth': 'System Health',
    'admin.createBackup': 'Create Backup',
    
    // Search
    'search.title': 'Search',
    'search.advancedSearch': 'Advanced Search',
    'search.filters': 'Filters',
    'search.results': 'Search Results',
    'search.noResults': 'No results found',
    'search.clearFilters': 'Clear Filters',
    'search.saveSearch': 'Save Search',
    'search.savedSearches': 'Saved Searches',
    
    // Errors
    'error.generic': 'Something went wrong. Please try again.',
    'error.network': 'Network error. Please check your connection.',
    'error.unauthorized': 'You are not authorized to perform this action.',
    'error.notFound': 'The requested resource was not found.',
    'error.validation': 'Please check your input and try again.',
    'error.server': 'Server error. Please try again later.',
    
    // Success Messages
    'success.saved': 'Saved successfully!',
    'success.updated': 'Updated successfully!',
    'success.deleted': 'Deleted successfully!',
    'success.created': 'Created successfully!',
    'success.sent': 'Sent successfully!',
    
    // Language
    'language.english': 'English',
    'language.spanish': 'Español',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',
    'language.portuguese': 'Português',
    'language.chinese': '中文',
    'language.japanese': '日本語',
    'language.korean': '한국어',
    'language.arabic': 'العربية',
    'language.hindi': 'हिन्दी',
    'language.russian': 'Русский',
    'language.selectLanguage': 'Select Language'
  },
  
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.findWork': 'Encontrar Trabajo',
    'nav.hire': 'Contratar',
    'nav.howItWorks': 'Cómo Funciona',
    'nav.login': 'Iniciar Sesión',
    'nav.signup': 'Registrarse',
    'nav.profile': 'Perfil',
    'nav.messages': 'Mensajes',
    'nav.dashboard': 'Panel',
    'nav.adminPanel': 'Panel de Admin',
    'nav.reviews': 'Reseñas',
    
    // Common
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.clear': 'Limpiar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.submit': 'Enviar',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.view': 'Ver',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.warning': 'Advertencia',
    'common.info': 'Información',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.close': 'Cerrar',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.page': 'Página',
    'common.of': 'de',
    'common.total': 'Total',
    'common.results': 'Resultados',
    
    // Authentication
    'auth.login': 'Iniciar Sesión',
    'auth.signup': 'Registrarse',
    'auth.logout': 'Cerrar Sesión',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar Contraseña',
    'auth.firstName': 'Nombre',
    'auth.lastName': 'Apellido',
    'auth.userType': 'Tipo de Usuario',
    'auth.client': 'Cliente',
    'auth.freelancer': 'Freelancer',
    'auth.rememberMe': 'Recordarme',
    'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.dontHaveAccount': '¿No tienes una cuenta?',
    'auth.alreadyHaveAccount': '¿Ya tienes una cuenta?',
    'auth.loginSuccess': '¡Inicio de sesión exitoso!',
    'auth.signupSuccess': '¡Cuenta creada exitosamente!',
    'auth.logoutSuccess': '¡Sesión cerrada exitosamente!',
    
    // Jobs
    'jobs.title': 'Trabajos',
    'jobs.allJobs': 'Todos los Trabajos',
    'jobs.todaysJobs': 'Trabajos de Hoy',
    'jobs.postJob': 'Publicar Trabajo',
    'jobs.myJobs': 'Mis Trabajos',
    'jobs.jobTitle': 'Título del Trabajo',
    'jobs.description': 'Descripción',
    'jobs.budget': 'Presupuesto',
    'jobs.category': 'Categoría',
    'jobs.skills': 'Habilidades',
    'jobs.location': 'Ubicación',
    'jobs.remote': 'Remoto',
    'jobs.duration': 'Duración',
    'jobs.deadline': 'Fecha Límite',
    'jobs.status': 'Estado',
    'jobs.open': 'Abierto',
    'jobs.closed': 'Cerrado',
    'jobs.inProgress': 'En Progreso',
    'jobs.completed': 'Completado',
    'jobs.apply': 'Aplicar',
    'jobs.viewDetails': 'Ver Detalles',
    'jobs.editJob': 'Editar Trabajo',
    'jobs.deleteJob': 'Eliminar Trabajo',
    'jobs.jobPosted': '¡Trabajo publicado exitosamente!',
    'jobs.jobUpdated': '¡Trabajo actualizado exitosamente!',
    'jobs.jobDeleted': '¡Trabajo eliminado exitosamente!',
    
    // Proposals
    'proposals.title': 'Propuestas',
    'proposals.myProposals': 'Mis Propuestas',
    'proposals.submitProposal': 'Enviar Propuesta',
    'proposals.coverLetter': 'Carta de Presentación',
    'proposals.proposedRate': 'Tarifa Propuesta',
    'proposals.timeline': 'Cronograma',
    'proposals.status': 'Estado',
    'proposals.pending': 'Pendiente',
    'proposals.accepted': 'Aceptado',
    'proposals.rejected': 'Rechazado',
    'proposals.submitted': '¡Propuesta enviada exitosamente!',
    'proposals.updated': '¡Propuesta actualizada exitosamente!',
    
    // Messages
    'messages.title': 'Mensajes',
    'messages.newMessage': 'Nuevo Mensaje',
    'messages.send': 'Enviar',
    'messages.typeMessage': 'Escribe un mensaje...',
    'messages.noMessages': 'Aún no hay mensajes',
    'messages.messageSent': '¡Mensaje enviado exitosamente!',
    'messages.unread': 'No leído',
    'messages.read': 'Leído',
    
    // Reviews
    'reviews.title': 'Reseñas',
    'reviews.myReviews': 'Mis Reseñas',
    'reviews.writeReview': 'Escribir Reseña',
    'reviews.rating': 'Calificación',
    'reviews.comment': 'Comentario',
    'reviews.submitReview': 'Enviar Reseña',
    'reviews.reviewSubmitted': '¡Reseña enviada exitosamente!',
    'reviews.averageRating': 'Calificación Promedio',
    'reviews.totalReviews': 'Total de Reseñas',
    
    // Profile
    'profile.title': 'Perfil',
    'profile.editProfile': 'Editar Perfil',
    'profile.skills': 'Habilidades',
    'profile.experience': 'Experiencia',
    'profile.hourlyRate': 'Tarifa por Hora',
    'profile.availability': 'Disponibilidad',
    'profile.languages': 'Idiomas',
    'profile.portfolio': 'Portafolio',
    'profile.companyProfile': 'Perfil de Empresa',
    'profile.profileUpdated': '¡Perfil actualizado exitosamente!',
    
    // Admin
    'admin.title': 'Panel de Administración',
    'admin.dashboard': 'Panel Principal',
    'admin.userManagement': 'Gestión de Usuarios',
    'admin.contentModeration': 'Moderación de Contenido',
    'admin.systemMonitoring': 'Monitoreo del Sistema',
    'admin.backup': 'Respaldo',
    'admin.users': 'Usuarios',
    'admin.jobs': 'Trabajos',
    'admin.proposals': 'Propuestas',
    'admin.reviews': 'Reseñas',
    'admin.systemHealth': 'Salud del Sistema',
    'admin.createBackup': 'Crear Respaldo',
    
    // Search
    'search.title': 'Buscar',
    'search.advancedSearch': 'Búsqueda Avanzada',
    'search.filters': 'Filtros',
    'search.results': 'Resultados de Búsqueda',
    'search.noResults': 'No se encontraron resultados',
    'search.clearFilters': 'Limpiar Filtros',
    'search.saveSearch': 'Guardar Búsqueda',
    'search.savedSearches': 'Búsquedas Guardadas',
    
    // Errors
    'error.generic': 'Algo salió mal. Por favor intenta de nuevo.',
    'error.network': 'Error de red. Por favor verifica tu conexión.',
    'error.unauthorized': 'No estás autorizado para realizar esta acción.',
    'error.notFound': 'El recurso solicitado no fue encontrado.',
    'error.validation': 'Por favor verifica tu entrada e intenta de nuevo.',
    'error.server': 'Error del servidor. Por favor intenta más tarde.',
    
    // Success Messages
    'success.saved': '¡Guardado exitosamente!',
    'success.updated': '¡Actualizado exitosamente!',
    'success.deleted': '¡Eliminado exitosamente!',
    'success.created': '¡Creado exitosamente!',
    'success.sent': '¡Enviado exitosamente!',
    
    // Language
    'language.english': 'English',
    'language.spanish': 'Español',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',
    'language.portuguese': 'Português',
    'language.chinese': '中文',
    'language.japanese': '日本語',
    'language.korean': '한국어',
    'language.arabic': 'العربية',
    'language.hindi': 'हिन्दी',
    'language.russian': 'Русский',
    'language.selectLanguage': 'Seleccionar Idioma'
  },
  
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.findWork': 'Trouver du Travail',
    'nav.hire': 'Embaucher',
    'nav.howItWorks': 'Comment ça Marche',
    'nav.login': 'Connexion',
    'nav.signup': 'S\'inscrire',
    'nav.profile': 'Profil',
    'nav.messages': 'Messages',
    'nav.dashboard': 'Tableau de Bord',
    'nav.adminPanel': 'Panneau Admin',
    'nav.reviews': 'Avis',
    
    // Common
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.clear': 'Effacer',
    'common.save': 'Sauvegarder',
    'common.cancel': 'Annuler',
    'common.submit': 'Soumettre',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.view': 'Voir',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.warning': 'Avertissement',
    'common.info': 'Information',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.ok': 'OK',
    'common.close': 'Fermer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.page': 'Page',
    'common.of': 'de',
    'common.total': 'Total',
    'common.results': 'Résultats',
    
    // Authentication
    'auth.login': 'Connexion',
    'auth.signup': 'S\'inscrire',
    'auth.logout': 'Déconnexion',
    'auth.email': 'Email',
    'auth.password': 'Mot de Passe',
    'auth.confirmPassword': 'Confirmer le Mot de Passe',
    'auth.firstName': 'Prénom',
    'auth.lastName': 'Nom',
    'auth.userType': 'Type d\'Utilisateur',
    'auth.client': 'Client',
    'auth.freelancer': 'Freelance',
    'auth.rememberMe': 'Se Souvenir de Moi',
    'auth.forgotPassword': 'Mot de Passe Oublié?',
    'auth.dontHaveAccount': 'Vous n\'avez pas de compte?',
    'auth.alreadyHaveAccount': 'Vous avez déjà un compte?',
    'auth.loginSuccess': 'Connexion réussie!',
    'auth.signupSuccess': 'Compte créé avec succès!',
    'auth.logoutSuccess': 'Déconnexion réussie!',
    
    // Jobs
    'jobs.title': 'Emplois',
    'jobs.allJobs': 'Tous les Emplois',
    'jobs.todaysJobs': 'Emplois d\'Aujourd\'hui',
    'jobs.postJob': 'Publier un Emploi',
    'jobs.myJobs': 'Mes Emplois',
    'jobs.jobTitle': 'Titre de l\'Emploi',
    'jobs.description': 'Description',
    'jobs.budget': 'Budget',
    'jobs.category': 'Catégorie',
    'jobs.skills': 'Compétences',
    'jobs.location': 'Localisation',
    'jobs.remote': 'Distant',
    'jobs.duration': 'Durée',
    'jobs.deadline': 'Date Limite',
    'jobs.status': 'Statut',
    'jobs.open': 'Ouvert',
    'jobs.closed': 'Fermé',
    'jobs.inProgress': 'En Cours',
    'jobs.completed': 'Terminé',
    'jobs.apply': 'Postuler',
    'jobs.viewDetails': 'Voir les Détails',
    'jobs.editJob': 'Modifier l\'Emploi',
    'jobs.deleteJob': 'Supprimer l\'Emploi',
    'jobs.jobPosted': 'Emploi publié avec succès!',
    'jobs.jobUpdated': 'Emploi mis à jour avec succès!',
    'jobs.jobDeleted': 'Emploi supprimé avec succès!',
    
    // Proposals
    'proposals.title': 'Propositions',
    'proposals.myProposals': 'Mes Propositions',
    'proposals.submitProposal': 'Soumettre une Proposition',
    'proposals.coverLetter': 'Lettre de Motivation',
    'proposals.proposedRate': 'Tarif Proposé',
    'proposals.timeline': 'Calendrier',
    'proposals.status': 'Statut',
    'proposals.pending': 'En Attente',
    'proposals.accepted': 'Accepté',
    'proposals.rejected': 'Rejeté',
    'proposals.submitted': 'Proposition soumise avec succès!',
    'proposals.updated': 'Proposition mise à jour avec succès!',
    
    // Messages
    'messages.title': 'Messages',
    'messages.newMessage': 'Nouveau Message',
    'messages.send': 'Envoyer',
    'messages.typeMessage': 'Tapez un message...',
    'messages.noMessages': 'Aucun message pour le moment',
    'messages.messageSent': 'Message envoyé avec succès!',
    'messages.unread': 'Non lu',
    'messages.read': 'Lu',
    
    // Reviews
    'reviews.title': 'Avis',
    'reviews.myReviews': 'Mes Avis',
    'reviews.writeReview': 'Écrire un Avis',
    'reviews.rating': 'Note',
    'reviews.comment': 'Commentaire',
    'reviews.submitReview': 'Soumettre l\'Avis',
    'reviews.reviewSubmitted': 'Avis soumis avec succès!',
    'reviews.averageRating': 'Note Moyenne',
    'reviews.totalReviews': 'Total des Avis',
    
    // Profile
    'profile.title': 'Profil',
    'profile.editProfile': 'Modifier le Profil',
    'profile.skills': 'Compétences',
    'profile.experience': 'Expérience',
    'profile.hourlyRate': 'Tarif Horaire',
    'profile.availability': 'Disponibilité',
    'profile.languages': 'Langues',
    'profile.portfolio': 'Portfolio',
    'profile.companyProfile': 'Profil d\'Entreprise',
    'profile.profileUpdated': 'Profil mis à jour avec succès!',
    
    // Admin
    'admin.title': 'Panneau d\'Administration',
    'admin.dashboard': 'Tableau de Bord',
    'admin.userManagement': 'Gestion des Utilisateurs',
    'admin.contentModeration': 'Modération du Contenu',
    'admin.systemMonitoring': 'Surveillance du Système',
    'admin.backup': 'Sauvegarde',
    'admin.users': 'Utilisateurs',
    'admin.jobs': 'Emplois',
    'admin.proposals': 'Propositions',
    'admin.reviews': 'Avis',
    'admin.systemHealth': 'Santé du Système',
    'admin.createBackup': 'Créer une Sauvegarde',
    
    // Search
    'search.title': 'Rechercher',
    'search.advancedSearch': 'Recherche Avancée',
    'search.filters': 'Filtres',
    'search.results': 'Résultats de Recherche',
    'search.noResults': 'Aucun résultat trouvé',
    'search.clearFilters': 'Effacer les Filtres',
    'search.saveSearch': 'Sauvegarder la Recherche',
    'search.savedSearches': 'Recherches Sauvegardées',
    
    // Errors
    'error.generic': 'Quelque chose s\'est mal passé. Veuillez réessayer.',
    'error.network': 'Erreur réseau. Veuillez vérifier votre connexion.',
    'error.unauthorized': 'Vous n\'êtes pas autorisé à effectuer cette action.',
    'error.notFound': 'La ressource demandée n\'a pas été trouvée.',
    'error.validation': 'Veuillez vérifier votre saisie et réessayer.',
    'error.server': 'Erreur serveur. Veuillez réessayer plus tard.',
    
    // Success Messages
    'success.saved': 'Sauvegardé avec succès!',
    'success.updated': 'Mis à jour avec succès!',
    'success.deleted': 'Supprimé avec succès!',
    'success.created': 'Créé avec succès!',
    'success.sent': 'Envoyé avec succès!',
    
    // Language
    'language.english': 'English',
    'language.spanish': 'Español',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',
    'language.portuguese': 'Português',
    'language.chinese': '中文',
    'language.japanese': '日本語',
    'language.korean': '한국어',
    'language.arabic': 'العربية',
    'language.hindi': 'हिन्दी',
    'language.russian': 'Русский',
    'language.selectLanguage': 'Sélectionner la Langue'
  }
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isRTL, setIsRTL] = useState(false);

  // Load saved language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('brenda-language') || 'en';
    setCurrentLanguage(savedLanguage);
    setIsRTL(['ar', 'he', 'fa'].includes(savedLanguage));
  }, []);

  // Save language to localStorage
  const changeLanguage = (languageCode) => {
    setCurrentLanguage(languageCode);
    setIsRTL(['ar', 'he', 'fa'].includes(languageCode));
    localStorage.setItem('brenda-language', languageCode);
    
    // Update document direction
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = languageCode;
  };

  // Translation function
  const t = (key, fallback = key) => {
    const translation = translations[currentLanguage]?.[key];
    return translation || translations['en']?.[key] || fallback;
  };

  // Get available languages
  const getAvailableLanguages = () => {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' },
      { code: 'zh', name: '中文', flag: '🇨🇳' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: '한국어', flag: '🇰🇷' },
      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
      { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' }
    ];
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    isRTL,
    getAvailableLanguages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};


