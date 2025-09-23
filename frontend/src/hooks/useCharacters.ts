import { useState, useEffect, useCallback } from 'react';
import { characterAPI } from '@/lib/api';
import { Character, CharacterCreate, CharacterUpdate } from '@/types/character';

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCharacters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await characterAPI.getCharacters();
      setCharacters(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch characters');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCharacter = async (characterData: CharacterCreate): Promise<Character | null> => {
    setLoading(true);
    setError(null);
    try {
      const newCharacter = await characterAPI.createCharacter(characterData);
      setCharacters(prev => [...prev, newCharacter]);
      return newCharacter;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create character');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCharacter = async (characterId: string, characterData: CharacterUpdate): Promise<Character | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedCharacter = await characterAPI.updateCharacter(characterId, characterData);
      setCharacters(prev => 
        prev.map(char => char.id === characterId ? updatedCharacter : char)
      );
      return updatedCharacter;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update character');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCharacter = async (characterId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await characterAPI.deleteCharacter(characterId);
      setCharacters(prev => prev.filter(char => char.id !== characterId));
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete character');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const associateCharacterWithBook = async (characterId: string, bookId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await characterAPI.associateCharacterWithBook(characterId, bookId);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to associate character with book');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeCharacterFromBook = async (characterId: string, bookId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await characterAPI.removeCharacterFromBook(characterId, bookId);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove character from book');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCharactersByBook = useCallback(async (bookId: string): Promise<Character[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await characterAPI.getCharactersByBook(bookId);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch characters for book');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadCharacterImage = async (characterId: string, file: File): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await characterAPI.uploadCharacterImage(characterId, file);
      
      // Update the character in the local state with the new image URL
      setCharacters(prev => 
        prev.map(char => 
          char.id === characterId 
            ? { ...char, image_url: result.url }
            : char
        )
      );
      
      return result.url;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload character image');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  return {
    characters,
    loading,
    error,
    fetchCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    associateCharacterWithBook,
    removeCharacterFromBook,
    getCharactersByBook,
    uploadCharacterImage,
  };
}