export interface Character {
  id: string;
  name: string;
  image_url?: string;
  description?: string;
  title?: string;
  gender?: string;
  age?: number;
  relationships?: Record<string, any>;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterCreate {
  name: string;
  image_url?: string;
  description?: string;
  title?: string;
  gender?: string;
  age?: number;
  relationships?: Record<string, any>;
}

export interface CharacterUpdate {
  name?: string;
  image_url?: string;
  description?: string;
  title?: string;
  gender?: string;
  age?: number;
  relationships?: Record<string, any>;
}

export interface CharacterBookAssociation {
  book_id: string;
}