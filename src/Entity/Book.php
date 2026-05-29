<?php

namespace App\Entity;

// BookRepository : classe qui contient les requêtes personnalisées liées aux livres
use App\Repository\BookRepository;
// Types : constantes Doctrine pour les types SQL moins courants (ex: TEXT, DATE...)
use Doctrine\DBAL\Types\Types;
// ORM : annotations/attributs PHP qui font le lien entre la classe et la table MySQL
use Doctrine\ORM\Mapping as ORM;

// Déclare que cette classe est une entité Doctrine mappée à une table en base de données.
// repositoryClass lie cette entité à BookRepository pour les requêtes personnalisées.
#[ORM\Entity(repositoryClass: BookRepository::class)]
class Book
{
  // Clé primaire auto-incrémentée : Doctrine génère l'id automatiquement à l'insertion.
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

  // nullable: true → la colonne SQL accepte NULL (champ optionnel selon le format du livre).
  #[ORM\Column(nullable: true)]
  private ?int $pages = null;

  #[ORM\Column(length: 20, nullable: true)]
  private ?string $duration = null;

  // Type JSON : Doctrine convertit automatiquement le tableau PHP en JSON pour le stockage,
  // et le recharge comme tableau PHP à la lecture. Évite de créer une entité Genre séparée.
  #[ORM\Column(type: 'json')]
  private array $genres = [];

  // Types::TEXT → colonne TEXT en SQL (pas de limite de taille, contrairement à VARCHAR).
  #[ORM\Column(type: Types::TEXT)]
  private ?string $summary = null;

  #[ORM\Column(length: 50)]
  private ?string $coverColor = null;

  #[ORM\Column(length: 255, nullable: true)]
  private ?string $series = null;

  #[ORM\Column(nullable: true)]
  private ?int $bookNumber = null;

  #[ORM\Column(length: 5)]
  private ?string $language = null;

  // Le constructeur définit 'fr' comme langue par défaut.
  // Ainsi, si setLanguage() n'est pas appelé, la valeur est déjà correcte pour les livres francophones.
  public function __construct()
  {
    $this->language = 'fr';
  }

  // getId() n'a pas de setter car l'id est géré exclusivement par Doctrine (auto-incrémenté).
  public function getId(): ?int
  {
    return $this->id;
  }

  // Exemple de getter : retourne la valeur de la propriété privée $title.
  public function getTitle(): ?string
  {
    return $this->title;
  }

  // Exemple de setter : modifie $title et retourne $this pour permettre le chaînage (->setTitle()->setAuthor()...).
  // Le type de retour "static" désigne l'instance courante.
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

  // Le paramètre est typé "?int" (nullable) car pages peut être null pour les livres audio.
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
