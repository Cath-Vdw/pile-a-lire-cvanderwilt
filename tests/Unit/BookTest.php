<?php

namespace App\Tests\Unit;

use App\Entity\Book;
use PHPUnit\Framework\TestCase;

class BookTest extends TestCase
{
    // Vérifie que le constructeur initialise bien la langue à "fr"
    public function testDefaultLanguageIsFr(): void
    {
        $book = new Book();
        $this->assertSame('fr', $book->getLanguage());
    }

    // Vérifie que les getters retournent bien ce que les setters ont défini
    public function testSettersAndGetters(): void
    {
        $book = new Book();
        $book->setTitle('Dune');
        $book->setAuthor('Frank Herbert');
        $book->setFormat('papier');
        $book->setPages(688);
        $book->setGenres(['science-fiction', 'adventure']);
        $book->setSummary('Un roman de science-fiction.');
        $book->setCoverColor('genre-sf');
        $book->setLanguage('en');

        $this->assertSame('Dune', $book->getTitle());
        $this->assertSame('Frank Herbert', $book->getAuthor());
        $this->assertSame('papier', $book->getFormat());
        $this->assertSame(688, $book->getPages());
        $this->assertSame(['science-fiction', 'adventure'], $book->getGenres());
        $this->assertSame('Un roman de science-fiction.', $book->getSummary());
        $this->assertSame('genre-sf', $book->getCoverColor());
        $this->assertSame('en', $book->getLanguage());
    }

    // Vérifie que pages et duration acceptent null (champs optionnels)
    public function testNullableFields(): void
    {
        $book = new Book();
        $book->setPages(null);
        $book->setDuration(null);
        $book->setSeries(null);
        $book->setBookNumber(null);

        $this->assertNull($book->getPages());
        $this->assertNull($book->getDuration());
        $this->assertNull($book->getSeries());
        $this->assertNull($book->getBookNumber());
    }

    // Vérifie que genres est bien un tableau vide par défaut
    public function testGenresDefaultIsEmptyArray(): void
    {
        $book = new Book();
        $this->assertIsArray($book->getGenres());
        $this->assertEmpty($book->getGenres());
    }

    // Vérifie le chaînage des setters (chaque setter retourne $this)
    public function testSetterChaining(): void
    {
        $book = new Book();
        $result = $book->setTitle('Test')->setAuthor('Auteur')->setFormat('ebook');
        $this->assertSame($book, $result);
    }

    // Vérifie les champs série et tome
    public function testSeriesAndBookNumber(): void
    {
        $book = new Book();
        $book->setSeries('Le Seigneur des Anneaux');
        $book->setBookNumber(1);

        $this->assertSame('Le Seigneur des Anneaux', $book->getSeries());
        $this->assertSame(1, $book->getBookNumber());
    }

    // Vérifie le champ duration pour les audiobooks
    public function testDuration(): void
    {
        $book = new Book();
        $book->setDuration('11h 30m');
        $this->assertSame('11h 30m', $book->getDuration());
    }
}