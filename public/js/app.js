/**
 * LA PILE À LIRE - MAIN APPLICATION
 * ================================
 *
 * Responsabilités:
 * - Orchestration générale de l'app (init, événements, rendu)
 * - Filtrage et recherche des livres (format, longueur, genres, mot-clé)
 * - Affichage: grille de livres, modals de détail, onglets pile à lire
 * - Gestion des interactions utilisateur (clics, soumissions, changements)
 * - Communication avec StorageManager pour la persistance
 *
 * Dépendances (à charger dans le HTML avant ce script):
 * - storage.js: StorageManager
 * - lucide-icons: icônes SVG (CDN)
 *
 * Structure:
 * 1. État global (filtres, pagination)
 * 2. Références DOM
 * 3. Initialisation
 * 4. Détection recherche active
 * 5. Statistiques et filtres
 * 6. Recherche et filtrage
 * 7. Rendu grille + cartes livres
 * 8. Modal détail livre
 * 9. Pile à lire (onglets + items)
 * 10. Modal notation
 * 11. Hibook (mascotte + notifications)
 * 12. Animations
 */

// ========== ÉTAT GLOBAL ==========

/**
 * Filtres actifs: format, longueur, genres.
 * Réinitialisé lors d'un reset ou changement de filtre.
 * Le mot-clé est séparé intentionnellement (voir currentKeyword).
 */
let currentFilters = {
    format: "all",
    length: "all",
    genres: [],
};

/**
 * Mot-clé de recherche texte.
 * Séparé des filtres pour que réinitialiser les filtres ne vide PAS la recherche
 * et vice-versa. Stocké en minuscules pour comparaison insensible à la casse.
 */
let currentKeyword = "";

/**
 * ID du livre en cours de notation dans la modal.
 * Mis à jour juste avant l'ouverture de la modal, utilisé lors de la confirmation.
 */
let currentRatingBook = null;

/**
 * Pagination: affiche PAGE_SIZE livres par écran.
 * currentPage repart à 1 à chaque changement de filtre.
 */
const PAGE_SIZE = 15;
let currentPage = 1;

// ========== RÉFÉRENCES DOM ==========

/**
 * Toutes les références aux éléments HTML centralisées ici.
 * Avantages: évite des document.getElementById() répétés,
 * centralise les IDs, facilite la lecture du code.
 */
const elements = {
    // Compteurs stats
    statBooks: document.getElementById("stat-books"),
    statPages: document.getElementById("stat-pages"),
    statGenres: document.getElementById("stat-genres"),
    statFormats: document.getElementById("stat-formats"),

    // Zone principale grille
    booksGrid: document.getElementById("books-grid"),
    noResults: document.getElementById("no-results"),

    // Filtres
    genresList: document.getElementById("genres-list"),
    genreNote: document.getElementById("genre-note"),
    keywordSearch: document.getElementById("keyword-search"),
    clearKeyword: document.getElementById("clear-keyword"),
    resetFilters: document.getElementById("reset-filters"),

    // Pagination
    loadMoreBtn: document.getElementById("load-more-btn"),
    loadMoreContainer: document.getElementById("load-more-container"),

    // Modal détail livre
    bookModal: document.getElementById("book-modal"),
    detailTitle: document.getElementById("detail-title"),
    detailAuthor: document.getElementById("detail-author"),
    detailCover: document.getElementById("detail-cover"),
    detailFormat: document.getElementById("detail-format"),
    detailLength: document.getElementById("detail-length"),
    detailGenres: document.getElementById("detail-genres"),
    detailSummary: document.getElementById("detail-summary"),
    detailFavoriteBtn: document.getElementById("detail-favorite-btn"),

    // Labels longueur (changent selon format sélectionné)
    lengthLabel: document.getElementById("length-label"),
    detailLengthLabel: document.getElementById("detail-length-label"),
    lengthComicLabel: document.getElementById("length-comic-label"),
    lengthShortLabel: document.getElementById("length-short-label"),
    lengthMediumLabel: document.getElementById("length-medium-label"),
    lengthLongLabel: document.getElementById("length-long-label"),

    // Modal notation
    ratingModal: document.getElementById("rating-modal"),

    // Onglets pile à lire
    pileTabButtons: document.querySelectorAll(".pile-tab"),
    pileTabContents: document.querySelectorAll(".pile-tab-content"),
    toReadList: document.getElementById("to-read-list"),
    readingList: document.getElementById("reading-list"),
    likedList: document.getElementById("liked-list"),
    archivedList: document.getElementById("archived-list"),

    // Inputs filtres (radio buttons)
    formatRadios: document.querySelectorAll('input[name="format"]'),
    lengthRadios: document.querySelectorAll('input[name="length"]'),
};

// ========== INITIALISATION ==========

/**
 * init(): Point d'entrée de l'application.
 *
 * Appelée une seule fois quand le DOM est prêt.
 * L'ordre des appels est important: stats et filtres avant le premier rendu.
 */
function init() {
    setupAccordion();
    setupEventListeners();
    showSearchPrompt();
    updatePileDisplay();
}

// ========== DÉTECTION RECHERCHE ACTIVE ==========

/**
 * hasActiveSearch(): Vérifie si l'utilisateur a activé au moins un critère.
 * @return {boolean} true si un filtre ou mot-clé est actif
 */
function hasActiveSearch() {
    if (currentKeyword) return true;
    if (currentFilters.format !== "all") return true;
    if (currentFilters.length !== "all") return true;
    if (currentFilters.genres.length > 0) return true;
    return false;
}

/**
 * showSearchPrompt(): Affiche le message d'invitation à rechercher.
 * Affiché au démarrage (aucun critère actif).
 */
