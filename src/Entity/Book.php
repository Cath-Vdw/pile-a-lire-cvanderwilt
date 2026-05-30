<?php

namespace App\Entity;

// BookRepository : contient les requêtes personnalisées associées à cette entité
use App\Repository\BookRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

// Entité Doctrine mappée à la table "book".
// repositoryClass lie cette entité à BookRepository pour les requêtes personnalisées.
#[ORM\Entity(repositoryClass: BookRepository::class)]
// Les setters retournent static pour permettre le chaînage : $book->setTitle('...')->setAuthor('...')
class Book
{
  // Clé primaire auto-incrémentée : l'id est géré exclusivement par Doctrine, pas de setter.
  #[ORM\Id]
  #[ORM\GeneratedValue]
  #[ORM\Column]
  private ?int $id = null;

  // Champs scalaires simples — length définit la taille max de la colonne VARCHAR en SQL.
  #[ORM\Column(length: 255)]
  private ?string $title = null;

  #[ORM\Column(length: 255)]
  private ?string $author = null;

  #[ORM\Column(length: 20)]
  private ?string $format = null;

  // nullable: true → null pour les livres audio (pas de pagination)
  #[ORM\Column(nullable: true)]
  private ?int $pages = null;

  // nullable: true → null pour les livres papier et ebook (pas de durée)
  #[ORM\Column(length: 20, nullable: true)]
  private ?string $duration = null;

  // Type JSON : Doctrine sérialise/désérialise automatiquement le tableau PHP.
  // Évite de créer une entité Genre séparée pour une simple liste de slugs.
  #[ORM\Column(type: 'json')]
  private array $genres = [];

  // Types::TEXT → colonne TEXT en SQL, sans limite de taille (contrairement à VARCHAR).
  #[ORM\Column(type: Types::TEXT)]
  private ?string $summary = null;

  #[ORM\Column(length: 50)]
  private ?string $coverColor = null;

  // nullable: true → null si le livre est indépendant (pas de série)
  #[ORM\Column(length: 255, nullable: true)]
  private ?string $series = null;

  // nullable: true → null si le livre est indépendant (pas de numéro de tome)
  #[ORM\Column(nullable: true)]
  private ?int $bookNumber = null;

  #[ORM\Column(length: 5)]
  private ?string $language = null;

  // Langue par défaut : 'fr'. setLanguage() reste disponible pour les livres en anglais ou autres.
  public function __construct()
  {
    $this->language = 'fr';
  }

  public function getId(): ?int
  {
    return $this->id;
  }

  public function getTitle(): ?string
  {
    return $this->title;
  }

  public function setTitle(string $title): static
  {
    $this->title = $title;

    return $this;
  }

  public function getAuthor(): ?string
  {
    return $this->author;
  }

  public function setAuthor(string $author): static
  {
    $this->author = $author;

    return $this;
  }

  public function getFormat(): ?string
  {
    return $this->format;
  }

  public function setFormat(string $format): static
  {
    $this->format = $format;

    return $this;
  }

  public function getPages(): ?int
  {
    return $this->pages;
  }

  public function setPages(?int $pages): static
  {
    $this->pages = $pages;

    return $this;
  }

  public function getDuration(): ?string
  {
    return $this->duration;
  }

  public function setDuration(?string $duration): static
  {
    $this->duration = $duration;

    return $this;
  }

  public function getGenres(): array
  {
    return $this->genres;
  }

  public function setGenres(array $genres): static
  {
    $this->genres = $genres;

    return $this;
  }

  public function getSummary(): ?string
  {
    return $this->summary;
  }

  public function setSummary(string $summary): static
  {
    $this->summary = $summary;

    return $this;
  }

  public function getCoverColor(): ?string
  {
    return $this->coverColor;
  }

  public function setCoverColor(string $coverColor): static
  {
    $this->coverColor = $coverColor;

    return $this;
  }

  public function getSeries(): ?string
  {
    return $this->series;
  }

  public function setSeries(?string $series): static
  {
    $this->series = $series;

    return $this;
  }

  public function getBookNumber(): ?int
  {
    return $this->bookNumber;
  }

  public function setBookNumber(?int $bookNumber): static
  {
    $this->bookNumber = $bookNumber;

    return $this;
  }

  public function getLanguage(): ?string
  {
    return $this->language;
  }

  public function setLanguage(string $language): static
  {
    $this->language = $language;

    return $this;
  }
}
