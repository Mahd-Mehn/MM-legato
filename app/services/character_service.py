from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.character import Character
from app.models.book import Book
from app.models.user import User
import uuid
import json


class CharacterService:
    def __init__(self, db: Session):
        self.db = db

    def create_character(
        self,
        author_id: str,
        name: str,
        image_url: Optional[str] = None,
        description: Optional[str] = None,
        title: Optional[str] = None,
        gender: Optional[str] = None,
        age: Optional[int] = None,
        relationships: Optional[dict] = None
    ) -> Character:
        """Create a new character profile."""
        character = Character(
            name=name,
            image_url=image_url,
            description=description,
            title=title,
            gender=gender,
            age=age,
            relationships=json.dumps(relationships) if relationships else None,
            author_id=author_id
        )
        
        self.db.add(character)
        self.db.commit()
        self.db.refresh(character)
        return character

    def get_character_by_id(self, character_id: str) -> Optional[Character]:
        """Get a character by ID."""
        return self.db.query(Character).filter(Character.id == character_id).first()

    def get_characters_by_author(self, author_id: str) -> List[Character]:
        """Get all characters created by an author."""
        return self.db.query(Character).filter(Character.author_id == author_id).all()

    def get_characters_by_book(self, book_id: str) -> List[Character]:
        """Get all characters associated with a book."""
        return (
            self.db.query(Character)
            .join(Character.books)
            .filter(Book.id == book_id)
            .all()
        )

    def update_character(
        self,
        character_id: str,
        author_id: str,
        name: Optional[str] = None,
        image_url: Optional[str] = None,
        description: Optional[str] = None,
        title: Optional[str] = None,
        gender: Optional[str] = None,
        age: Optional[int] = None,
        relationships: Optional[dict] = None
    ) -> Optional[Character]:
        """Update a character profile."""
        character = self.db.query(Character).filter(
            and_(Character.id == character_id, Character.author_id == author_id)
        ).first()
        
        if not character:
            return None

        if name is not None:
            character.name = name
        if image_url is not None:
            character.image_url = image_url
        if description is not None:
            character.description = description
        if title is not None:
            character.title = title
        if gender is not None:
            character.gender = gender
        if age is not None:
            character.age = age
        if relationships is not None:
            character.relationships = json.dumps(relationships)

        self.db.commit()
        self.db.refresh(character)
        return character

    def delete_character(self, character_id: str, author_id: str) -> bool:
        """Delete a character profile."""
        character = self.db.query(Character).filter(
            and_(Character.id == character_id, Character.author_id == author_id)
        ).first()
        
        if not character:
            return False

        self.db.delete(character)
        self.db.commit()
        return True

    def associate_character_with_book(self, character_id: str, book_id: str, author_id: str) -> bool:
        """Associate a character with a book."""
        # Verify the character belongs to the author
        character = self.db.query(Character).filter(
            and_(Character.id == character_id, Character.author_id == author_id)
        ).first()
        
        if not character:
            return False

        # Verify the book belongs to the author
        book = self.db.query(Book).filter(
            and_(Book.id == book_id, Book.author_id == author_id)
        ).first()
        
        if not book:
            return False

        # Check if association already exists
        if book not in character.books:
            character.books.append(book)
            self.db.commit()
        
        return True

    def remove_character_from_book(self, character_id: str, book_id: str, author_id: str) -> bool:
        """Remove a character association from a book."""
        # Verify the character belongs to the author
        character = self.db.query(Character).filter(
            and_(Character.id == character_id, Character.author_id == author_id)
        ).first()
        
        if not character:
            return False

        # Verify the book belongs to the author
        book = self.db.query(Book).filter(
            and_(Book.id == book_id, Book.author_id == author_id)
        ).first()
        
        if not book:
            return False

        # Remove association if it exists
        if book in character.books:
            character.books.remove(book)
            self.db.commit()
        
        return True