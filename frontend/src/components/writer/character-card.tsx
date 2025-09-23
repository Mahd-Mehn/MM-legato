'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Character } from '@/types/character';
import { Edit, Trash2, User } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  onEdit: (character: Character) => void;
  onDelete: (characterId: string) => void;
  onView?: (character: Character) => void;
}

export function CharacterCard({ character, onEdit, onDelete, onView }: CharacterCardProps) {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${character.name}?`)) {
      onDelete(character.id);
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {character.image_url ? (
              <img
                src={character.image_url}
                alt={character.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{character.name}</CardTitle>
              {character.title && (
                <Badge variant="secondary" className="mt-1">
                  {character.title}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(character)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {character.gender && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gender:</span>
              <span>{character.gender}</span>
            </div>
          )}
          
          {character.age && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Age:</span>
              <span>{character.age}</span>
            </div>
          )}
          
          {character.description && (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground mb-1">Description:</p>
              <p className="text-sm line-clamp-3">{character.description}</p>
            </div>
          )}
          
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(character)}
              className="w-full mt-3"
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}