function showSearchPrompt() {
    elements.booksGrid.innerHTML = "";
    elements.noResults.classList.remove("show");
    elements.loadMoreContainer.style.display = "none";
    const prompt = document.getElementById("search-prompt");
    if (prompt) prompt.classList.add("show");
}

// ========== ACCORDÉON ==========

/**
 * setupAccordion(): Active le comportement accordéon sur les sections de filtres.
 *
 * Un seul panneau ouvert à la fois.
 * Cliquer sur un header déjà ouvert le referme (toggle).
 */
function setupAccordion() {
    const headers = document.querySelectorAll(".accordion-header");

    headers.forEach((header) => {
        header.addEventListener("click", () => {
            const targetId = "accordion-" + header.dataset.accordion;
            const targetBody = document.getElementById(targetId);
            const isOpen = targetBody.classList.contains("open");

            // Ferme tous les panneaux
            document
                .querySelectorAll(".accordion-body")
                .forEach((b) => b.classList.remove("open"));
            document
                .querySelectorAll(".accordion-header")
                .forEach((h) => h.classList.remove("open"));

            // Ré-ouvre si c'était fermé
            if (!isOpen) {
                targetBody.classList.add("open");
                header.classList.add("open");
            }
        });
    });
}

// ========== ÉVÉNEMENTS ==========

/**
 * setupEventListeners(): Branche tous les événements interactifs.
 * Appelée une seule fois dans init().
 */
function setupEventListeners() {
    // Filtre FORMAT
    elements.formatRadios.forEach((radio) => {
        radio.addEventListener("change", (e) => {
            currentFilters.format = e.target.value;
            updateLengthFilter();
            resetAndRender();
        });
    });

    // Filtre LONGUEUR
    elements.lengthRadios.forEach((radio) => {
        radio.addEventListener("change", (e) => {
            currentFilters.length = e.target.value;
            resetAndRender();
        });
    });

    // Filtre GENRE (checkboxes)
    document.querySelectorAll(".genre-checkbox").forEach((input) => {
        input.addEventListener("change", (e) => {
            handleGenreChange(e.target);
        });
    });

    // Recherche MOT-CLÉ (avec debounce 300ms)
    // La visibilité du bouton ✕ est mise à jour immédiatement (pas dans le debounce)
    // pour éviter un délai visible à chaque frappe.
    let searchTimeout;
    elements.keywordSearch.addEventListener("input", (e) => {
        const value = e.target.value;
        elements.clearKeyword.style.display = value ? "block" : "none";

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentKeyword = value.toLowerCase();
            currentPage = 1;
            renderBooks(false);
        }, 300);
    });

    // Bouton ✕ pour vider la recherche
    elements.clearKeyword.addEventListener("click", () => {
        elements.keywordSearch.value = "";
        currentKeyword = "";
        elements.clearKeyword.style.display = "none";
        currentPage = 1;
        renderBooks(false);
        elements.keywordSearch.focus();
    });

    // Bouton "Réinitialiser les filtres"
    elements.resetFilters.addEventListener("click", resetAllFilters);

    // Bouton "Voir plus" (pagination)
    elements.loadMoreBtn.addEventListener("click", () => {
        currentPage++;
        renderBooks(true);
    });

    // Fermeture des modals (bouton ✕)
    document.querySelectorAll(".close-modal").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.target.closest(".modal").classList.remove("show");
        });
    });

    // Fermeture des modals (clic sur overlay)
    document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("show");
            }
        });
    });

    // Onglets pile à lire
    elements.pileTabButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            switchPileTab(e.target.dataset.tab);
        });
    });

    // Boutons modal notation
    document
        .getElementById("confirm-rating")
        .addEventListener("click", confirmRating);
    document.getElementById("cancel-rating").addEventListener("click", () => {
        elements.ratingModal.classList.remove("show");
    });

    // Étoiles notation (data-rating contient la valeur 1-5)
    document.querySelector(".stars-rating").addEventListener("click", (e) => {
        const star = e.target.closest(".star");
        if (!star) return;
        const rating = parseInt(star.dataset.rating);
        if (rating) setRating(rating);
    });
}

// ========== FILTRE GENRE ==========

/**
 * handleGenreChange(checkbox): Gère le changement d'une case genre.
 * Limite à 3 genres maximum simultanément.
 */
function handleGenreChange(checkbox) {
    if (checkbox.checked) {
        if (currentFilters.genres.length < 3) {
            currentFilters.genres.push(checkbox.value);
        } else {
            checkbox.checked = false;
            showGenreWarning();
            return;
        }
    } else {
        currentFilters.genres = currentFilters.genres.filter(
            (g) => g !== checkbox.value,
        );
    }

    updateGenreNote();
    resetAndRender();
}

/**
 * updateGenreNote(): Met à jour le compteur "X restant(s) - max 3".
 */
function updateGenreNote() {
    const count = currentFilters.genres.length;
    const remaining = 3 - count;
    elements.genreNote.textContent =
        remaining > 0 ? `· ${remaining} restant(s) - max 3` : "· max atteint";
}

/**
 * showGenreWarning(): Affiche temporairement un avertissement (2 sec).
 */
function showGenreWarning() {
    elements.genreNote.textContent = "⚠️ Max 3 genres";
    elements.genreNote.style.color = "#e74c3c";
    setTimeout(() => {
        updateGenreNote();
        elements.genreNote.style.color = "";
    }, 2000);
}

// ========== ADAPTATION DES LABELS DE LONGUEUR ==========

/**
 * updateLengthFilter(): Bascule les labels "pages" ↔ "heures".
 * Appelée quand le format sélectionné change.
 */
