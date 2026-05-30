<?php

namespace App\Repository;

use App\Entity\Book;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Repository lié à l'entité Book.
 * Contient les requêtes personnalisées en plus des méthodes héritées de Doctrine.
 *
 * @extends ServiceEntityRepository<Book>
 */
class BookRepository extends ServiceEntityRepository
{
  // Boilerplate requis par Symfony : lie ce repository à l'entité Book.
  // Sans ça, Doctrine ne sait pas quelle table gérer.
  public function __construct(ManagerRegistry $registry)
  {
    parent::__construct($registry, Book::class);
  }

  /**
   * Calcule des statistiques globales sur l'ensemble des livres.
   * Retourne : nombre total, moyenne de pages, genres uniques, nombre de formats distincts.
   */
  public function getStatistics(): array
  {
    $books = $this->findAll();

    $allGenres = [];
    $totalPages = 0;
    $formats = [];

    foreach ($books as $book) {
      // getGenres() retourne un tableau PHP (Doctrine désérialise automatiquement le JSON stocké en BDD).
      foreach ($book->getGenres() as $genre) {
        $allGenres[$genre] = true; // utiliser le genre comme clé dédoublonne automatiquement
      }

      if ($book->getPages()) {
        $totalPages += $book->getPages();
      }

      $formats[$book->getFormat()] = true; // même technique de dédoublonnage par clé
    }

    $count = count($books);

    return [
      'totalBooks'   => $count,
      'avgPages'     => $count > 0 ? (int) ($totalPages / $count) : 0, // évite la division par zéro
      'uniqueGenres' => count($allGenres),
      'formats'      => count($formats),
    ];
  }

  /**
   * Retourne les livres correspondant aux filtres choisis par l'utilisateur.
   *
   * Les filtres format, longueur et mot-clé sont appliqués en SQL via le QueryBuilder.
   * Les filtres genres et durée audio sont appliqués en PHP après la requête,
   * car filtrer du JSON ou parser une chaîne "Xh Ym" est plus simple hors SQL.
   */
  public function findFiltered(string $format, string $length, array $genres, string $keyword): array
  {
    // createQueryBuilder('b') crée une requête SELECT sur la table book avec l'alias "b"
    $qb = $this->createQueryBuilder('b');

    // Filtre FORMAT : si "all", aucune condition n'est ajoutée (tous les formats)
    if ($format !== 'all') {
      $qb->andWhere('b.format = :format')
        ->setParameter('format', $format);
    }

    // Filtre LONGUEUR par pages (ignoré pour les audios, gérés séparément plus bas)
    if ($length !== 'all' && $format !== 'audio') {
      match ($length) {
        'comic'  => $qb->andWhere('b.pages < 100'),
        'short'  => $qb->andWhere('b.pages >= 100 AND b.pages < 300'),
        'medium' => $qb->andWhere('b.pages >= 300 AND b.pages <= 500'),
        'long'   => $qb->andWhere('b.pages > 500'),
        default  => null,
      };
    }

    // Filtre MOT-CLÉ : recherche insensible à la casse dans le titre et l'auteur.
    // LOWER() + strtolower() normalisent les deux côtés pour ignorer la casse.
    // orX() combine les deux conditions avec un OR.
    if ($keyword !== '') {
      $qb->andWhere(
        $qb->expr()->orX(
          $qb->expr()->like('LOWER(b.title)',  ':kw'),
          $qb->expr()->like('LOWER(b.author)', ':kw'),
        )
      )->setParameter('kw', '%' . strtolower($keyword) . '%');
    }

    $books = $qb->getQuery()->getResult();

    // Filtre GENRES en PHP : vérifie que chaque genre sélectionné est présent dans le tableau du livre.
    // Impossible à faire proprement en SQL car genres est stocké en JSON.
    if (!empty($genres)) {
      $books = array_filter($books, function ($book) use ($genres) {
        foreach ($genres as $genre) {
          if (!in_array($genre, $book->getGenres())) {
            return false;
          }
        }
        return true;
      });
    }

    // Filtre DURÉE AUDIO en PHP : parse la chaîne "Xh Ym" en heures décimales
    // puis applique les mêmes tranches (short/medium/long) que pour les pages.
    if ($length !== 'all' && $format === 'audio') {
      $books = array_filter($books, function ($book) use ($length) {
        preg_match('/(\d+)h\s*(\d+)?m/', $book->getDuration() ?? '', $matches);
        if (!$matches) return true;
        $hours = (int)$matches[1] + ((int)($matches[2] ?? 0)) / 60;
        return match ($length) {
          'short'  => $hours < 6,
          'medium' => $hours >= 6 && $hours <= 12,
          'long'   => $hours > 12,
          default  => true,
        };
      });
    }

    // array_values() réindexe le tableau (array_filter conserve les clés d'origine)
    return array_values($books);
  }
}
