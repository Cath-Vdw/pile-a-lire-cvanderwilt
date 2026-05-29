/**
 * LA PILE À LIRE - LOCAL STORAGE MANAGER
 * ======================================
 * 
 * Responsabilités:
 * - Gère la persistance de toutes les données utilisateur via localStorage
 * - Sauvegarde et relit: pile à lire, en cours, lus (archivés), notes, coups de cœur
 * - Fourni des méthodes pour ajouter/retirer/checker les états des livres
 * 
 * Le localStorage du navigateur ne stocke que des chaînes, donc:
 * - JSON.stringify() pour convertir objets/tableaux avant sauvegarde
 * - JSON.parse() pour reconvertir en JS à la lecture
 * 
 * Toutes les fonctions sont dans un objet StorageManager (pattern module objet)
 * pour éviter la pollution du scope global.
 */


const StorageManager = {
  
  // ========== CLÉS DE STOCKAGE ==========
  
  /**
   * KEYS: Noms des clés localStorage centralisés ici.
   * Évite les fautes de frappe et facilite les renommages futurs.
   */
  KEYS: {
    FAVORITES: 'pile_favorites',  // tableau d'IDs → livres à lire
    READING:   'pile_reading',    // tableau d'IDs → livres en cours
    ARCHIVED:  'pile_archived',   // tableau d'objets {id, rating, review, archivedDate}
    RATINGS:   'pile_ratings',    // objet {bookId: rating}
    LIKED:     'pile_liked'       // tableau d'IDs → coups de cœur
  },


  // ========== INITIALISATION ==========

  /**
   * init(): Initialise le localStorage avec les clés vides par défaut.
   * 
   * Appelée une seule fois au chargement du script.
   * Évite que JSON.parse() reçoive null et ne plante.
   */
  init() {
    if (!localStorage.getItem(this.KEYS.FAVORITES)) {
      localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.KEYS.READING)) {
      localStorage.setItem(this.KEYS.READING, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.KEYS.ARCHIVED)) {
      localStorage.setItem(this.KEYS.ARCHIVED, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.KEYS.RATINGS)) {
      localStorage.setItem(this.KEYS.RATINGS, JSON.stringify({}));
    }
    if (!localStorage.getItem(this.KEYS.LIKED)) {
      localStorage.setItem(this.KEYS.LIKED, JSON.stringify([]));
    }
  },


  // ========== PILE À LIRE (FAVORIS) ==========

  /**
   * addToFavorites(bookId): Ajoute un livre à la pile à lire.
   * @param {number} bookId - ID du livre
   * @return {boolean} true si ajouté, false si déjà présent
   */
  addToFavorites(bookId) {
    const favorites = this.getFavorites();
    if (!favorites.includes(bookId)) {
      favorites.push(bookId);
      localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
      return true;
    }
    return false;
  },

  /**
   * removeFromFavorites(bookId): Retire un livre de la pile à lire.
   * @param {number} bookId - ID du livre
   * @return {boolean} true si retiré, false si introuvable
   */
  removeFromFavorites(bookId) {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(bookId);
    if (index > -1) {
      favorites.splice(index, 1);
      localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
      return true;
    }
    return false;
  },

  /**
   * getFavorites(): Retourne l'array complet des IDs en pile à lire.
   * @return {number[]}
   */
  getFavorites() {
    const favorites = localStorage.getItem(this.KEYS.FAVORITES);
    return favorites ? JSON.parse(favorites) : [];
  },

  /**
   * isFavorite(bookId): Vérifie si un livre est dans la pile à lire.
   * @param {number} bookId - ID du livre
   * @return {boolean}
   */
  isFavorite(bookId) {
    return this.getFavorites().includes(bookId);
  },

  /**
   * toggleFavorite(bookId): Bascule l'état favori d'un livre (ajout ↔ retrait).
   * @param {number} bookId - ID du livre
   * @return {boolean} true si maintenant favori, false sinon
   */
  toggleFavorite(bookId) {
    if (this.isFavorite(bookId)) {
      this.removeFromFavorites(bookId);
      return false;
    } else {
      this.addToFavorites(bookId);
      return true;
    }
  },


  // ========== COUPS DE CŒUR (♥) ==========

  /**
   * Complètement indépendant de la pile à lire.
   * Un livre peut être aimé qu'il soit à lire, en cours, archivé, ou absolu.
   * L'état persiste après archivage/désarchivage.
   */

  /**
   * getLiked(): Retourne l'array complet des IDs des coups de cœur.
   * @return {number[]}
   */
  getLiked() {
    const liked = localStorage.getItem(this.KEYS.LIKED);
    return liked ? JSON.parse(liked) : [];
  },

  /**
   * isLiked(bookId): Vérifie si un livre est marqué comme coup de cœur.
   * @param {number} bookId - ID du livre
   * @return {boolean}
   */
  isLiked(bookId) {
    return this.getLiked().includes(bookId);
  },

  /**
   * toggleLiked(bookId): Bascule l'état coup de cœur d'un livre.
   * @param {number} bookId - ID du livre
   * @return {boolean} true si maintenant aimé, false sinon
   */
  toggleLiked(bookId) {
    const liked = this.getLiked();
    const index = liked.indexOf(bookId);
    if (index > -1) {
      liked.splice(index, 1);
      localStorage.setItem(this.KEYS.LIKED, JSON.stringify(liked));
      return false;
    } else {
      liked.push(bookId);
      localStorage.setItem(this.KEYS.LIKED, JSON.stringify(liked));
      return true;
    }
  },


  // ========== EN COURS DE LECTURE ==========

  /**
   * addToReading(bookId): Marque un livre comme en cours de lecture.
   * 
   * Effet important: si le livre n'est pas dans les favoris, il y est automatiquement ajouté
   * (garantit qu'un livre "en cours" est toujours visible dans la pile).
   * 
   * @param {number} bookId - ID du livre
   * @return {boolean} true si ajouté, false si déjà présent
   */
  addToReading(bookId) {
    const reading = this.getReading();
    const favorites = this.getFavorites();
    
    if (!reading.includes(bookId)) {
      reading.push(bookId);
      if (!favorites.includes(bookId)) {
        this.addToFavorites(bookId);
      }
      localStorage.setItem(this.KEYS.READING, JSON.stringify(reading));
      return true;
    }
    return false;
  },

  /**
   * removeFromReading(bookId): Sort un livre de la liste "en cours".
   * 
   * Le livre reste dans les favoris (onglet "À lire"), il n'est pas supprimé.
   * 
   * @param {number} bookId - ID du livre
   * @return {boolean} true si retiré, false si introuvable
   */
  removeFromReading(bookId) {
    const reading = this.getReading();
    const index = reading.indexOf(bookId);
    if (index > -1) {
      reading.splice(index, 1);
      localStorage.setItem(this.KEYS.READING, JSON.stringify(reading));
      return true;
    }
    return false;
  },

  /**
   * getReading(): Retourne l'array complet des IDs en cours de lecture.
   * @return {number[]}
   */
  getReading() {
    const reading = localStorage.getItem(this.KEYS.READING);
    return reading ? JSON.parse(reading) : [];
  },

  /**
   * isReading(bookId): Vérifie si un livre est en cours de lecture.
   * @param {number} bookId - ID du livre
   * @return {boolean}
   */
  isReading(bookId) {
    return this.getReading().includes(bookId);
  },


  // ========== LIVRES LUS (ARCHIVÉS) ==========

  /**
   * Contrairement à favoris et en-cours (tableaux d'IDs simples),
   * les livres lus sont un tableau d'OBJETS enrichis:
   * { id, rating, review, archivedDate }
   * 
   * Cela permet de stocker la note et le commentaire avec le livre.
   */

  /**
   * archiveBook(bookId, rating, review): Marque un livre comme lu et l'archive.
   * 
   * Retire automatiquement le livre de la pile ET de "en cours"
   * pour éviter qu'il apparaisse dans plusieurs onglets.
   * Ajoute la date d'archivage au format ISO 8601.
   * 
   * @param {number} bookId - ID du livre
   * @param {number} rating - Note 1-5 (optionnel, défaut 0)
   * @param {string} review - Commentaire utilisateur (optionnel, défaut '')
   * @return {boolean} true si archivé, false si déjà archivé
   */
  archiveBook(bookId, rating = 0, review = '') {
    const archived = this.getArchived();
    
    if (!archived.find(b => b.id === bookId)) {
      archived.push({
        id: bookId,
        rating: rating,
        review: review,
        archivedDate: new Date().toISOString()
      });
      localStorage.setItem(this.KEYS.ARCHIVED, JSON.stringify(archived));
      
      // Nettoyage: retire le livre des deux autres listes
      this.removeFromFavorites(bookId);
      this.removeFromReading(bookId);
      
      return true;
    }
    return false;
  },

  /**
   * unarchiveBook(bookId): Remet un livre dans la pile à lire.
   * 
   * Retire des archivés et remet dans les favoris.
   * La note et le commentaire sont perdus à ce stade.
   * 
   * @param {number} bookId - ID du livre
   * @return {boolean} true si désarchivé, false si introuvable
   */
  unarchiveBook(bookId) {
    const archived = this.getArchived();
    const index = archived.findIndex(b => b.id === bookId);
    if (index > -1) {
      archived.splice(index, 1);
      localStorage.setItem(this.KEYS.ARCHIVED, JSON.stringify(archived));
      this.addToFavorites(bookId);
      return true;
    }
    return false;
  },

  /**
   * getArchived(): Retourne l'array complet des livres archivés.
   * @return {object[]} Tableau d'objets {id, rating, review, archivedDate}
   */
  getArchived() {
    const archived = localStorage.getItem(this.KEYS.ARCHIVED);
    return archived ? JSON.parse(archived) : [];
  },

  /**
   * getArchivedBook(bookId): Retourne l'objet complet d'un livre archivé.
   * @param {number} bookId - ID du livre
   * @return {object|undefined} Objet {id, rating, review, archivedDate} ou undefined
   */
  getArchivedBook(bookId) {
    const archived = this.getArchived();
    return archived.find(b => b.id === bookId);
  },

  /**
   * isArchived(bookId): Vérifie si un livre est archivé.
   * @param {number} bookId - ID du livre
   * @return {boolean}
   */
  isArchived(bookId) {
    return this.getArchived().some(b => b.id === bookId);
  },

  /**
   * updateArchivedBook(bookId, rating, review): Met à jour la note et le commentaire.
   * @param {number} bookId - ID du livre
   * @param {number} rating - Nouvelle note (1-5)
   * @param {string} review - Nouveau commentaire
   * @return {boolean} true si mis à jour, false si introuvable
   */
  updateArchivedBook(bookId, rating, review) {
    const archived = this.getArchived();
    const book = archived.find(b => b.id === bookId);
    if (book) {
      book.rating = rating;
      book.review = review;
      localStorage.setItem(this.KEYS.ARCHIVED, JSON.stringify(archived));
      return true;
    }
    return false;
  },


  // ========== NOTES (RATINGS) ==========

  /**
   * Structure parallèle aux livres lus: dictionnaire { bookId: note }.
   * Permet de noter un livre indépendamment du statut "lu".
   * Dans la pratique, l'app stocke les notes principalement dans les objets archivés.
   */

  /**
   * setRating(bookId, rating): Sauvegarde ou écrase la note d'un livre.
   * @param {number} bookId - ID du livre
   * @param {number} rating - Note (1-5)
   */
  setRating(bookId, rating) {
    const ratings = this.getRatings();
    ratings[bookId] = rating;
    localStorage.setItem(this.KEYS.RATINGS, JSON.stringify(ratings));
  },

  /**
   * getRating(bookId): Retourne la note d'un livre.
   * @param {number} bookId - ID du livre
   * @return {number} Note (1-5) ou 0 par défaut
   */
  getRating(bookId) {
    const ratings = this.getRatings();
    return ratings[bookId] || 0;
  },

  /**
   * getRatings(): Retourne le dictionnaire complet des notes.
   * @return {object} {bookId: rating, ...}
   */
  getRatings() {
    const ratings = localStorage.getItem(this.KEYS.RATINGS);
    return ratings ? JSON.parse(ratings) : {};
  },


  // ========== EXPORT / IMPORT ==========

  /**
   * exportData(): Exporte toutes les données utilisateur en un objet.
   * 
   * Permet à l'utilisateur de sauvegarder ses données manuellement
   * (ex: changer de navigateur ou de machine).
   * 
   * @return {object} {favorites, reading, archived, ratings, liked, exportDate}
   */
  exportData() {
    return {
      favorites:  this.getFavorites(),
      reading:    this.getReading(),
      archived:   this.getArchived(),
      ratings:    this.getRatings(),
      liked:      this.getLiked(),
      exportDate: new Date().toISOString()
    };
  },

  /**
   * importData(data): Réimporte des données précédemment exportées.
   * 
   * Chaque propriété est optionnelle: on n'écrase que ce qui est présent.
   * 
   * @param {object} data - Objet avec propriétés favorites, reading, archived, etc.
   * @return {boolean} true si import réussi, false en cas d'erreur
   */
  importData(data) {
    try {
      if (data.favorites) {
        localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(data.favorites));
      }
      if (data.reading) {
        localStorage.setItem(this.KEYS.READING, JSON.stringify(data.reading));
      }
      if (data.archived) {
        localStorage.setItem(this.KEYS.ARCHIVED, JSON.stringify(data.archived));
      }
      if (data.ratings) {
        localStorage.setItem(this.KEYS.RATINGS, JSON.stringify(data.ratings));
      }
      if (data.liked) {
        localStorage.setItem(this.KEYS.LIKED, JSON.stringify(data.liked));
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },


  // ========== REMISE À ZÉRO ==========

  /**
   * clearAll(): Supprime toutes les données utilisateur.
   * 
   * Réinitialise ensuite les clés vides via init()
   * pour éviter les erreurs par la suite.
   * Utilisé pour un "reset complet" de l'application.
   */
  clearAll() {
    localStorage.removeItem(this.KEYS.FAVORITES);
    localStorage.removeItem(this.KEYS.READING);
    localStorage.removeItem(this.KEYS.ARCHIVED);
    localStorage.removeItem(this.KEYS.RATINGS);
    localStorage.removeItem(this.KEYS.LIKED);
    this.init();
  }
};


// Initialise le localStorage au chargement du script
StorageManager.init();
