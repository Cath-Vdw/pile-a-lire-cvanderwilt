<?php

namespace App\Controller;

use App\Repository\BookRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class BookController extends AbstractController
{
    /**
     * Page principale : affiche le site complet.
     *
     * Symfony charge tous les livres depuis MySQL, les convertit en JSON,
     * et les passe au template Twig. Le template les injecte dans le HTML
     * sous forme de variable JavaScript. 
     * Le JavaScript (app.js) peut ensuite accéder à cette variable pour afficher les livres dynamiquement. 
     */
    #[Route('/', name: 'app_home')]
    public function index(BookRepository $bookRepository): Response
    {
        $books = $bookRepository->findAll();

        // Convertit les entités PHP en tableaux simples pour le JSON.
        // Les clés correspondent exactement à celles attendues par app.js.
        $booksData = array_map(fn($book) => [
            'id'          => $book->getId(),
            'title'       => $book->getTitle(),
            'author'      => $book->getAuthor(),
            'format'      => $book->getFormat(),
            'pages'       => $book->getPages(),
            'duration'    => $book->getDuration(),
            'genres'      => $book->getGenres(),
            'summary'     => $book->getSummary(),
            'cover_color' => $book->getCoverColor(),
            'series'      => $book->getSeries(),
            'book_number' => $book->getBookNumber(),
            'language'    => $book->getLanguage(),
        ], $books);

        return $this->render('book/index.html.twig', [
            'books_json' => json_encode($booksData, JSON_THROW_ON_ERROR),
            //  Books_json est une variable Twig qui contient une chaîne JSON représentant tous les livres.
            // json_encode convertit le tableau PHP contenant tous les livres en une chaîne JSON. JSON_THROW_ON_ERROR est une option qui fait que json_encode lance une exception en cas d'erreur, ce qui est utile pour le débogage. 
            
        ]);
    }
}
