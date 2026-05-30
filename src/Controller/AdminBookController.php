<?php

namespace App\Controller;

use App\Entity\Book;
use App\Repository\BookRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin/books', name: 'api_admin_books_')]
// Ce contrôleur gère les opérations CRUD pour les livres via la min API admin
// installée à la place d'EasyAdmin. Les routes sont protégées par un firewall admin dans security.yaml.
class AdminBookController extends AbstractController
{
    // GET /api/admin/books — retourne tous les livres en JSON
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(BookRepository $repo): JsonResponse
    {
        $books = $repo->findAll();
        $data  = array_map(fn($b) => $this->serialize($b), $books);
        return $this->json($data);
    }

    // POST /api/admin/books — crée un nouveau livre
    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['title'])) {
            return $this->json(['error' => 'Le titre est obligatoire.'], 400);
        }

        $book = $this->hydrate(new Book(), $data);
        $em->persist($book);
        $em->flush();
        return $this->json($this->serialize($book), 201);
    }

    // PUT /api/admin/books/{id} — modifie un livre existant
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(Book $book, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $this->hydrate($book, $data);
        $em->flush();
        return $this->json($this->serialize($book));
    }

    // DELETE /api/admin/books/{id} — supprime un livre
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(Book $book, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($book);
        $em->flush();
        return $this->json(null, 204);
    }

    // Convertit une entité Book en tableau simple pour le JSON
    private function serialize(Book $b): array
    {
        return [
            'id'          => $b->getId(),
            'title'       => $b->getTitle(),
            'author'      => $b->getAuthor(),
            'format'      => $b->getFormat(),
            'pages'       => $b->getPages(),
            'duration'    => $b->getDuration(),
            'genres'      => $b->getGenres(),
            'summary'     => $b->getSummary(),
            'cover_color' => $b->getCoverColor(),
            'series'      => $b->getSeries(),
            'book_number' => $b->getBookNumber(),
            'language'    => $b->getLanguage(),
        ];
    }

    // Remplit une entité Book depuis un tableau de données
    private function hydrate(Book $book, array $data): Book
    {
        $book->setTitle($data['title'] ?? '');
        $book->setAuthor($data['author'] ?? '');
        $book->setFormat($data['format'] ?? 'papier');
        $book->setPages(isset($data['pages']) ? (int)$data['pages'] : null);
        $book->setDuration($data['duration'] ?? null);
        $book->setGenres($data['genres'] ?? []);
        $book->setSummary($data['summary'] ?? '');
        $book->setCoverColor($data['cover_color'] ?? '');
        $book->setSeries($data['series'] ?? null);
        $book->setBookNumber(isset($data['book_number']) ? (int)$data['book_number'] : null);
        $book->setLanguage($data['language'] ?? 'fr');
        return $book;
    }
}