function updateLengthFilter() {
    const format = currentFilters.format;
    if (format === "audio") {
        elements.lengthLabel.textContent = "Longueur (durée)";
        elements.lengthShortLabel.textContent = "Moins de 6 heures";
        elements.lengthMediumLabel.textContent = "6 - 12 heures";
        elements.lengthLongLabel.textContent = "Plus de 12 heures";
        if (elements.lengthComicLabel) {
            elements.lengthComicLabel.closest("label").style.display = "none";
        }
    } else {
        elements.lengthLabel.textContent = "Longueur";
        if (elements.lengthComicLabel) {
            elements.lengthComicLabel.closest("label").style.display = "";
            elements.lengthComicLabel.textContent = "Moins de 100 pages (Comic)";
        }
        elements.lengthShortLabel.textContent = "100 - 299 pages";
        elements.lengthMediumLabel.textContent = "301 - 500 pages";
        elements.lengthLongLabel.textContent = "Plus de 500 pages";
    }
}

// ========== RÉINITIALISATION DES FILTRES ==========

/**
 * resetAllFilters(): Remet tous les filtres à "tout afficher".
 * IMPORTANT: le mot-clé (currentKeyword) n'est PAS réinitialisé.
 */
function resetAllFilters() {
    currentFilters = {
        format: "all",
        length: "all",
        genres: [],
    };

    elements.formatRadios.forEach((r) => (r.checked = r.value === "all"));
    elements.lengthRadios.forEach((r) => (r.checked = r.value === "all"));
    document
        .querySelectorAll(".genre-checkbox")
        .forEach((c) => (c.checked = false));

    updateGenreNote();
    updateLengthFilter();
    resetAndRender();
}

/**
 * resetAndRender(): Remet pagination à page 1 et relance le rendu.
 */
function resetAndRender() {
    currentPage = 1;
    renderBooks(false);
}

// ========== FILTRAGE DES LIVRES ==========

/**
 * getFilteredBooks(): Applique tous les filtres et retourne les livres correspondants.
 *
 * Filtres appliqués en séquence (court-circuit si un échoue):
 * - Format (papier, ebook, audio, ou "all")
 * - Longueur (pages ou durée, selon le format)
 * - Genres (livre doit avoir TOUS les genres sélectionnés)
 * - Mot-clé (cherche dans titre, auteur, genres)
 *
 * @return {object[]} Tableau des livres filtrés
 */
function getFilteredBooks() {
    return BOOKS_DATABASE.filter((book) => {
        // Exclut les livres archivés (déjà lus), sauf s'ils sont en coup de cœur
        if (
            StorageManager.isArchived(book.id) &&
            !StorageManager.isLiked(book.id)
        ) {
            return false;
        }

        // Filtre FORMAT
        if (
            currentFilters.format !== "all" &&
            book.format !== currentFilters.format
        ) {
            return false;
        }

        // Filtre LONGUEUR
        if (currentFilters.length !== "all") {
            if (currentFilters.format === "audio") {
                // Parse la durée "Xh Ym" (ex: "11h 30m" → 11.5 heures)
                const durationMatch = book.duration?.match(/(\d+)h\s*(\d+)?m/);
                if (durationMatch) {
                    const hours = parseInt(durationMatch[1]);
                    const minutes = parseInt(durationMatch[2] || 0);
                    const totalHours = hours + minutes / 60;

                    // Seuils: court < 6h, moyen 6-12h, long > 12h
                    if (currentFilters.length === "short" && totalHours >= 6)
                        return false;
                    if (
                        currentFilters.length === "medium" &&
                        (totalHours < 6 || totalHours > 12)
                    )
                        return false;
                    if (currentFilters.length === "long" && totalHours <= 12)
                        return false;
                }
            } else {
                // Filtrage par pages (papier/ebook/comic)
                if (!book.pages) return false;

                // Filtre "comic": moins de 100 pages
                if (currentFilters.length === "comic" && book.pages >= 100)
                    return false;

                // Seuils: court 100-299, moyen 300-500, long > 500
                if (
                    currentFilters.length === "short" &&
                    (book.pages < 100 || book.pages >= 300)
                )
                    return false;
                if (
                    currentFilters.length === "medium" &&
                    (book.pages < 300 || book.pages > 500)
                )
                    return false;
                if (currentFilters.length === "long" && book.pages <= 500)
                    return false;
            }
        }

        // Filtre GENRES
        // Le livre doit avoir TOUS les genres sélectionnés (intersection, pas union)
        if (currentFilters.genres.length > 0) {
            const hasAllGenres = currentFilters.genres.every((genre) =>
                book.genres.includes(genre),
            );
            if (!hasAllGenres) return false;
        }

        // Filtre MOT-CLÉ
        // Recherche dans titre, auteur, genres, série, tome et langue (case-insensitive)
        if (currentKeyword) {
            const kw = currentKeyword;
            const matchTitle = book.title.toLowerCase().includes(kw);
            const matchAuthor = book.author.toLowerCase().includes(kw);
            const matchGenre = book.genres.some((g) =>
                g.toLowerCase().includes(kw),
            );
            const matchSeries = book.series?.toLowerCase().includes(kw);
            const matchNumber = book.book_number?.toString().includes(kw);
            const matchLanguage =
                (kw === "fr" && book.language === "fr") ||
                (kw === "en" && book.language === "en") ||
                (kw === "anglais" && book.language === "en") ||
                (kw === "français" && book.language === "fr") ||
                (kw === "english" && book.language === "en");
            if (
                !matchTitle &&
                !matchAuthor &&
                !matchGenre &&
                !matchSeries &&
                !matchNumber &&
                !matchLanguage
            )
                return false;
        }

        return true;
    });
}

// ========== RENDU DE LA GRILLE DE LIVRES ==========

/**
 * renderBooks(append): Affiche les livres filtrés avec pagination.
 *
 * @param {boolean} append - false: vide la grille et affiche page 1
 *                           true: ajoute la page suivante (bouton "Voir plus")
 */
