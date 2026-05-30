/**
 * LA PILE À LIRE - ADMIN CRUD
 * ============================
 *
 * Responsabilités:
 * - Afficher et filtrer le tableau des livres en interface admin
 * - Gérer les modals d'ajout, de modification et de suppression
 * - Valider les formulaires côté client avant persistence
 *
 * Dépendances:
 * - data.js     : fournit BOOKS_DATABASE pour l'initialisation de la démo
 * - Lucide Icons: réinitialisé après chaque re-rendu du tableau
 */

(function () {
    // ========== PERSISTANCE (API Symfony) ==========

    const API_URL = "/api/admin/books";

    // Récupère tous les livres depuis l'API.
    // "async" signifie que cette fonction est asynchrone : elle ne bloque pas le reste
    // du code pendant qu'elle attend la réponse du serveur.
    // Elle retourne automatiquement une "promesse" (Promise) qui se résoudra
    // avec la valeur retournée une fois la réponse reçue.
    async function getAdminBooks() {
        // "await" met la fonction en pause ici jusqu'à ce que le serveur réponde,
        // puis reprend avec le résultat — sans bloquer le reste de la page.
        const res = await fetch(API_URL);
        return res.ok ? res.json() : [];
    }

    // Crée un nouveau livre via l'API
    async function createBook(data) {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    // Modifie un livre existant via l'API
    async function updateBook(id, data) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    // Supprime un livre via l'API
    async function deleteBook(id) {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    }

    // ========== GENRES ==========

    /**
     * collectGenres(): Extrait la liste triée et dédupliquée de tous les genres
     * présents dans les livres actuellement stockés.
     *
     * @returns {string[]} Tableau de slugs de genres, triés alphabétiquement
     */
    function collectGenres() {
        // Priorité à GENRES_LIST (liste complète définie dans data.js).
        // Fallback: extrait les genres présents dans les livres si GENRES_LIST est absent.
        if (typeof GENRES_LIST !== "undefined" && GENRES_LIST.length > 0) {
            return [...GENRES_LIST]
                .sort((a, b) => {
                    if (a.id === "other") return 1;
                    if (b.id === "other") return -1;
                    return a.name.localeCompare(b.name, "fr", {
                        sensitivity: "base",
                    });
                })
                .map((g) => g.id);
        }
        // Fallback : aucun genre défini
        return [];
    }

    // ========== SÉRIES (autocomplétion) ==========

    /**
     * collectSeries(): Extrait la liste triée et dédupliquée de tous les noms
     * de séries présents dans les livres actuellement stockés.
     *
     * Utilisée pour alimenter le datalist d'autocomplétion du champ "Série".
     *
     * "async" est obligatoire ici car la fonction appelle getAdminBooks() avec await.
     * Une fonction qui utilise await doit elle-même être déclarée async.
     *
     * @returns {string[]} Tableau de noms de séries, triés alphabétiquement
     */
    async function collectSeries() {
        // On attend que l'API renvoie la liste des livres avant de continuer.
        const books = await getAdminBooks();
        const set = new Set();
        books.forEach((b) => {
            if (b.series && b.series.trim()) set.add(b.series.trim());
        });
        return Array.from(set).sort((a, b) =>
            a.localeCompare(b, "fr", { sensitivity: "base" }),
        );
    }

    /**
     * updateSeriesDatalist(): Regénère les options du datalist d'autocomplétion
     * pour le champ "Série" à partir des séries actuellement en base.
     * Appelée à l'ouverture de la modal pour avoir des données fraîches.
     */
    async function updateSeriesDatalist() {
        const datalist = document.getElementById("admin-series-datalist");
        if (!datalist) return;
        const series = await collectSeries();
        datalist.innerHTML = series
            .map((s) => `<option value="${escAttr(s)}">`)
            .join("");
    }

    // ========== RENDU DU TABLEAU ==========

    /**
     * renderTable(): Génère et injecte les lignes du tableau admin.
     * Sans filtre actif, le tableau reste vide et un message d'invite est affiché.
     * Réattache les listeners sur les boutons Modifier / Supprimer après rendu.
     *
     * @param {string} [filter] - Terme de recherche (optionnel). Si absent ou vide,
     *                            le tableau n'affiche rien (état "invite à chercher").
     */
    async function renderTable(filter) {
        const tbody = document.getElementById("admin-books-tbody");
        const noBooks = document.getElementById("admin-no-books");
        const prompt = document.getElementById("admin-search-prompt");
        if (!tbody) return;

        // Sans recherche active : vider le tableau et afficher le message d'invite
        if (!filter) {
            tbody.innerHTML = "";
            noBooks.style.display = "none";
            if (prompt) prompt.style.display = "";
            return;
        }

        // Une recherche est active : masquer l'invite
        if (prompt) prompt.style.display = "none";

        const q = filter.toLowerCase();

        // Correspondances langue: accepte "français"/"fr" et "anglais"/"en"
        const matchesLanguage = (lang) => {
            if (!lang) return false;
            if (lang === "fr") return q === "fr" || "français".startsWith(q);
            if (lang === "en")
                return (
                    q === "en" ||
                    "anglais".startsWith(q) ||
                    "english".startsWith(q)
                );
            return false;
        };

        // On attend la réponse de l'API avant de filtrer les résultats.
        // Sans "await", books serait une promesse non résolue, et .filter() planterait.
        let books = (await getAdminBooks()).filter(
            (b) =>
                (b.title || "").toLowerCase().includes(q) ||
                (b.author || "").toLowerCase().includes(q) ||
                (b.series || "").toLowerCase().includes(q) ||
                matchesLanguage(b.language) ||
                (b.genres || []).some((g) => g.toLowerCase().includes(q)),
        );

        if (books.length === 0) {
            tbody.innerHTML = "";
            noBooks.style.display = "";
            return;
        }
        noBooks.style.display = "none";

        tbody.innerHTML = books
            .map((b, idx) => {
                const genres = (b.genres || []).join(", ") || "—";
                // Affiche la durée pour les audios, le nombre de pages sinon
                const length =
                    b.format === "audio"
                        ? b.duration || "—"
                        : b.pages
                          ? b.pages + " p."
                          : "—";

                // Série + tome
                let seriesDisplay = "—";
                if (b.series && b.series.trim()) {
                    seriesDisplay = escHtml(b.series.trim());
                    if (b.book_number) {
                        seriesDisplay += ` <span style="color:#6b7280;font-size:.8rem;">T.${escHtml(String(b.book_number))}</span>`;
                    }
                }

                // Langue
                const languageDisplay =
                    b.language === "en"
                        ? '<span title="Anglais" style="font-size:1rem;">🇬🇧</span>'
                        : '<span title="Français" style="font-size:1rem;">🇫🇷</span>';

                return `
        <tr style="border-bottom:1px solid #f3f4f6;" data-book-idx="${b.id || idx}">
          <td style="padding:.6rem .8rem; font-weight:600;">${escHtml(b.title)}</td>
          <td style="padding:.6rem .8rem;">${escHtml(b.author)}</td>
          <td style="padding:.6rem .8rem; text-transform:capitalize;">${escHtml(b.format)}</td>
          <td style="padding:.6rem .8rem;">${escHtml(String(length))}</td>
          <td style="padding:.6rem .8rem; font-size:.82rem;">${escHtml(genres)}</td>
          <td style="padding:.6rem .8rem; font-size:.85rem;">${seriesDisplay}</td>
          <td style="padding:.6rem .8rem; text-align:center;">${languageDisplay}</td>
          <td style="padding:.6rem .8rem; text-align:center; white-space:nowrap;">
            <button class="btn btn-small admin-edit-btn"
              style="padding:.3rem .7rem; font-size:.8rem; margin-right:.3rem;"
              data-id="${b.id}" title="Modifier">
              <i data-lucide="pencil" style="width:13px;height:13px;vertical-align:middle;"></i>
              Modifier
            </button>
            <button class="btn btn-small admin-delete-btn"
              style="padding:.3rem .7rem; font-size:.8rem; background:#fee2e2; color:#b91c1c; border:none;"
              data-id="${b.id}" data-title="${escAttr(b.title)}" title="Supprimer">
              <i data-lucide="trash-2" style="width:13px;height:13px;vertical-align:middle;"></i>
              Supprimer
            </button>
          </td>
        </tr>`;
            })
            .join("");

        // Réinitialise les icônes Lucide sur les nouveaux éléments du DOM
        if (typeof lucide !== "undefined") lucide.createIcons();

        // Attache les listeners sur chaque bouton Modifier nouvellement créé
        document.querySelectorAll(".admin-edit-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                openEditModal(this.dataset.id);
            });
        });

        // Attache les listeners sur chaque bouton Supprimer nouvellement créé
        document.querySelectorAll(".admin-delete-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                openDeleteModal(this.dataset.id, this.dataset.title);
            });
        });
    }

    /**
     * escHtml(): Échappe les caractères spéciaux HTML pour sécuriser l'injection
     * de données utilisateur dans le DOM (prévention XSS).
     *
     * @param {*} str - Valeur à échapper (convertie en string)
     * @returns {string} Chaîne avec &, <, >, " remplacés par leurs entités HTML
     */
    function escHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    /**
     * escAttr(): Alias de escHtml() pour l'échappement dans les attributs HTML.
     *
     * @param {string} str
     * @returns {string}
     */
    function escAttr(str) {
        return escHtml(str);
    }

    // ========== GENRES CHECKBOXES ==========

    /**
     * renderGenreCheckboxes(): Génère les cases à cocher des genres dans la modal.
     * Pré-coche les genres passés en paramètre et limite la sélection à 3 maximum.
     *
     * @param {string[]} selected - Slugs des genres déjà sélectionnés (ex: édition)
     */
    function renderGenreCheckboxes(selected) {
        const container = document.getElementById("admin-genres-checkboxes");
        if (!container) return;
        const genreSlugs = collectGenres();

        // Résout le nom lisible depuis GENRES_LIST si disponible, sinon formate le slug
        const getGenreName = (slug) => {
            if (typeof GENRES_LIST !== "undefined") {
                const found = GENRES_LIST.find((g) => g.id === slug);
                if (found) return found.name;
            }
            return slug
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
        };

        // Détecte si un genre sélectionné est un texte libre (pas un slug connu)
        const knownSlugs =
            typeof GENRES_LIST !== "undefined"
                ? GENRES_LIST.map((g) => g.id)
                : [];
        const customGenre = (selected || []).find(
            (g) => !knownSlugs.includes(g),
        );
        const otherIsSelected =
            (selected || []).includes("other") || !!customGenre;

        container.innerHTML = genreSlugs
            .map(
                (g) => `
      <label class="radio-label" style="display:inline-flex; align-items:center; gap:.4rem; margin:.15rem .4rem;">
        <input type="checkbox" name="admin-genre" value="${escAttr(g)}"
          ${(selected || []).includes(g) || (g === "other" && otherIsSelected) ? "checked" : ""}>
        <span>${escHtml(getGenreName(g))}</span>
      </label>`,
            )
            .join("");

        // Champ texte libre pour "Autre" — affiché uniquement si "Autre" est coché
        const otherCustomInput = document.createElement("div");
        otherCustomInput.id = "admin-other-genre-wrap";
        otherCustomInput.style.cssText =
            "margin-top:.5rem; display:" + (otherIsSelected ? "block" : "none");
        otherCustomInput.innerHTML = `
      <label style="font-size:.83rem; color:#6b7280; display:block; margin-bottom:.25rem;">
        Précisez le genre&nbsp;<span style="color:red">*</span>
      </label>
      <input type="text" id="admin-other-genre-text" class="quick-search-input"
        placeholder="Ex : Conte philosophique, Uchronie…"
        style="padding:.45rem .7rem; font-size:.88rem; width:100%; box-sizing:border-box;"
        value="${escAttr(customGenre || "")}">
      <span id="error-other-genre" style="color:red;font-size:.78rem;display:none;"></span>`;
        container.appendChild(otherCustomInput);

        // Empêche de cocher plus de 3 genres simultanément
        container
            .querySelectorAll('input[name="admin-genre"]')
            .forEach((cb) => {
                cb.addEventListener("change", function () {
                    const checked = container.querySelectorAll(
                        'input[name="admin-genre"]:checked',
                    );
                    if (checked.length > 3) {
                        this.checked = false;
                        return;
                    }
                    // Affiche/masque le champ texte selon si "Autre" est coché
                    if (this.value === "other") {
                        otherCustomInput.style.display = this.checked
                            ? "block"
                            : "none";
                        if (!this.checked) {
                            const txt = document.getElementById(
                                "admin-other-genre-text",
                            );
                            if (txt) txt.value = "";
                        }
                    }
                });
            });
    }

    /**
     * getSelectedGenres(): Lit les genres cochés dans la modal.
     *
     * Cas particulier "Autre": si coché ET un texte libre est saisi,
     * retourne le texte libre à la place du slug "other".
     * Ainsi le texte est stocké directement dans genres[] et s'affiche
     * dans la modal de détail via formatGenreLabel() (app.js).
     *
     * @returns {string[]} Tableau des valeurs de genres sélectionnés
     */
    function getSelectedGenres() {
        const checked = Array.from(
            document.querySelectorAll(
                '#admin-genres-checkboxes input[name="admin-genre"]:checked',
            ),
        );
        return checked.map((cb) => {
            if (cb.value === "other") {
                const txt = document.getElementById("admin-other-genre-text");
                const custom = txt ? txt.value.trim() : "";
                // Si un texte est saisi, on stocke le texte libre ; sinon on garde "other"
                return custom || "other";
            }
            return cb.value;
        });
    }

    // ========== CHAMPS DYNAMIQUES FORMAT ==========

    /**
     * updateFormatFields(): Affiche ou masque les champs "pages" et "durée"
     * selon le format sélectionné dans le formulaire.
     * - format "audio"  → masque pages, affiche durée
     * - autres formats  → affiche pages, masque durée
     */
    function updateFormatFields() {
        const fmt = document.getElementById("admin-format").value;
        const pagesGroup = document.getElementById("admin-pages-group");
        const durationGroup = document.getElementById("admin-duration-group");
        if (fmt === "audio") {
            pagesGroup.style.display = "none";
            durationGroup.style.display = "flex";
        } else {
            pagesGroup.style.display = "flex";
            durationGroup.style.display = "none";
        }
    }

    // ========== MODAL AJOUTER / MODIFIER ==========

    /**
     * ID du livre en cours d'édition (book.id).
     * null si on est en mode création.
     *
     * @type {number|string|null}
     */
    let currentEditId = null;

    /**
     * openAddModal(): Réinitialise tous les champs du formulaire et ouvre
     * la modal en mode "création".
     */
    async function openAddModal() {
        currentEditId = null;
        document.getElementById("admin-modal-title").textContent =
            "Ajouter un livre";
        document.getElementById("admin-book-id").value = "";
        document.getElementById("admin-title").value = "";
        document.getElementById("admin-author").value = "";
        document.getElementById("admin-format").value = "";
        document.getElementById("admin-cover-color").value = "";
        document.getElementById("admin-pages").value = "";
        document.getElementById("admin-duration").value = "";
        document.getElementById("admin-summary").value = "";
        document.getElementById("admin-series").value = "";
        document.getElementById("admin-book-number").value = "";
        document.getElementById("admin-language").value = "fr";
        await updateSeriesDatalist();
        renderGenreCheckboxes([]);
        clearErrors();
        updateFormatFields();
        showModal("admin-book-modal");
    }

    /**
     * openEditModal(): Pré-remplit le formulaire avec les données du livre
     * sélectionné et ouvre la modal en mode "modification".
     *
     * @param {string} bookId - L'id du livre (book.id)
     */
    async function openEditModal(bookId) {
        const books = await getAdminBooks();
        const book = books.find((b) => String(b.id) === String(bookId));
        if (!book) return;
        currentEditId = book.id;
        document.getElementById("admin-modal-title").textContent =
            "Modifier un livre";
        document.getElementById("admin-book-id").value = book.id || idx;
        document.getElementById("admin-title").value = book.title || "";
        document.getElementById("admin-author").value = book.author || "";
        document.getElementById("admin-format").value = book.format || "";
        document.getElementById("admin-cover-color").value =
            book.cover_color || book.coverColor || "";
        document.getElementById("admin-pages").value = book.pages || "";
        document.getElementById("admin-duration").value = book.duration || "";
        document.getElementById("admin-summary").value = book.summary || "";
        document.getElementById("admin-series").value = book.series || "";
        document.getElementById("admin-book-number").value =
            book.book_number || "";
        document.getElementById("admin-language").value = book.language || "fr";
        await updateSeriesDatalist();
        renderGenreCheckboxes(book.genres || []);
        clearErrors();
        updateFormatFields();
        showModal("admin-book-modal");
    }

    // ========== VALIDATION ==========

    /**
     * clearErrors(): Vide et masque tous les messages d'erreur du formulaire.
     * Appelée avant chaque validation et à l'ouverture de la modal.
     */
    function clearErrors() {
        [
            "title",
            "author",
            "format",
            "cover-color",
            "pages",
            "duration",
            "summary",
            "genres",
            "book-number",
            "other-genre",
        ].forEach((f) => {
            const el = document.getElementById("error-" + f);
            if (el) {
                el.textContent = "";
                el.style.display = "none";
            }
        });
    }

    /**
     * showError(): Affiche un message d'erreur sous le champ concerné.
     *
     * @param {string} field - Suffixe de l'id de l'élément d'erreur (ex: "title" → #error-title)
     * @param {string} msg   - Message à afficher
     */
    function showError(field, msg) {
        const el = document.getElementById("error-" + field);
        if (el) {
            el.textContent = msg;
            el.style.display = "";
        }
    }

    /**
     * validateForm(): Vérifie que tous les champs obligatoires sont remplis.
     * Affiche les erreurs en ligne en cas d'échec.
     *
     * Champs obligatoires: titre, auteur, format, couleur de couverture,
     * résumé, et au moins un genre.
     * Champs optionnels: série, numéro de tome, langue (défaut: "fr").
     *
     * Règle de cohérence: si un numéro de tome est renseigné, la série doit l'être aussi.
     *
     * @returns {boolean} true si le formulaire est valide, false sinon
     */
    function validateForm() {
        clearErrors();
        let valid = true;
        const title = document.getElementById("admin-title").value.trim();
        const author = document.getElementById("admin-author").value.trim();
        const format = document.getElementById("admin-format").value;
        const coverColor = document.getElementById("admin-cover-color").value;
        const summary = document.getElementById("admin-summary").value.trim();
        const genres = getSelectedGenres();
        const series = document.getElementById("admin-series").value.trim();
        const bookNumber = document
            .getElementById("admin-book-number")
            .value.trim();

        if (!title) {
            showError("title", "Le titre est obligatoire.");
            valid = false;
        }
        if (!author) {
            showError("author", "L'auteur est obligatoire.");
            valid = false;
        }
        if (!format) {
            showError("format", "Choisissez un format.");
            valid = false;
        }
        if (!coverColor) {
            showError("cover-color", "Choisissez une couleur.");
            valid = false;
        }
        if (!summary) {
            showError("summary", "Le résumé est obligatoire.");
            valid = false;
        }
        if (genres.length === 0) {
            showError("genres", "Sélectionnez au moins un genre.");
            valid = false;
        }

        // Si "Autre" est coché, le texte libre est obligatoire
        const otherChecked = document.querySelector(
            '#admin-genres-checkboxes input[name="admin-genre"][value="other"]:checked',
        );
        if (otherChecked) {
            const otherTxt = document.getElementById("admin-other-genre-text");
            const errorEl = document.getElementById("error-other-genre");
            if (!otherTxt || !otherTxt.value.trim()) {
                if (errorEl) {
                    errorEl.textContent = "Précisez le genre.";
                    errorEl.style.display = "";
                }
                valid = false;
            }
        }

        // Cohérence série / tome : un tome sans série n'a pas de sens
        if (bookNumber && !series) {
            showError("book-number", "Renseignez aussi le nom de la série.");
            valid = false;
        }

        return valid;
    }

    // ========== ENREGISTREMENT ==========

    /**
     * saveBook(): Valide puis persiste le livre (création ou modification).
     * Ferme la modal et rafraîchit le tableau après enregistrement.
     *
     */
    async function saveBook() {
        if (!validateForm()) return;

        const format = document.getElementById("admin-format").value;
        const seriesVal = document.getElementById("admin-series").value.trim();
        const bookNumberVal =
            parseInt(
                document.getElementById("admin-book-number").value.trim(),
            ) || null;

        const bookData = {
            title: document.getElementById("admin-title").value.trim(),
            author: document.getElementById("admin-author").value.trim(),
            format: format,
            cover_color: document.getElementById("admin-cover-color").value,
            // pages uniquement pour les formats non-audio
            pages:
                format !== "audio"
                    ? parseInt(document.getElementById("admin-pages").value) ||
                      null
                    : null,
            // duration uniquement pour le format audio
            duration:
                format === "audio"
                    ? document.getElementById("admin-duration").value.trim() ||
                      null
                    : null,
            summary: document.getElementById("admin-summary").value.trim(),
            genres: getSelectedGenres(),
            // Série et tome (optionnels)
            series: seriesVal || null,
            book_number: seriesVal && bookNumberVal ? bookNumberVal : null,
            // Langue (défaut: "fr")
            language: document.getElementById("admin-language").value || "fr",
        };

        if (currentEditId === null) {
            // CRÉATION via l'API
            await createBook(bookData);
        } else {
            // MODIFICATION via l'API
            await updateBook(currentEditId, bookData);
        }

        hideModal("admin-book-modal");
        renderTable(document.getElementById("admin-search").value.trim());
    }

    // ========== MODAL SUPPRESSION ==========

    /**
     * ID du livre en attente de suppression (book.id).
     * null si aucune suppression n'est en cours.
     *
     * @type {number|string|null}
     */
    let deleteId = null;

    /**
     * openDeleteModal(): Affiche la modal de confirmation de suppression
     * en y injectant le titre du livre concerné.
     *
     * @param {string} bookId - L'id du livre (book.id)
     * @param {string} title  - Titre du livre (affiché dans le message de confirmation)
     */
    function openDeleteModal(bookId, title) {
        deleteId = bookId;
        document.getElementById("admin-delete-book-name").textContent = title;
        showModal("admin-delete-modal");
    }

    /**
     * confirmDelete(): Supprime le livre désigné par deleteId,
     * ferme la modal et rafraîchit le tableau.
     *
     */
    async function confirmDelete() {
        if (deleteId === null) return;
        await deleteBook(deleteId);
        hideModal("admin-delete-modal");
        deleteId = null;
        renderTable(document.getElementById("admin-search").value.trim());
    }

    // ========== HELPERS MODALS ==========

    /**
     * showModal(): Affiche une modal en ajoutant la classe CSS "show".
     *
     * @param {string} id - L'id de l'élément modal à afficher
     */
    function showModal(id) {
        const m = document.getElementById(id);
        if (m) m.classList.add("show");
    }

    /**
     * hideModal(): Masque une modal en retirant la classe CSS "show".
     *
     * @param {string} id - L'id de l'élément modal à masquer
     */
    function hideModal(id) {
        const m = document.getElementById(id);
        if (m) m.classList.remove("show");
    }

    // ========== INITIALISATION ==========

    /**
     * DOMContentLoaded: Point d'entrée principal.
     * Effectue le premier rendu du tableau et attache tous les listeners
     * sur les contrôles statiques de la page (boutons, champs de recherche, selects).
     *
     * Les listeners sur les boutons du tableau (Modifier / Supprimer) sont
     * rattachés dans renderTable() car ces éléments sont régénérés à chaque rendu.
     */
    document.addEventListener("DOMContentLoaded", function () {
        // Au chargement : tableau vide, message d'invite visible
        renderTable();

        // Bouton "Ajouter un livre" → ouvre la modal en mode création
        const addBtn = document.getElementById("admin-add-btn");
        if (addBtn) addBtn.addEventListener("click", openAddModal);

        // Champ de recherche → filtre le tableau en temps réel
        const searchInput = document.getElementById("admin-search");
        const clearBtn = document.getElementById("admin-clear-search");
        if (searchInput) {
            searchInput.addEventListener("input", function () {
                clearBtn.style.display = this.value ? "" : "none";
                renderTable(this.value.trim());
            });
        }
        // Bouton × → vide le champ et revient à l'état "invite à chercher"
        if (clearBtn) {
            clearBtn.addEventListener("click", function () {
                searchInput.value = "";
                this.style.display = "none";
                renderTable(); // pas de filtre → tableau vide + prompt
            });
        }

        // Select "Format" → met à jour la visibilité des champs pages / durée
        const fmtSelect = document.getElementById("admin-format");
        if (fmtSelect) fmtSelect.addEventListener("change", updateFormatFields);

        // Bouton "Enregistrer" de la modal livre
        const saveBtn = document.getElementById("admin-modal-save");
        if (saveBtn) saveBtn.addEventListener("click", saveBook);

        // Boutons "Annuler" et "×" de la modal livre
        ["admin-modal-cancel", "admin-modal-close"].forEach((id) => {
            const el = document.getElementById(id);
            if (el)
                el.addEventListener("click", () =>
                    hideModal("admin-book-modal"),
                );
        });

        // Bouton "Confirmer" de la modal de suppression
        const delConfirm = document.getElementById("admin-delete-confirm");
        if (delConfirm) delConfirm.addEventListener("click", confirmDelete);

        // Boutons "Annuler" et "×" de la modal de suppression
        ["admin-delete-cancel", "admin-delete-close"].forEach((id) => {
            const el = document.getElementById(id);
            if (el)
                el.addEventListener("click", () =>
                    hideModal("admin-delete-modal"),
                );
        });

        // Fermeture de n'importe quelle modal en cliquant sur l'overlay (fond sombre)
        document
            .querySelectorAll("#admin-book-modal, #admin-delete-modal")
            .forEach((modal) => {
                modal.addEventListener("click", function (e) {
                    if (e.target === this) hideModal(this.id);
                });
            });
    });
})();
