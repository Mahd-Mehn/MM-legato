'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Character } from '@/types/character';
import { User } from 'lucide-react';

interface CharacterProfileProps {
  character: Character;
  compact?: boolean;
}

export function CharacterProfile({ character, compact = false }: CharacterProfileProps) {
  const relationships = character.relationships;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
        {character.image_url ? (
          <img
            src={character.image_url}
            alt={character.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{character.name}</span>
            {character.title && (
              <Badge variant="secondary" className="text-xs">
                {character.title}
              </Badge>
            )}
          </div>
          {character.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {character.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          {character.image_url ? (
            <img
              src={character.image_url}
              alt={character.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-xl">{character.name}</CardTitle>
            {character.title && (
              <Badge variant="secondary" className="mt-2">
                {character.title}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          {character.gender && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Gender</span>
              <p className="text-sm">{character.gender}</p>
            </div>
          )}
          
          {character.age && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Age</span>
              <p className="text-sm">{character.age}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {character.description && (
          <div>
            <span className="text-sm font-medium text-muted-foreground">Description</span>
            <p className="text-sm mt-1 leading-relaxed">{character.description}</p>
          </div>
        )}

        {/* Relationships */}
        {relationships && Object.keys(relationships).length > 0 && (
          <div>
            <span className="text-sm font-medium text-muted-foreground">Relationships</span>
            <div className="mt-2 space-y-2">
              {Object.entries(relationships).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium capitalize">{key}:</span>{' '}
                  <span className="text-muted-foreground">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}