function renderBooks(append = false) {
    if (!hasActiveSearch()) {
        showSearchPrompt();
        return;
    }

    const prompt = document.getElementById("search-prompt");
    if (prompt) prompt.style.display = "none";

    const filtered = getFilteredBooks();

    if (!append) {
        elements.booksGrid.innerHTML = "";
    }

    if (filtered.length === 0) {
        elements.noResults.classList.add("show");
        elements.loadMoreContainer.style.display = "none";
        return;
    }

    elements.noResults.classList.remove("show");

    // Calcule la tranche à afficher
    const start = append ? (currentPage - 1) * PAGE_SIZE : 0;
    const end = currentPage * PAGE_SIZE;
    const slice = filtered.slice(start, end);

    // Crée une carte pour chaque livre
    slice.forEach((book) => {
        const card = createBookCard(book);
        elements.booksGrid.appendChild(card);
    });

    // Affiche/cache le bouton "Voir plus"
    if (end < filtered.length) {
        elements.loadMoreContainer.style.display = "block";
        elements.loadMoreBtn.textContent = `Voir plus (${filtered.length - end} restants)`;
    } else {
        elements.loadMoreContainer.style.display = "none";
    }
}

// ========== CRÉATION D'UNE CARTE LIVRE ==========

/**
 * createBookCard(book): Crée un élément DOM pour un livre dans la grille.
 *
 * La carte inclut:
 * - Couverture colorée (cliquable, ouvre modal)
 * - Titre + auteur
 * - Format et pages/durée
 * - Bouton favori (étoile) et coup de cœur (cœur)
 *
 * @param {object} book - Objet livre de BOOKS_DATABASE
 * @return {HTMLElement} <div class="book-card">
 */
function createBookCard(book) {
    const card = document.createElement("div");
    card.className = "book-card";

    // Couverture
    const cover = document.createElement("div");
    cover.className = `book-cover ${book.cover_color}`;
    cover.textContent = book.title;
    cover.addEventListener("click", () => openBookModal(book));

    // Bloc info
    const info = document.createElement("div");
    info.className = "book-info";

    const title = document.createElement("h3");
    title.className = "book-title";
    title.textContent = book.title;

    const author = document.createElement("p");
    author.className = "book-author";
    author.textContent = book.author;

    // Métadonnées (format + pages/durée)
    const meta = document.createElement("div");
    meta.className = "book-meta";

    const format = document.createElement("span");
    format.textContent = `Format: ${capitalizeFirst(book.format)}`;

    const length = document.createElement("span");
    if (book.format === "audio") {
        length.textContent = `Durée: ${book.duration}`;
    } else {
        length.textContent = `${book.pages} pages`;
    }
    meta.appendChild(format);
    meta.appendChild(length);

    // Boutons d'action (favori + coup de cœur)
    const actions = document.createElement("div");
    actions.className = "book-actions";

    // Bouton favori (étoile)
    const inPile =
        StorageManager.isFavorite(book.id) ||
        StorageManager.isReading(book.id) ||
        StorageManager.isArchived(book.id);

    const favBtn = document.createElement("button");
    favBtn.className = `book-favorite-btn ${inPile ? "active" : ""}`;
    favBtn.innerHTML = '<i data-lucide="star"></i>';
    favBtn.title = inPile ? "Dans ta pile" : "Ajouter à ma pile";

    favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (StorageManager.isArchived(book.id)) return;
        const isNowFavorite = StorageManager.toggleFavorite(book.id);
        const nowInPile = isNowFavorite || StorageManager.isReading(book.id);
        favBtn.classList.toggle("active", nowInPile);
        favBtn.title = nowInPile ? "Dans ta pile" : "Ajouter à ma pile";
        lucide.createIcons({ nodes: [favBtn] });
        updatePileDisplay();
        if (isNowFavorite) showNotification("", "favorite");
    });

    // Bouton coup de cœur (cœur)
    const isLiked = StorageManager.isLiked(book.id);
    const likeBtn = document.createElement("button");
    likeBtn.className = `book-like-btn ${isLiked ? "active" : ""}`;
    likeBtn.innerHTML = '<i data-lucide="heart"></i>';
    likeBtn.title = isLiked ? "Retirer des coups de cœur" : "Coup de cœur";

    likeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isNowLiked = StorageManager.toggleLiked(book.id);
        likeBtn.classList.toggle("active", isNowLiked);
        likeBtn.title = isNowLiked
            ? "Retirer des coups de cœur"
            : "Coup de cœur";
        lucide.createIcons({ nodes: [likeBtn] });
    });

    actions.appendChild(favBtn);
    actions.appendChild(likeBtn);

    // Assemblage
    info.appendChild(title);
    info.appendChild(author);
    info.appendChild(meta);
    info.appendChild(actions);

    card.appendChild(cover);
    card.appendChild(info);

    lucide.createIcons({ nodes: [card] });

    return card;
}

// ========== MODAL DE DÉTAIL D'UN LIVRE ==========

/**
 * formatGenreLabel(slug, language): Retourne le nom d'affichage d'un genre.
 *
 * - Si le livre est en français ("fr"): cherche le nom français dans GENRES_LIST.
 * - Si le livre est en anglais ("en"): capitalise le slug directement (ex: "urban-fantasy" → "Urban Fantasy").
 * - Si le slug est inconnu dans les deux cas: capitalise le slug.
 *
 * @param {string} slug - Slug genre (ex: "fantasy", "urban-fantasy")
 * @param {string} [language] - Langue du livre ("fr" | "en"), défaut "fr"
 * @return {string} Nom lisible
 */
function formatGenreLabel(slug, language) {
    const slugToDisplay = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    if (language === "en") {
        return slugToDisplay;
    }

    // Livre français: cherche le nom FR dans GENRES_LIST
    const known = GENRES_LIST.find((g) => g.id === slug);
    if (known) return known.name;

    // Genre libre non référencé: capitalise le slug
    return slugToDisplay;
}

