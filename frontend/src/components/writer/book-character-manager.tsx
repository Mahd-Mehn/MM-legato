'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useCharacters } from '@/hooks/useCharacters';
import { Character } from '@/types/character';
import { CharacterDetailModal } from './character-detail-modal';
import { Users, Plus, Minus, Eye, User } from 'lucide-react';

interface BookCharacterManagerProps {
  bookId: string;
  bookTitle: string;
}

export function BookCharacterManager({ bookId, bookTitle }: BookCharacterManagerProps) {
  const {
    characters,
    loading,
    error,
    associateCharacterWithBook,
    removeCharacterFromBook,
    getCharactersByBook,
  } = useCharacters();

  const [bookCharacters, setBookCharacters] = useState<Character[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set());
  const [selectedCharacterForModal, setSelectedCharacterForModal] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadBookCharacters = async () => {
      const chars = await getCharactersByBook(bookId);
      setBookCharacters(chars);
      setSelectedCharacters(new Set(chars.map(c => c.id)));
    };
    
    loadBookCharacters();
  }, [bookId, getCharactersByBook]);

  const handleCharacterToggle = async (characterId: string, isSelected: boolean) => {
    if (isSelected) {
      const success = await associateCharacterWithBook(characterId, bookId);
      if (success) {
        setSelectedCharacters(prev => new Set([...prev, characterId]));
        const character = characters.find(c => c.id === characterId);
        if (character) {
          setBookCharacters(prev => [...prev, character]);
        }
      }
    } else {
      const success = await removeCharacterFromBook(characterId, bookId);
      if (success) {
        setSelectedCharacters(prev => {
          const newSet = new Set(prev);
          newSet.delete(characterId);
          return newSet;
        });
        setBookCharacters(prev => prev.filter(c => c.id !== characterId));
      }
    }
  };

  const availableCharacters = characters.filter(c => !selectedCharacters.has(c.id));

  const handleViewCharacter = (character: Character) => {
    setSelectedCharacterForModal(character);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCharacterForModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6" />
        <div>
          <h2 className="text-xl font-semibold">Characters in "{bookTitle}"</h2>
          <p className="text-muted-foreground">
            Manage which characters appear in this book
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Book Characters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Book Characters ({bookCharacters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookCharacters.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No characters assigned to this book yet
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookCharacters.map((character) => (
                <div
                  key={character.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Character Avatar */}
                  <div className="flex-shrink-0">
                    {character.image_url ? (
                      <img
                        src={character.image_url}
                        alt={character.name}
                        className="w-10 h-10 rounded-full object-cover cursor-pointer"
                        onClick={() => handleViewCharacter(character)}
                      />
                    ) : (
                      <div 
                        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center cursor-pointer"
                        onClick={() => handleViewCharacter(character)}
                      >
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Character Info */}
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleViewCharacter(character)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{character.name}</span>
                      {character.title && (
                        <Badge variant="secondary" className="text-xs">
                          {character.title}
                        </Badge>
                      )}
                    </div>
                    {character.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {character.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewCharacter(character)}
                      title="View character details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCharacterToggle(character.id, false)}
                      disabled={loading}
                      title="Remove from book"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Characters to Add */}
      {availableCharacters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Available Characters ({availableCharacters.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableCharacters.map((character) => (
                <div
                  key={character.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Character Avatar */}
                  <div className="flex-shrink-0">
                    {character.image_url ? (
                      <img
                        src={character.image_url}
                        alt={character.name}
                        className="w-10 h-10 rounded-full object-cover cursor-pointer"
                        onClick={() => handleViewCharacter(character)}
                      />
                    ) : (
                      <div 
                        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center cursor-pointer"
                        onClick={() => handleViewCharacter(character)}
                      >
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Character Info */}
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleViewCharacter(character)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{character.name}</span>
                      {character.title && (
                        <Badge variant="secondary" className="text-xs">
                          {character.title}
                        </Badge>
                      )}
                    </div>
                    {character.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {character.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewCharacter(character)}
                      title="View character details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCharacterToggle(character.id, true)}
                      disabled={loading}
                      title="Add to book"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {characters.length === 0 && !loading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Characters Created</h3>
              <p className="text-muted-foreground">
                Create some characters first to add them to your books
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Character Detail Modal */}
      <CharacterDetailModal
        character={selectedCharacterForModal}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}