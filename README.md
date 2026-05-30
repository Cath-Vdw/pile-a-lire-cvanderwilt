# La Pile à Lire — C. Vanderwilt

Migration du site "La Pile à Lire" vers Symfony 7.4 avec MySQL.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- PHP ≥ 8.2
- Composer
- Symfony CLI
- MySQL / MariaDB (ou XAMPP)
- Git

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Cath-Vdw/pile-a-lire-cvanderwilt.git
cd pile-a-lire-cvanderwilt
```

### 2. Installer les dépendances PHP

```bash
composer install
```

### 3. Configurer la base de données

Copiez le fichier d'environnement :

```bash
cp .env .env.local
```

Ouvrez `.env.local` et ajustez la ligne `DATABASE_URL` selon votre configuration MySQL locale. Par exemple avec XAMPP sans mot de passe :

```
DATABASE_URL="mysql://root@127.0.0.1:3306/pile_a_lire_cvanderwilt?serverVersion=10.4&charset=utf8mb4"
```

Ou avec un mot de passe :

```
DATABASE_URL="mysql://root:votre_mot_de_passe@127.0.0.1:3306/pile_a_lire_cvanderwilt?serverVersion=10.4&charset=utf8mb4"
```

### 4. Créer la base de données et importer le dump

```bash
php bin/console doctrine:database:create
mysql -u root pile_a_lire_cvanderwilt < dump.sql
```

> Si MySQL nécessite un mot de passe : `mysql -u root -p pile_a_lire_cvanderwilt < dump.sql`

### 5. Lancer le serveur

```bash
symfony serve --no-tls
```

Ouvrez votre navigateur à l'adresse : **http://localhost:8000**

---

## Accès admin

La section d'administration (ajout, modification, suppression de livres) est accessible directement depuis la page principale — aucune authentification requise pour l'instant.

> **Version ultérieure :** un système de login avec compte administrateur et compte utilisateur sera ajouté dans une prochaine version.

---

## Structure du projet

```
pile-a-lire-cvanderwilt/
├── public/
│   ├── css/app.css          ← styles
│   ├── js/
│   │   ├── app.js           ← logique principale
│   │   ├── admin.js         ← gestion admin (connecté à l'API Symfony)
│   │   └── storage.js       ← PAL personnelle (localStorage)
│   └── images/
├── src/
│   ├── Controller/
│   │   ├── BookController.php       ← route principale /
│   │   └── AdminBookController.php  ← API CRUD /api/admin/books
│   ├── Entity/
│   │   └── Book.php
│   └── DataFixtures/
│       └── BookFixtures.php
├── templates/
│   ├── base.html.twig
│   └── books/               ← partiels Twig
├── dump.sql                 ← base de données complète (livres)
└── .env                     ← configuration (à adapter via .env.local)
```

---

## Commandes utiles

```bash
# Vider le cache
php bin/console cache:clear

# Voir toutes les routes
php bin/console debug:router

# Relancer les migrations si nécessaire
php bin/console doctrine:migrations:migrate
```