/**
 * openBookModal(book): Ouvre la modal avec toutes les infos d'un livre.
 *
 * Affiche: titre, auteur, couverture, format, longueur, genres, résumé.
 * Inclut aussi les boutons d'action (favori, coup de cœur) et l'avis archivé si existant.
 *
 * @param {object} book - Objet livre de BOOKS_DATABASE
 */
function openBookModal(book) {
    // Remplissage des champs
    elements.detailTitle.textContent = book.title;

    // Affichage de la série si elle existe
    let serieDisplay = elements.detailTitle.nextElementSibling;
    if (!serieDisplay || serieDisplay.id !== "detail-series") {
        serieDisplay = document.createElement("p");
        serieDisplay.id = "detail-series";
        serieDisplay.className = "detail-series";
        elements.detailTitle.after(serieDisplay);
    }

    if (book.series && book.book_number) {
        serieDisplay.textContent = `${book.series} - Tome ${book.book_number}`;
        serieDisplay.style.display = "block";
    } else {
        serieDisplay.style.display = "none";
    }

    elements.detailAuthor.textContent = book.author;
    elements.detailCover.className = `book-cover ${book.cover_color}`;
    elements.detailCover.textContent = book.title;
    elements.detailFormat.textContent = capitalizeFirst(book.format);

    // Adapte le label et la valeur affichés selon le format du livre
    elements.detailLengthLabel.textContent =
        book.format === "audio" ? "Durée:" : "Pages:";
    elements.detailLength.textContent =
        book.format === "audio" ? book.duration : book.pages;

    // Genres formatés (en anglais si le livre est en anglais, en français sinon)
    elements.detailGenres.textContent = book.genres
        .map((slug) => formatGenreLabel(slug, book.language))
        .join(", ");
    elements.detailSummary.textContent = book.summary;

    // Affichage de la langue
    let languageDisplay = document.getElementById("detail-language");
    if (!languageDisplay) {
        languageDisplay = document.createElement("p");
        languageDisplay.id = "detail-language";
        languageDisplay.className = "detail-language";
        elements.detailSummary.before(languageDisplay);
    }
    languageDisplay.textContent =
        book.language === "en" ? "Langue: Anglais" : "Langue: Français";

    // Bouton favori dans la modal
    const inPileModal =
        StorageManager.isFavorite(book.id) ||
        StorageManager.isReading(book.id) ||
        StorageManager.isArchived(book.id);

    elements.detailFavoriteBtn.className = `btn btn-modal-action ${inPileModal ? "in-pile" : "not-in-pile"}`;
    elements.detailFavoriteBtn.innerHTML = inPileModal
        ? '<i data-lucide="star"></i> Retirer de ma pile'
        : '<i data-lucide="star"></i> Ajouter à ma pile';

    elements.detailFavoriteBtn.disabled = StorageManager.isArchived(book.id);

    elements.detailFavoriteBtn.onclick = () => {
        if (StorageManager.isArchived(book.id)) return;
        const isNowFavorite = StorageManager.toggleFavorite(book.id);
        openBookModal(book);
        updatePileDisplay();
        if (isNowFavorite) showNotification("", "favorite");
    };

    // Bouton coup de cœur dans la modal
    let detailLikeBtn = document.getElementById("detail-like-btn");
    if (!detailLikeBtn) {
        detailLikeBtn = document.createElement("button");
        detailLikeBtn.id = "detail-like-btn";
        elements.detailFavoriteBtn.after(detailLikeBtn);
    }
    const isLikedModal = StorageManager.isLiked(book.id);
    detailLikeBtn.className = `btn btn-liked ${isLikedModal ? "is-liked" : ""}`;
    detailLikeBtn.innerHTML = `<i data-lucide="heart"></i> Coup de cœur`;
    detailLikeBtn.onclick = () => {
        const nowLiked = StorageManager.toggleLiked(book.id);
        detailLikeBtn.classList.toggle("is-liked", nowLiked);
        lucide.createIcons({ nodes: [detailLikeBtn] });
        const svg = detailLikeBtn.querySelector("svg");
        if (svg) {
            svg.setAttribute("fill", nowLiked ? "currentColor" : "none");
            svg.setAttribute("stroke", nowLiked ? "none" : "currentColor");
        }
    };

    elements.bookModal.classList.add("show");
    lucide.createIcons();

    // Fill initial de l'étoile selon l'état (in-pile ou non)
    const starSvg = elements.detailFavoriteBtn.querySelector("svg");
    if (starSvg) {
        starSvg.setAttribute("fill", inPileModal ? "currentColor" : "none");
        starSvg.setAttribute("stroke", inPileModal ? "none" : "currentColor");
    }

    // Fill initial du cœur selon l'état (aimé ou non)
    const heartSvg = detailLikeBtn.querySelector("svg");
    if (heartSvg) {
        heartSvg.setAttribute("fill", isLikedModal ? "currentColor" : "none");
        heartSvg.setAttribute("stroke", isLikedModal ? "none" : "currentColor");
    }

    // Affichage de l'avis archivé (note + commentaire)
    const existingReview = elements.bookModal.querySelector(
        ".archived-review-block",
    );
    if (existingReview) existingReview.remove();

    const archivedData = StorageManager.getArchivedBook(book.id);
    if (archivedData && archivedData.rating) {
        const reviewBlock = document.createElement("div");
        reviewBlock.className = "archived-review-block";

        // Étoiles (pleines et vides)
        const stars = document.createElement("p");
        stars.className = "archived-review-stars";
        stars.innerHTML =
            '<span class="star-full">★</span>'.repeat(archivedData.rating) +
            '<span class="star-empty">★</span>'.repeat(5 - archivedData.rating);
        stars.title = `${archivedData.rating}/5`;
        reviewBlock.appendChild(stars);

        // Commentaire (optionnel)
        if (archivedData.review && archivedData.review.trim()) {
            const reviewTitle = document.createElement("p");
            reviewTitle.className = "archived-review-label";
            reviewTitle.textContent = "Votre avis";

            const reviewText = document.createElement("p");
            reviewText.className = "archived-review-text";
            reviewText.textContent = archivedData.review;

            reviewBlock.appendChild(reviewTitle);
            reviewBlock.appendChild(reviewText);
        }

        // Insère avant les boutons d'action
        elements.detailFavoriteBtn
            .closest(".detail-actions")
            .before(reviewBlock);
    }

    lucide.createIcons();
}

