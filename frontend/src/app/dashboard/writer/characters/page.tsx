'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CharacterForm } from '@/components/writer/character-form';
import { CharacterCard } from '@/components/writer/character-card';
import { useCharacters } from '@/hooks/useCharacters';
import { useBooks } from '@/hooks/useBooks';
import { Character, CharacterCreate, CharacterUpdate } from '@/types/character';
import { useSession } from 'next-auth/react';
import { Plus, Users } from 'lucide-react';

export default function CharactersPage() {
  const { data: session } = useSession();
  
  const {
    characters,
    loading,
    error,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    uploadCharacterImage,
    associateCharacterWithBook,
  } = useCharacters();

  const { books } = useBooks({ 
    author_id: session?.user?.id,
    is_published: undefined // Show both published and unpublished books for the author
  });

  const [showForm, setShowForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  const handleSubmitCharacter = async (data: CharacterCreate | CharacterUpdate, imageFile?: File, bookId?: string) => {
    if (editingCharacter) {
      // Update existing character
      const updatedCharacter = await updateCharacter(editingCharacter.id, data as CharacterUpdate);
      if (updatedCharacter && imageFile) {
        // Upload image if provided
        await uploadCharacterImage(updatedCharacter.id, imageFile);
      }
      if (updatedCharacter) {
        setEditingCharacter(null);
        setShowForm(false);
      }
    } else {
      // Create new character
      const newCharacter = await createCharacter(data as CharacterCreate);
      if (newCharacter) {
        // Upload image if provided
        if (imageFile) {
          await uploadCharacterImage(newCharacter.id, imageFile);
        }
        
        // Associate with book if selected
        if (bookId) {
          await associateCharacterWithBook(newCharacter.id, bookId);
        }
        
        setShowForm(false);
      }
    }
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setShowForm(true);
  };

  const handleDeleteCharacter = async (characterId: string) => {
    await deleteCharacter(characterId);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCharacter(null);
  };

  if (showForm) {
    return (
      <div className="container mx-auto py-6">
        <CharacterForm
          character={editingCharacter || undefined}
          books={books}
          onSubmit={handleSubmitCharacter}
          onCancel={handleCancelForm}
          isLoading={loading}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Character Management</h1>
            <p className="text-muted-foreground">
              Create and manage your story characters
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Character
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && characters.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading characters...</p>
          </div>
        </div>
      ) : characters.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Characters Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first character to bring your stories to life
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Character
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onEdit={handleEditCharacter}
              onDelete={handleDeleteCharacter}
            />
          ))}
        </div>
      )}
    </div>
  );
}