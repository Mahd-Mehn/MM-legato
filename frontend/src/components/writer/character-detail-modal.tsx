'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Character } from '@/types/character';
import { User } from 'lucide-react';

interface CharacterDetailModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CharacterDetailModal({ character, isOpen, onClose }: CharacterDetailModalProps) {
  if (!character) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
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
              <span className="text-xl">{character.name}</span>
              {character.title && (
                <Badge variant="secondary" className="ml-2">
                  {character.title}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Character Image */}
          {character.image_url && (
            <div className="flex justify-center">
              <img
                src={character.image_url}
                alt={character.name}
                className="w-48 h-48 rounded-lg object-cover border"
              />
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            {character.gender && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Gender</span>
                <p className="text-sm mt-1">{character.gender}</p>
              </div>
            )}
            
            {character.age && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Age</span>
                <p className="text-sm mt-1">{character.age}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {character.description && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Description</span>
              <p className="text-sm mt-2 leading-relaxed whitespace-pre-wrap">
                {character.description}
              </p>
            </div>
          )}

          {/* Relationships */}
          {character.relationships && Object.keys(character.relationships).length > 0 && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Relationships</span>
              <div className="mt-2 space-y-3">
                {Object.entries(character.relationships).map(([type, value]) => (
                  <div key={type} className="p-3 bg-muted/50 rounded-lg">
                    <div className="font-medium text-sm capitalize mb-1">{type}</div>
                    <div className="text-sm text-muted-foreground">
                      {Array.isArray(value) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {value.map((item, index) => (
                            <li key={index}>{String(item)}</li>
                          ))}
                        </ul>
                      ) : (
                        String(value)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Created:</span>
                <br />
                {new Date(character.created_at).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span>
                <br />
                {new Date(character.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}