// ========== PILE À LIRE: ONGLETS ==========

/**
 * switchPileTab(tabName): Bascule entre les onglets "À lire", "En cours", "Lus ♥", "Archivés".
 * @param {string} tabName - 'to-read', 'reading', 'liked', ou 'archived'
 */
function switchPileTab(tabName) {
    elements.pileTabButtons.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    elements.pileTabContents.forEach((content) => {
        content.classList.toggle("active", content.id === `${tabName}-tab`);
    });
}

// ========== PILE À LIRE: MISE À JOUR DE L'AFFICHAGE ==========

/**
 * updatePileDisplay(): Relit les trois listes de StorageManager et reconstruit les onglets.
 *
 * Appelée après chaque action utilisateur modifiant la pile.
 * Gère aussi la mise à jour de la bulle Hibook.
 */
function updatePileDisplay() {
    const favorites = StorageManager.getFavorites();
    const reading = StorageManager.getReading();
    const archived = StorageManager.getArchived();

    // "À lire" = favoris qui ne sont pas en cours et pas archivés
    renderPileBooks(
        favorites.filter(
            (id) => !reading.includes(id) && !StorageManager.isArchived(id),
        ),
        "to-read",
    );

    // "En cours" = simplement la liste reading
    renderPileBooks(reading, "reading");

    // "Lus ♥" = archivés avec coup de cœur, triés alphabétiquement
    const likedArchived = archived
        .filter((b) => StorageManager.isLiked(b.id))
        .sort((a, b) => {
            const bookA = BOOKS_DATABASE.find((bk) => bk.id === a.id);
            const bookB = BOOKS_DATABASE.find((bk) => bk.id === b.id);
            return (bookA?.title || "").localeCompare(
                bookB?.title || "",
                "fr",
                {
                    sensitivity: "base",
                },
            );
        });
    renderPileBooks(
        likedArchived.map((b) => b.id),
        "liked",
    );

    // "Archivés" = archivés sans coup de cœur, triés alphabétiquement
    const plainArchived = archived
        .filter((b) => !StorageManager.isLiked(b.id))
        .sort((a, b) => {
            const bookA = BOOKS_DATABASE.find((bk) => bk.id === a.id);
            const bookB = BOOKS_DATABASE.find((bk) => bk.id === b.id);
            return (bookA?.title || "").localeCompare(
                bookB?.title || "",
                "fr",
                {
                    sensitivity: "base",
                },
            );
        });
    renderPileBooks(
        plainArchived.map((b) => b.id),
        "archived",
    );

    updateHibookBubble();
}

/**
 * renderPileBooks(bookIds, status): Reconstruit un onglet de la pile.
 *
 * @param {number[]} bookIds - IDs des livres à afficher
 * @param {string} status - 'to-read', 'reading', ou 'archived'
 */
function renderPileBooks(bookIds, status) {
    let container, emptyMsg;

    if (status === "to-read") {
        container = elements.toReadList;
        emptyMsg = document.querySelector("#to-read-tab .empty-pile");
    } else if (status === "reading") {
        container = elements.readingList;
        emptyMsg = document.querySelector("#reading-tab .empty-pile");
    } else if (status === "liked") {
        container = elements.likedList;
        emptyMsg = document.querySelector("#liked-tab .empty-pile");
    } else {
        container = elements.archivedList;
        emptyMsg = document.querySelector("#archived-tab .empty-pile");
    }

    container.innerHTML = "";

    if (bookIds.length === 0) {
        emptyMsg.classList.add("show");
        return;
    }

    emptyMsg.classList.remove("show");

    // Crée un élément pour chaque livre
    bookIds.forEach((bookId) => {
        const book = BOOKS_DATABASE.find((b) => b.id === bookId);
        if (book) {
            const item = createPileBookItem(book, status);
            container.appendChild(item);
        }
    });
}

/**
 * createPileBookItem(book, status): Crée un élément DOM pour un livre dans la pile.
 *
 * Les boutons varient selon l'onglet:
 * - "to-read":  "En cours" + "Retirer"
 * - "reading":  "Lu !" + "En pause"
 * - "archived": note + "Modifier" + "Remettre dans la pile"
 *
 * @param {object} book - Objet livre
 * @param {string} status - 'to-read', 'reading', ou 'archived'
 * @return {HTMLElement} <div class="pile-book-item">
 */
