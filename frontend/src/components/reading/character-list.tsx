'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CharacterProfile } from './character-profile';
import { useCharacters } from '@/hooks/useCharacters';
import { Character } from '@/types/character';
import { Users } from 'lucide-react';

interface CharacterListProps {
  bookId: string;
  compact?: boolean;
}

export function CharacterList({ bookId, compact = false }: CharacterListProps) {
  const { getCharactersByBook, loading, error } = useCharacters();
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    const loadCharacters = async () => {
      const bookCharacters = await getCharactersByBook(bookId);
      setCharacters(bookCharacters);
    };
    
    loadCharacters();
  }, [bookId, getCharactersByBook]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading characters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (characters.length === 0) {
    return null; // Don't show anything if no characters
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Characters ({characters.length})</span>
        </div>
        <div className="space-y-2">
          {characters.map((character) => (
            <CharacterProfile
              key={character.id}
              character={character}
              compact={true}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Characters ({characters.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((character) => (
            <CharacterProfile
              key={character.id}
              character={character}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}