<?php

namespace App\Controller;

use App\Repository\BookRepository;
// AbstractController : classe de base Symfony qui donne accès aux helpers (render, redirectToRoute, etc.)
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
// Response : objet retourné par chaque action pour envoyer une réponse HTTP au navigateur
use Symfony\Component\HttpFoundation\Response;
// Route : attribut PHP qui associe une URL à une méthode du contrôleur
use Symfony\Component\Routing\Attribute\Route;

class BookController extends AbstractController
{
  // Liste fixe des genres disponibles sur le site.
  // Chaque entrée a un 'id' (utilisé en interne) et un 'name' (affiché à l'écran).
  // Définie comme constante de classe car elle ne change pas selon les requêtes.
  private const GENRES_LIST = [
    ['id' => 'adventure',          'name' => 'Aventure'],
    ['id' => 'graphic-novel',      'name' => 'BD/manga'],
    ['id' => 'classic-literature', 'name' => 'Littérature Classique'],
    ['id' => 'drama',              'name' => 'Drame'],
    ['id' => 'fantasy',            'name' => 'Fantasy'],
    ['id' => 'historical',         'name' => 'Historique'],
    ['id' => 'horror',             'name' => 'Horreur'],
    ['id' => 'humour',             'name' => 'Humour'],
    ['id' => 'youth',              'name' => 'Jeunesse'],
    ['id' => 'non-fiction',        'name' => 'Non-Fiction'],
    ['id' => 'supernatural',       'name' => 'Surnaturel'],
    ['id' => 'mystery',            'name' => 'Policier'],
    ['id' => 'romance',            'name' => 'Romance'],
    ['id' => 'science-fiction',    'name' => 'Science-Fiction'],
    ['id' => 'thriller',           'name' => 'Thriller'],
    ['id' => 'other',              'name' => 'Autres'],
  ];

  // Action liée à l'URL "/" (page d'accueil).
  // BookRepository est injecté automatiquement par Symfony (injection de dépendances).
  #[Route('/', name: 'app_home')]
  public function index(BookRepository $bookRepository): Response
  {
    // Récupère tous les livres depuis la base de données sous forme d'objets PHP (entités Doctrine).
    $books = $bookRepository->findAll();

    // Transforme chaque entité Book en tableau associatif simple.
    // Nécessaire car json_encode() ne sait pas sérialiser directement un objet Doctrine.
    // Les clés doivent correspondre à celles attendues par app.js côté JavaScript.
    $booksData = array_map(fn($book) => [
      'id'          => $book->getId(),
      'title'       => $book->getTitle(),
      'author'      => $book->getAuthor(),
      'format'      => $book->getFormat(),       // ex: "papier", "ebook", "audio"
      'pages'       => $book->getPages(),        // null si format audio
      'duration'    => $book->getDuration(),     // null si format papier/ebook
      'genres'      => $book->getGenres(),       // tableau de slugs (ex: ["fantasy", "adventure"])
      'summary'     => $book->getSummary(),
      'cover_color' => $book->getCoverColor(),   // couleur de fond si pas de couverture image
      'series'      => $book->getSeries(),       // nom de la série, ou null si livre indépendant
      'book_number' => $book->getBookNumber(),   // numéro dans la série, ou null
      'language'    => $book->getLanguage(),
    ], $books);

    // Récupère les statistiques globales (nombre de livres, pages totales, etc.).
    $stats = $bookRepository->getStatistics();

    // Envoie les données au template Twig books/index.html.twig.
    // - books_json  : livres encodés en JSON, injectés dans le HTML pour être lus par app.js
    // - genres_list : liste des genres pour générer les filtres Twig (ex: _search.html.twig)
    // - genres_json : même liste encodée en JSON, injectée dans le HTML pour être lue par admin.js
    // - stats       : statistiques affichées dans le tableau de bord
    return $this->render('books/index.html.twig', [
      // JSON_THROW_ON_ERROR : lève une exception si l'encodage échoue (plutôt que retourner false silencieusement)
      'books_json'  => json_encode($booksData, JSON_THROW_ON_ERROR),
      'genres_list' => self::GENRES_LIST,
      'genres_json' => json_encode(self::GENRES_LIST, JSON_THROW_ON_ERROR),
      'stats'       => $stats,
    ]);
  }
}