function createPileBookItem(book, status) {
    const item = document.createElement("div");
    item.className = "pile-book-item";

    // Couverture miniature
    const cover = document.createElement("div");
    cover.className = `book-cover ${book.cover_color}`;
    cover.textContent = book.title;

    // Informations du livre
    const info = document.createElement("div");
    info.className = "pile-book-info";

    const title = document.createElement("h3");
    title.textContent = book.title;

    // Dans l'onglet archivés, le titre ouvre la modal
    if (status === "archived" || status === "liked") {
        title.style.cursor = "pointer";
        title.style.textDecoration = "underline dotted";
        title.title = "Voir les détails";
        title.addEventListener("click", () => openBookModal(book));
    }

    const author = document.createElement("p");
    author.textContent = book.author;

    // Format + pages/durée
    const meta = document.createElement("p");
    if (book.format === "audio") {
        meta.textContent = `${capitalizeFirst(book.format)} • ${book.duration}`;
    } else {
        meta.textContent = `${capitalizeFirst(book.format)} • ${book.pages} pages`;
    }

    info.appendChild(title);
    info.appendChild(author);
    info.appendChild(meta);

    // Boutons d'action (varient selon l'onglet)
    const actions = document.createElement("div");
    actions.className = "pile-book-actions";

    if (status === "to-read") {
        // "En cours"
        const readBtn = document.createElement("button");
        readBtn.className = "action-btn primary";
        readBtn.textContent = "📖 Lire";
        readBtn.addEventListener("click", () => {
            StorageManager.addToReading(book.id);
            updatePileDisplay();
        });

        // "Retirer"
        const removeBtn = document.createElement("button");
        removeBtn.className = "action-btn danger";
        removeBtn.textContent = "✕ Retirer";
        removeBtn.addEventListener("click", () => {
            StorageManager.removeFromFavorites(book.id);
            updatePileDisplay();
        });

        actions.appendChild(readBtn);
        actions.appendChild(removeBtn);
    } else if (status === "reading") {
        // "Lu !" (ouvre modal notation)
        const archiveBtn = document.createElement("button");
        archiveBtn.className = "action-btn primary";
        archiveBtn.textContent = "✓ Lu !";
        archiveBtn.addEventListener("click", () => {
            currentRatingBook = book.id;
            openRatingModal(book);
        });

        // "En pause" (retire de reading mais garde dans favoris)
        const pauseBtn = document.createElement("button");
        pauseBtn.className = "action-btn secondary";
        pauseBtn.textContent = "⏸ En pause";
        pauseBtn.addEventListener("click", () => {
            StorageManager.removeFromReading(book.id);
            updatePileDisplay();
        });

        actions.appendChild(archiveBtn);
        actions.appendChild(pauseBtn);
    } else if (status === "archived") {
        // Note existante (affichée en étoiles)
        const archivedData = StorageManager.getArchivedBook(book.id);
        if (archivedData && archivedData.rating) {
            const ratingDisplay = document.createElement("span");
            ratingDisplay.className = "pile-rating-stars";
            ratingDisplay.title = `${archivedData.rating}/5`;
            ratingDisplay.innerHTML =
                '<span class="star-full">★</span>'.repeat(archivedData.rating) +
                '<span class="star-empty">★</span>'.repeat(
                    5 - archivedData.rating,
                );
            actions.appendChild(ratingDisplay);
        }

        // "Remettre dans la pile"
        const unarchiveBtn = document.createElement("button");
        unarchiveBtn.className = "action-btn secondary";
        unarchiveBtn.textContent = "↩ Remettre dans la pile";
        unarchiveBtn.addEventListener("click", () => {
            StorageManager.unarchiveBook(book.id);
            updatePileDisplay();
        });

        // "Modifier" (réouvre modal notation avec données existantes)
        const editBtn = document.createElement("button");
        editBtn.className = "action-btn secondary";
        editBtn.textContent = "✏️ Modifier";
        editBtn.addEventListener("click", () => {
            currentRatingBook = book.id;
            const archivedData = StorageManager.getArchivedBook(book.id);
            openRatingModal(book, archivedData);
        });

        actions.appendChild(editBtn);
        actions.appendChild(unarchiveBtn);
    }

    // Assemblage
    item.appendChild(cover);
    item.appendChild(info);
    item.appendChild(actions);

    return item;
}

// ========== MODAL DE NOTATION ==========

/**
 * openRatingModal(book, existingData): Ouvre la modal de notation.
 *
 * @param {object} book - Objet livre
 * @param {object} existingData - null pour nouveau, ou {rating, review} pour modification
 */
function openRatingModal(book, existingData = null) {
    currentRatingBook = book.id;

    // Initialise les étoiles selon la note existante
    document.querySelectorAll(".stars-rating .star").forEach((star, index) => {
        const active =
            existingData && existingData.rating && index < existingData.rating;
        star.classList.toggle("active", active);
        const svg = star.querySelector("svg") || star;
        svg.setAttribute("fill", active ? "currentColor" : "none");
    });

    // Pré-remplit le commentaire
    document.getElementById("review-text").value = existingData?.review || "";

    // Texte indicatif
    const ratingText = document.getElementById("rating-text");
    ratingText.textContent = existingData?.rating
        ? `Votre note: ${existingData.rating}/5 étoiles`
        : "Sélectionnez une note (1-5 étoiles)";

    elements.ratingModal.classList.add("show");

    lucide.createIcons();
    if (existingData?.rating) {
        setRating(existingData.rating);
    }
}

/**
 * setRating(rating): Met à jour visuellement les étoiles sélectionnées.
 * @param {number} rating - Nombre d'étoiles à remplir (1-5)
 */
function setRating(rating) {
    document.querySelectorAll(".stars-rating .star").forEach((star, index) => {
        const active = index < rating;
        star.classList.toggle("active", active);
        const svg = star.querySelector("svg") || star;
        svg.setAttribute("fill", active ? "currentColor" : "none");
    });
    document.getElementById("rating-text").textContent =
        `Vous avez choisi: ${rating}/5 étoiles`;
}

/**
 * confirmRating(): Appelée lors de la confirmation de la notation.
 * Archive le livre avec la note et le commentaire.
 */
function confirmRating() {
    const rating = document.querySelectorAll(
        ".stars-rating .star.active",
    ).length;
    const review = document.getElementById("review-text").value;

    if (rating === 0) {
        alert("Veuillez sélectionner une note");
        return;
    }

    StorageManager.archiveBook(currentRatingBook, rating, review);
    elements.ratingModal.classList.remove("show");
    updatePileDisplay();

    showNotification("Livre marqué comme lu !", "success");
}

