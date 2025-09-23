'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Character, CharacterCreate, CharacterUpdate } from '@/types/character';
import { Book } from '@/types/book';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, User, Plus, Trash2 } from 'lucide-react';

interface CharacterFormProps {
  character?: Character;
  books?: Book[];
  selectedBookId?: string;
  onSubmit: (data: CharacterCreate | CharacterUpdate, imageFile?: File, bookId?: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface Relationship {
  id: string;
  type: string;
  name: string;
}

export function CharacterForm({ character, books = [], selectedBookId, onSubmit, onCancel, isLoading }: CharacterFormProps) {
  const [formData, setFormData] = useState({
    name: character?.name || '',
    title: character?.title || '',
    description: character?.description || '',
    gender: character?.gender || '',
    age: character?.age?.toString() || '',
    image_url: character?.image_url || '',
  });

  // Parse existing relationships into the new format
  const parseRelationships = (relationships?: Record<string, any>): Relationship[] => {
    if (!relationships) return [];
    
    const parsed: Relationship[] = [];
    Object.entries(relationships).forEach(([type, value]) => {
      if (Array.isArray(value)) {
        value.forEach((name, index) => {
          parsed.push({
            id: `${type}-${index}`,
            type,
            name: String(name)
          });
        });
      } else {
        parsed.push({
          id: `${type}-0`,
          type,
          name: String(value)
        });
      }
    });
    return parsed;
  };

  const [relationships, setRelationships] = useState<Relationship[]>(
    parseRelationships(character?.relationships)
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(character?.image_url || null);
  const [bookId, setBookId] = useState<string>(selectedBookId || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert relationships back to the expected format
    const relationshipsData: Record<string, any> = {};
    relationships.forEach(rel => {
      if (!rel.type.trim() || !rel.name.trim()) return;
      
      if (relationshipsData[rel.type]) {
        // If type already exists, convert to array or add to existing array
        if (Array.isArray(relationshipsData[rel.type])) {
          relationshipsData[rel.type].push(rel.name);
        } else {
          relationshipsData[rel.type] = [relationshipsData[rel.type], rel.name];
        }
      } else {
        relationshipsData[rel.type] = rel.name;
      }
    });
    
    const submitData: CharacterCreate | CharacterUpdate = {
      name: formData.name,
      title: formData.title || undefined,
      description: formData.description || undefined,
      gender: formData.gender || undefined,
      age: formData.age ? parseInt(formData.age) : undefined,
      image_url: !selectedImage ? formData.image_url || undefined : undefined, // Only use URL if no file selected
      relationships: Object.keys(relationshipsData).length > 0 ? relationshipsData : undefined,
    };

    await onSubmit(submitData, selectedImage || undefined, bookId === 'none' ? undefined : bookId || undefined);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear the URL field since we're uploading a file
      setFormData(prev => ({ ...prev, image_url: '' }));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
    if (url) {
      setSelectedImage(null);
      setImagePreview(url);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setImagePreview(null);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addRelationship = () => {
    const newRelationship: Relationship = {
      id: `rel-${Date.now()}`,
      type: '',
      name: ''
    };
    setRelationships(prev => [...prev, newRelationship]);
  };

  const updateRelationship = (id: string, field: 'type' | 'name', value: string) => {
    setRelationships(prev => 
      prev.map(rel => 
        rel.id === id ? { ...rel, [field]: value } : rel
      )
    );
  };

  const removeRelationship = (id: string) => {
    setRelationships(prev => prev.filter(rel => rel.id !== id));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{character ? 'Edit Character' : 'Create New Character'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Book Selection */}
          {books.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="book">Assign to Book (Optional)</Label>
              <Select value={bookId} onValueChange={setBookId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a book to assign this character to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No book (create as standalone character)</SelectItem>
                  {books.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                You can assign characters to books later if needed
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Character Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter character name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title/Role</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Princess, Knight, Wizard"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                placeholder="Enter gender"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                placeholder="Enter age"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Character Image</Label>
            
            {/* Image Preview */}
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Character preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                {/* File Upload */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="character-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
                
                {/* URL Input */}
                <div className="relative">
                  <Input
                    value={formData.image_url}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="Or paste image URL"
                    disabled={!!selectedImage}
                  />
                </div>
                
                {/* Remove Button */}
                {(imagePreview || selectedImage) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Image
                  </Button>
                )}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Upload an image file or provide a URL. Recommended size: 400x400px
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your character's appearance, personality, background..."
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Relationships</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRelationship}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Relationship
              </Button>
            </div>
            
            {relationships.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-muted-foreground">No relationships added yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Add Relationship" to define character connections
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {relationships.map((relationship) => (
                  <div key={relationship.id} className="flex gap-2 items-center p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Relationship type (e.g., Family, Friend, Enemy)"
                        value={relationship.type}
                        onChange={(e) => updateRelationship(relationship.id, 'type', e.target.value)}
                      />
                      <Input
                        placeholder="Name or description"
                        value={relationship.name}
                        onChange={(e) => updateRelationship(relationship.id, 'name', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRelationship(relationship.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Define how this character relates to others in your story
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? 'Saving...' : character ? 'Update Character' : 'Create Character'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}