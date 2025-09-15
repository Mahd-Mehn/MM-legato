"""
Content validation and sanitization service
"""
import re
import html
from typing import List, Dict, Any, Tuple
from schemas import ContentValidationError, ContentValidationResponse
from models import ContentValidationRule
import bleach

class ContentValidator:
    """Content validation and sanitization service"""
    
    # Default validation rules
    DEFAULT_RULES = {
        'min_title_length': {
            'type': 'length',
            'parameters': {'min_length': 1, 'max_length': 200},
            'message': 'Title must be between 1 and 200 characters'
        },
        'min_content_length': {
            'type': 'length',
            'parameters': {'min_length': 100, 'max_length': 50000},
            'message': 'Chapter content must be between 100 and 50,000 characters'
        },
        'max_description_length': {
            'type': 'length',
            'parameters': {'max_length': 2000},
            'message': 'Description cannot exceed 2,000 characters'
        },
        'max_synopsis_length': {
            'type': 'length',
            'parameters': {'max_length': 5000},
            'message': 'Synopsis cannot exceed 5,000 characters'
        },
        'profanity_filter': {
            'type': 'content',
            'parameters': {'severity': 'warning'},
            'message': 'Content may contain inappropriate language'
        },
        'spam_detection': {
            'type': 'content',
            'parameters': {'max_repeated_chars': 10, 'max_caps_percentage': 50},
            'message': 'Content appears to be spam or low quality'
        }
    }
    
    # Allowed HTML tags for content
    ALLOWED_TAGS = [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'ul', 'ol', 'li', 'hr'
    ]
    
    # Basic profanity word list (in production, use a comprehensive service)
    PROFANITY_WORDS = [
        'spam', 'scam', 'fake', 'bot', 'advertisement', 'promotion'
    ]
    
    def __init__(self, db_session=None):
        self.db = db_session
        self.rules = self._load_validation_rules()
    
    def _load_validation_rules(self) -> Dict[str, Dict]:
        """Load validation rules from database or use defaults"""
        rules = self.DEFAULT_RULES.copy()
        
        if self.db:
            try:
                db_rules = self.db.query(ContentValidationRule).filter(
                    ContentValidationRule.is_active == True
                ).all()
                
                for rule in db_rules:
                    rules[rule.rule_name] = {
                        'type': rule.rule_type,
                        'parameters': rule.parameters or {},
                        'message': rule.error_message,
                        'severity': rule.severity
                    }
            except Exception as e:
                print(f"Error loading validation rules from database: {e}")
        
        return rules
    
    def validate_story(self, title: str, description: str = None, synopsis: str = None, 
                      genre: str = None, tags: List[str] = None) -> ContentValidationResponse:
        """Validate story metadata"""
        errors = []
        warnings = []
        
        # Validate title
        title_errors, title_warnings = self._validate_text_field(
            title, 'title', ['min_title_length', 'profanity_filter', 'spam_detection']
        )
        errors.extend(title_errors)
        warnings.extend(title_warnings)
        
        # Validate description
        if description:
            desc_errors, desc_warnings = self._validate_text_field(
                description, 'description', ['max_description_length', 'profanity_filter']
            )
            errors.extend(desc_errors)
            warnings.extend(desc_warnings)
        
        # Validate synopsis
        if synopsis:
            syn_errors, syn_warnings = self._validate_text_field(
                synopsis, 'synopsis', ['max_synopsis_length', 'profanity_filter']
            )
            errors.extend(syn_errors)
            warnings.extend(syn_warnings)
        
        # Validate genre
        if genre:
            genre_errors = self._validate_genre(genre)
            errors.extend(genre_errors)
        
        # Validate tags
        if tags:
            tag_errors = self._validate_tags(tags)
            errors.extend(tag_errors)
        
        return ContentValidationResponse(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def validate_chapter(self, title: str, content: str, author_note: str = None) -> ContentValidationResponse:
        """Validate chapter content"""
        errors = []
        warnings = []
        
        # Validate title
        title_errors, title_warnings = self._validate_text_field(
            title, 'title', ['min_title_length', 'profanity_filter']
        )
        errors.extend(title_errors)
        warnings.extend(title_warnings)
        
        # Validate content
        content_errors, content_warnings = self._validate_text_field(
            content, 'content', ['min_content_length', 'profanity_filter', 'spam_detection']
        )
        errors.extend(content_errors)
        warnings.extend(content_warnings)
        
        # Validate author note
        if author_note:
            note_errors, note_warnings = self._validate_text_field(
                author_note, 'author_note', ['profanity_filter']
            )
            errors.extend(note_errors)
            warnings.extend(note_warnings)
        
        return ContentValidationResponse(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def _validate_text_field(self, text: str, field_name: str, 
                           rule_names: List[str]) -> Tuple[List[ContentValidationError], List[ContentValidationError]]:
        """Validate a text field against specified rules"""
        errors = []
        warnings = []
        
        for rule_name in rule_names:
            if rule_name not in self.rules:
                continue
                
            rule = self.rules[rule_name]
            rule_type = rule['type']
            parameters = rule['parameters']
            message = rule['message']
            severity = rule.get('severity', 'error')
            
            validation_error = None
            
            if rule_type == 'length':
                validation_error = self._validate_length(text, field_name, parameters, message)
            elif rule_type == 'content':
                if rule_name == 'profanity_filter':
                    validation_error = self._validate_profanity(text, field_name, message)
                elif rule_name == 'spam_detection':
                    validation_error = self._validate_spam(text, field_name, parameters, message)
            
            if validation_error:
                if severity == 'error':
                    errors.append(validation_error)
                else:
                    warnings.append(validation_error)
        
        return errors, warnings
    
    def _validate_length(self, text: str, field_name: str, parameters: Dict, message: str) -> ContentValidationError:
        """Validate text length"""
        text_length = len(text.strip()) if text else 0
        min_length = parameters.get('min_length', 0)
        max_length = parameters.get('max_length', float('inf'))
        
        if text_length < min_length or text_length > max_length:
            return ContentValidationError(
                field=field_name,
                message=message,
                code='INVALID_LENGTH'
            )
        return None
    
    def _validate_profanity(self, text: str, field_name: str, message: str) -> ContentValidationError:
        """Basic profanity detection"""
        if not text:
            return None
            
        text_lower = text.lower()
        for word in self.PROFANITY_WORDS:
            if word in text_lower:
                return ContentValidationError(
                    field=field_name,
                    message=f"{message}: Contains '{word}'",
                    code='PROFANITY_DETECTED'
                )
        return None
    
    def _validate_spam(self, text: str, field_name: str, parameters: Dict, message: str) -> ContentValidationError:
        """Basic spam detection"""
        if not text:
            return None
        
        # Check for excessive repeated characters
        max_repeated = parameters.get('max_repeated_chars', 10)
        if re.search(f'(.)\\1{{{max_repeated},}}', text):
            return ContentValidationError(
                field=field_name,
                message=f"{message}: Excessive repeated characters",
                code='SPAM_DETECTED'
            )
        
        # Check for excessive capitalization
        max_caps_percentage = parameters.get('max_caps_percentage', 50)
        if text:
            caps_count = sum(1 for c in text if c.isupper())
            caps_percentage = (caps_count / len(text)) * 100
            if caps_percentage > max_caps_percentage:
                return ContentValidationError(
                    field=field_name,
                    message=f"{message}: Excessive capitalization",
                    code='SPAM_DETECTED'
                )
        
        return None
    
    def _validate_genre(self, genre: str) -> List[ContentValidationError]:
        """Validate genre selection"""
        errors = []
        
        # Define allowed genres (in production, load from database)
        allowed_genres = [
            'fantasy', 'romance', 'mystery', 'thriller', 'science-fiction', 'horror',
            'adventure', 'drama', 'comedy', 'historical', 'contemporary', 'young-adult',
            'literary', 'crime', 'western', 'biography', 'non-fiction'
        ]
        
        if genre and genre.lower() not in allowed_genres:
            errors.append(ContentValidationError(
                field='genre',
                message=f"Invalid genre: {genre}. Must be one of: {', '.join(allowed_genres)}",
                code='INVALID_GENRE'
            ))
        
        return errors
    
    def _validate_tags(self, tags: List[str]) -> List[ContentValidationError]:
        """Validate tags"""
        errors = []
        
        if len(tags) > 10:
            errors.append(ContentValidationError(
                field='tags',
                message="Maximum 10 tags allowed",
                code='TOO_MANY_TAGS'
            ))
        
        for tag in tags:
            if len(tag) > 50:
                errors.append(ContentValidationError(
                    field='tags',
                    message=f"Tag '{tag}' exceeds 50 character limit",
                    code='TAG_TOO_LONG'
                ))
        
        return errors
    
    def sanitize_content(self, content: str) -> str:
        """Sanitize HTML content"""
        if not content:
            return content
        
        # Remove potentially dangerous HTML
        cleaned_content = bleach.clean(
            content,
            tags=self.ALLOWED_TAGS,
            strip=True
        )
        
        # Escape any remaining HTML entities
        cleaned_content = html.escape(cleaned_content, quote=False)
        
        return cleaned_content
    
    def sanitize_text(self, text: str) -> str:
        """Sanitize plain text"""
        if not text:
            return text
        
        # Remove HTML tags and escape entities
        cleaned_text = bleach.clean(text, tags=[], strip=True)
        cleaned_text = html.escape(cleaned_text, quote=False)
        
        return cleaned_text.strip()

# Content encryption utilities
class ContentEncryption:
    """Content encryption for secure storage"""
    
    @staticmethod
    def encrypt_content(content: str, key: str = None) -> str:
        """Encrypt content for secure storage"""
        # In production, implement proper encryption
        # For now, return base64 encoded content as placeholder
        import base64
        if not content:
            return content
        
        encoded_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')
        return encoded_content
    
    @staticmethod
    def decrypt_content(encrypted_content: str, key: str = None) -> str:
        """Decrypt content for reading"""
        # In production, implement proper decryption
        # For now, return base64 decoded content as placeholder
        import base64
        if not encrypted_content:
            return encrypted_content
        
        try:
            decoded_content = base64.b64decode(encrypted_content.encode('utf-8')).decode('utf-8')
            return decoded_content
        except Exception:
            # If decoding fails, assume content is not encrypted
            return encrypted_content

# Content backup utilities
class ContentBackup:
    """Content backup and versioning utilities"""
    
    @staticmethod
    def create_backup_metadata(content: str, author_id: str) -> Dict[str, Any]:
        """Create backup metadata"""
        import hashlib
        from datetime import datetime
        
        content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        
        return {
            'content_hash': content_hash,
            'author_id': author_id,
            'backup_timestamp': datetime.utcnow().isoformat(),
            'content_length': len(content),
            'backup_version': '1.0'
        }
    
    @staticmethod
    def verify_backup_integrity(content: str, metadata: Dict[str, Any]) -> bool:
        """Verify backup integrity using hash"""
        import hashlib
        
        current_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
        stored_hash = metadata.get('content_hash')
        
        return current_hash == stored_hash