// ========== HIBOOK: BULLE DE DIALOGUE ==========

/**
 * Messages pour la bulle de Hibook (au-dessus du logo).
 * Indexés par paliers de taille de pile, avec variantes aléatoires.
 */
const HIBOOK_BUBBLE_MESSAGES = [
    // 0 livre
    [
        "Besoin d'un conseil pour démarrer ?",
        "Ta pile est vide… l'aventure t'attend !",
        "Par où commencer ? Je suis là pour t'aider !",
    ],
    // 1-2 livres
    [
        "Ton premier livre, hou hou!",
        "Un premier pas vers de belles lectures !",
        "Ta pile ne fait que commencer, elle va grandir vite !",
    ],
    // 3-5 livres
    [
        "Ta pile prend forme, c'est génial !",
        "Quelques livres au compteur, c'est prometteur !",
        "La pile grandit, les aventures aussi !",
    ],
    // 6-9 livres
    [
        "Une belle sélection ! Tu sais ce que tu veux!",
        "Les choses sérieuses commencent!",
        "J'approuve totalement tes choix, tu as bon goût !",
    ],
    // 10-14 livres
    [
        "Quelle pile impressionnante ! J'en serais presque jaloux !",
        "Tu as de quoi lire pour un bon moment !",
        "Installe-toi confortablement, tu as de la lecture qui t'attend !",
    ],
    // 15-24 livres
    [
        "Déjà 15 livres ? On ne t'arrête plus, ma parole !",
        "Tu construis une vraie bibliothèque, là !",
        "Je suis tellement fier de toi, hou hou !",
    ],
    // 25-49 livres
    [
        "25 livres ?! Tu es une légende vivante !",
        "Ta pile m'a dépassé en taille, c'est officiel !",
        "À ce rythme tu vas avoir besoin d'une étagère !",
    ],
    // 50+ livres
    [
        "50 livres… L'élève a dépassé le maître !",
        "Ta pile mérite sa place dans un musée !",
        "On trouve probablement ta photo près du mot 'bibliophile' dans le dictionnaire !",
    ],
];

/**
 * updateHibookBubble(): Met à jour le texte de la bulle selon la taille de la pile.
 *
 * Ajoute une animation de pulsation si le message change.
 */
function updateHibookBubble() {
    const bubble = document.getElementById("hibook-bubble");
    const textEl = document.getElementById("hibook-bubble-text");
    if (!bubble || !textEl) return;

    // Taille totale = favoris + en cours + archivés
    const total =
        StorageManager.getFavorites().length +
        StorageManager.getReading().length +
        StorageManager.getArchived().length;

    // Sélectionne le palier selon la taille
    let tier;
    if (total === 0) tier = 0;
    else if (total <= 2) tier = 1;
    else if (total <= 5) tier = 2;
    else if (total <= 9) tier = 3;
    else if (total <= 14) tier = 4;
    else if (total <= 24) tier = 5;
    else if (total <= 49) tier = 6;
    else tier = 7;

    const pool = HIBOOK_BUBBLE_MESSAGES[tier];
    const newMsg = pool[Math.floor(Math.random() * pool.length)];

    // N'anime que si le message change (évite animation à chaque render)
    if (textEl.textContent !== newMsg) {
        textEl.textContent = newMsg;
        bubble.classList.remove("pop");
        void bubble.offsetWidth; // force reflow pour relancer animation
        bubble.classList.add("pop");
        setTimeout(() => bubble.classList.remove("pop"), 400);
    }
}

// ========== HIBOOK: NOTIFICATIONS ==========

/**
 * Messages pour les notifications (lors d'ajout aux favoris).
 */
const HIBOOK_FAVORITE_MESSAGES = [
    "Super choix ! J'ai hâte que tu le lises ! 🎉",
    "Ooh, celui-là m'a l'air excellent ! ✨",
    "Un de plus dans la pile… j'adore ! 🦉",
    "Bonne pioche ! Tu vas te régaler 😄",
    "Ta pile s'agrandit, je suis si fière de toi ! 📚",
];

/**
 * showNotification(message, type): Affiche une notification Hibook.
 *
 * @param {string} message - Texte à afficher (ignoré si type='favorite')
 * @param {string} type - 'favorite', 'success', ou 'info'
 */
function showNotification(message, type = "info") {
    let displayMessage = message;
    if (type === "favorite") {
        displayMessage =
            HIBOOK_FAVORITE_MESSAGES[
                Math.floor(Math.random() * HIBOOK_FAVORITE_MESSAGES.length)
            ];
    }

    const notif = document.createElement("div");
    notif.className = "hibook-notif";
    notif.innerHTML = `
    <img src="./images/logo-bleu.png" alt="Hibook">
    <span>${displayMessage}</span>
  `;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.remove();
    }, 3000);
}

// ========== UTILITAIRES ==========

/**
 * capitalizeFirst(str): Met la première lettre en majuscule.
 * @param {string} str - Chaîne d'entrée
 * @return {string} Chaîne avec première lettre majuscule
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========== ANIMATIONS ==========

/**
 * Désactive l'animation CSS du logo après sa première exécution.
 */
document.querySelectorAll(".hibook-hero, .hibook-about").forEach((logo) => {
    logo.addEventListener("animationend", () => {
        logo.style.animation = "none";
        logo.style.opacity = "1";
    });
});

// ========== SMOOTH SCROLL ==========

/**
 * Ajoute le défilement fluide pour tous les liens internes.
 * Exception: "#home" conserve le comportement natif.
 */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (href !== "#home") {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        }
    });
});

// ========== DÉMARRAGE DE L'APPLICATION ==========

window.addEventListener("DOMContentLoaded", init);