<?php

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AdminBookControllerTest extends WebTestCase
{
    // Vérifie que GET /api/admin/books retourne bien du JSON avec un code 200
    public function testListReturnsJson(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/admin/books');

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/json');

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
    }

    // Vérifie qu'on peut créer un livre via POST
    public function testCreateBook(): void
    {
        $client = static::createClient();
        $client->request(
            'POST',
            '/api/admin/books',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'title'       => 'Livre de test PHPUnit',
                'author'      => 'Auteur Test',
                'format'      => 'papier',
                'pages'       => 100,
                'genres'      => ['fantasy'],
                'summary'     => 'Un résumé de test.',
                'cover_color' => 'genre-fantasy',
                'language'    => 'fr',
            ])
        );

        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('Livre de test PHPUnit', $data['title']);
        $this->assertArrayHasKey('id', $data);
    }

    // Vérifie qu'une création sans titre retourne une erreur 400
    public function testCreateBookWithoutTitleReturns400(): void
    {
        $client = static::createClient();
        $client->request(
            'POST',
            '/api/admin/books',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['author' => 'Auteur sans titre'])
        );

        $this->assertResponseStatusCodeSame(400);
    }

    // Vérifie qu'on peut modifier un livre existant via PUT
    public function testUpdateBook(): void
    {
        $client = static::createClient();

        // 1. Création du livre
        $client->request(
            'POST',
            '/api/admin/books',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'title'       => 'Titre original',
                'author'      => 'Auteur',
                'format'      => 'ebook',
                'genres'      => ['thriller'],
                'summary'     => 'Résumé.',
                'cover_color' => 'genre-thriller',
                'language'    => 'fr',
            ])
        );
        $created = json_decode($client->getResponse()->getContent(), true);
        $id = $created['id'];

        // 2. Modification du titre
        $client->request(
            'PUT',
            '/api/admin/books/' . $id,
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'title'       => 'Titre modifié',
                'author'      => 'Auteur',
                'format'      => 'ebook',
                'genres'      => ['thriller'],
                'summary'     => 'Résumé.',
                'cover_color' => 'genre-thriller',
                'language'    => 'fr',
            ])
        );

        $this->assertResponseIsSuccessful();
        $updated = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('Titre modifié', $updated['title']);
    }

    // Vérifie qu'on peut supprimer un livre via DELETE
    public function testDeleteBook(): void
    {
        $client = static::createClient();

        // 1. Création du livre
        $client->request(
            'POST',
            '/api/admin/books',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'title'       => 'Livre à supprimer',
                'author'      => 'Auteur',
                'format'      => 'papier',
                'genres'      => ['humour'],
                'summary'     => 'Résumé.',
                'cover_color' => 'genre-humour',
                'language'    => 'fr',
            ])
        );
        $created = json_decode($client->getResponse()->getContent(), true);
        $id = $created['id'];

        // 2. Suppression
        $client->request('DELETE', '/api/admin/books/' . $id);
        $this->assertResponseStatusCodeSame(204);

        // 3. Vérification que le livre n'existe plus
        $client->request('GET', '/api/admin/books');
        $books = json_decode($client->getResponse()->getContent(), true);
        $ids = array_column($books, 'id');
        $this->assertNotContains($id, $ids);
    }
}