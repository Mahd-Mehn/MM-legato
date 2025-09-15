"""
Content Adaptation Service for Legato Platform

This service provides AI-powered content adaptation tools for converting
stories into different formats like scripts for comics, films, and games.
"""

import uuid
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum

from models import ContentAdaptationRequest, ContentAdaptationResponse
from database import db_manager


class AdaptationType(str, Enum):
    COMIC_SCRIPT = "comic_script"
    FILM_SCRIPT = "film_script"
    GAME_SCRIPT = "game_script"
    SCREENPLAY = "screenplay"
    STAGE_PLAY = "stage_play"


class AdaptationStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    REVIEW_NEEDED = "review_needed"


class ContentAdaptationService:
    """Service for handling content adaptation to different formats"""
    
    def __init__(self):
        self.adaptation_templates = {
            AdaptationType.COMIC_SCRIPT: {
                "format": "comic",
                "elements": ["panel_descriptions", "dialogue", "sound_effects", "visual_notes"],
                "structure": "page_based"
            },
            AdaptationType.FILM_SCRIPT: {
                "format": "screenplay",
                "elements": ["scene_headings", "action_lines", "dialogue", "transitions"],
                "structure": "scene_based"
            },
            AdaptationType.GAME_SCRIPT: {
                "format": "interactive",
                "elements": ["narrative_text", "dialogue_options", "action_triggers", "branching_paths"],
                "structure": "choice_based"
            },
            AdaptationType.SCREENPLAY: {
                "format": "screenplay",
                "elements": ["fade_in", "scene_headings", "action", "dialogue", "transitions"],
                "structure": "three_act"
            },
            AdaptationType.STAGE_PLAY: {
                "format": "theatrical",
                "elements": ["stage_directions", "dialogue", "scene_changes", "character_notes"],
                "structure": "act_based"
            }
        }
    
    async def create_adaptation(self, request: ContentAdaptationRequest) -> ContentAdaptationResponse:
        """Create a new content adaptation"""
        adaptation_id = str(uuid.uuid4())
        
        # Validate adaptation type
        if request.adaptation_type not in [t.value for t in AdaptationType]:
            raise ValueError(f"Unsupported adaptation type: {request.adaptation_type}")
        
        # Generate adapted content
        adapted_content = await self._generate_adaptation(
            request.source_text,
            request.adaptation_type,
            request.target_format
        )
        
        # Store adaptation in database
        adaptation_data = {
            "adaptation_id": adaptation_id,
            "content_id": request.content_id,
            "user_id": request.user_id,
            "adaptation_type": request.adaptation_type,
            "target_format": request.target_format,
            "source_text": request.source_text,
            "adapted_content": adapted_content,
            "status": AdaptationStatus.COMPLETED.value,
            "created_at": datetime.utcnow(),
            "metadata": {
                "word_count": len(request.source_text.split()),
                "adapted_word_count": len(adapted_content.split()),
                "template_used": self.adaptation_templates.get(request.adaptation_type, {})
            }
        }
        
        collection = await db_manager.get_adaptation_collection()
        await collection.insert_one(adaptation_data)
        
        return ContentAdaptationResponse(
            adaptation_id=adaptation_id,
            content_id=request.content_id,
            adapted_content=adapted_content,
            adaptation_type=request.adaptation_type,
            status=AdaptationStatus.COMPLETED.value,
            created_at=adaptation_data["created_at"]
        )
    
    async def _generate_adaptation(self, source_text: str, adaptation_type: str, target_format: str) -> str:
        """Generate adapted content based on type and format"""
        
        if adaptation_type == AdaptationType.COMIC_SCRIPT:
            return await self._generate_comic_script(source_text, target_format)
        elif adaptation_type == AdaptationType.FILM_SCRIPT:
            return await self._generate_film_script(source_text, target_format)
        elif adaptation_type == AdaptationType.GAME_SCRIPT:
            return await self._generate_game_script(source_text, target_format)
        elif adaptation_type == AdaptationType.SCREENPLAY:
            return await self._generate_screenplay(source_text, target_format)
        elif adaptation_type == AdaptationType.STAGE_PLAY:
            return await self._generate_stage_play(source_text, target_format)
        else:
            raise ValueError(f"Unsupported adaptation type: {adaptation_type}")
    
    async def _generate_comic_script(self, source_text: str, target_format: str) -> str:
        """Generate comic script format"""
        # Parse source text into narrative and dialogue
        paragraphs = source_text.split('\n\n')
        comic_script = []
        
        comic_script.append("COMIC SCRIPT ADAPTATION")
        comic_script.append("=" * 50)
        comic_script.append("")
        
        page_num = 1
        panel_num = 1
        
        for paragraph in paragraphs:
            if not paragraph.strip():
                continue
                
            # Check if this is dialogue (contains quotes)
            if '"' in paragraph:
                # Extract dialogue and speaker
                dialogue_parts = self._extract_dialogue(paragraph)
                for speaker, dialogue in dialogue_parts:
                    comic_script.append(f"PAGE {page_num}, PANEL {panel_num}")
                    comic_script.append(f"VISUAL: Close-up of {speaker}")
                    comic_script.append(f"DIALOGUE: {dialogue}")
                    comic_script.append("")
                    panel_num += 1
                    
                    if panel_num > 6:  # New page after 6 panels
                        page_num += 1
                        panel_num = 1
            else:
                # Narrative description becomes visual panel
                comic_script.append(f"PAGE {page_num}, PANEL {panel_num}")
                comic_script.append(f"VISUAL: {self._convert_to_visual_description(paragraph)}")
                comic_script.append("")
                panel_num += 1
                
                if panel_num > 6:
                    page_num += 1
                    panel_num = 1
        
        return '\n'.join(comic_script)
    
    async def _generate_film_script(self, source_text: str, target_format: str) -> str:
        """Generate film script format"""
        paragraphs = source_text.split('\n\n')
        script = []
        
        script.append("SCREENPLAY ADAPTATION")
        script.append("=" * 50)
        script.append("")
        script.append("FADE IN:")
        script.append("")
        
        scene_num = 1
        
        for paragraph in paragraphs:
            if not paragraph.strip():
                continue
            
            if '"' in paragraph:
                # Dialogue section
                dialogue_parts = self._extract_dialogue(paragraph)
                for speaker, dialogue in dialogue_parts:
                    script.append(f"                    {speaker.upper()}")
                    script.append(f"          {dialogue}")
                    script.append("")
            else:
                # Action/description
                if scene_num == 1:
                    script.append("INT. SCENE LOCATION - DAY")
                    script.append("")
                
                action_text = self._convert_to_action_line(paragraph)
                script.append(action_text)
                script.append("")
                scene_num += 1
        
        script.append("FADE OUT.")
        script.append("")
        script.append("THE END")
        
        return '\n'.join(script)
    
    async def _generate_game_script(self, source_text: str, target_format: str) -> str:
        """Generate interactive game script format"""
        paragraphs = source_text.split('\n\n')
        game_script = []
        
        game_script.append("INTERACTIVE GAME SCRIPT")
        game_script.append("=" * 50)
        game_script.append("")
        
        scene_id = 1
        
        for paragraph in paragraphs:
            if not paragraph.strip():
                continue
            
            game_script.append(f"[SCENE_{scene_id:03d}]")
            
            if '"' in paragraph:
                # Dialogue with choices
                dialogue_parts = self._extract_dialogue(paragraph)
                for speaker, dialogue in dialogue_parts:
                    game_script.append(f"CHARACTER: {speaker}")
                    game_script.append(f"TEXT: {dialogue}")
                    game_script.append("")
                    
                    # Add player response options
                    game_script.append("PLAYER_CHOICES:")
                    game_script.append("1. [Agree] -> SCENE_" + f"{scene_id + 1:03d}")
                    game_script.append("2. [Question] -> SCENE_" + f"{scene_id + 2:03d}")
                    game_script.append("3. [Remain Silent] -> SCENE_" + f"{scene_id + 1:03d}")
                    game_script.append("")
            else:
                # Narrative text
                game_script.append(f"NARRATIVE: {paragraph}")
                game_script.append(f"CONTINUE -> SCENE_{scene_id + 1:03d}")
                game_script.append("")
            
            scene_id += 1
        
        return '\n'.join(game_script)
    
    async def _generate_screenplay(self, source_text: str, target_format: str) -> str:
        """Generate professional screenplay format"""
        return await self._generate_film_script(source_text, target_format)
    
    async def _generate_stage_play(self, source_text: str, target_format: str) -> str:
        """Generate stage play format"""
        paragraphs = source_text.split('\n\n')
        play_script = []
        
        play_script.append("STAGE PLAY ADAPTATION")
        play_script.append("=" * 50)
        play_script.append("")
        play_script.append("ACT I")
        play_script.append("")
        play_script.append("SCENE 1")
        play_script.append("")
        play_script.append("(Lights up. Stage setting description here.)")
        play_script.append("")
        
        for paragraph in paragraphs:
            if not paragraph.strip():
                continue
            
            if '"' in paragraph:
                # Dialogue
                dialogue_parts = self._extract_dialogue(paragraph)
                for speaker, dialogue in dialogue_parts:
                    play_script.append(f"{speaker.upper()}: {dialogue}")
                    play_script.append("")
            else:
                # Stage directions
                stage_direction = self._convert_to_stage_direction(paragraph)
                play_script.append(f"({stage_direction})")
                play_script.append("")
        
        play_script.append("(Lights fade to black.)")
        play_script.append("")
        play_script.append("END OF PLAY")
        
        return '\n'.join(play_script)
    
    def _extract_dialogue(self, text: str) -> List[tuple]:
        """Extract dialogue and speakers from text"""
        # Simple dialogue extraction - can be enhanced with NLP
        dialogue_parts = []
        
        # Look for quoted text
        import re
        quotes = re.findall(r'"([^"]*)"', text)
        
        for i, quote in enumerate(quotes):
            # Try to identify speaker from context
            speaker = f"CHARACTER_{i + 1}"  # Default speaker
            
            # Look for speaker indicators before the quote
            before_quote = text.split(f'"{quote}"')[0]
            words = before_quote.split()
            
            # Common speaker indicators
            speaker_indicators = ['said', 'asked', 'replied', 'whispered', 'shouted']
            for word in reversed(words):
                if word.lower() not in speaker_indicators and word.isalpha():
                    speaker = word.capitalize()
                    break
            
            dialogue_parts.append((speaker, quote))
        
        return dialogue_parts
    
    def _convert_to_visual_description(self, text: str) -> str:
        """Convert narrative text to visual description for comics"""
        # Enhance narrative for visual medium
        visual_keywords = {
            'walked': 'walking across the panel',
            'looked': 'gazing with intense expression',
            'thought': 'shown in thought bubble',
            'felt': 'expression showing emotion',
            'heard': 'sound effects visible'
        }
        
        enhanced_text = text
        for word, replacement in visual_keywords.items():
            enhanced_text = enhanced_text.replace(word, replacement)
        
        return enhanced_text
    
    def _convert_to_action_line(self, text: str) -> str:
        """Convert narrative to screenplay action line"""
        # Format for screenplay action lines (present tense, active voice)
        action_text = text.strip()
        
        # Ensure present tense and active voice
        # This is a simplified conversion - real implementation would use NLP
        action_text = action_text.replace(' was ', ' is ')
        action_text = action_text.replace(' were ', ' are ')
        action_text = action_text.replace(' had ', ' has ')
        
        return action_text.upper() if len(action_text) < 50 else action_text
    
    def _convert_to_stage_direction(self, text: str) -> str:
        """Convert narrative to stage direction"""
        # Format for stage directions
        return text.strip()
    
    async def get_adaptation(self, adaptation_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve adaptation by ID"""
        collection = await db_manager.get_adaptation_collection()
        adaptation = await collection.find_one({"adaptation_id": adaptation_id})
        return adaptation
    
    async def list_adaptations(self, content_id: str = None, user_id: str = None) -> List[Dict[str, Any]]:
        """List adaptations with optional filtering"""
        collection = await db_manager.get_adaptation_collection()
        
        query = {}
        if content_id:
            query["content_id"] = content_id
        if user_id:
            query["user_id"] = user_id
        
        cursor = collection.find(query).sort("created_at", -1)
        adaptations = await cursor.to_list(length=100)
        return adaptations
    
    async def get_adaptation_rights(self, content_id: str) -> Dict[str, Any]:
        """Get available adaptation rights for content"""
        # This would integrate with IP service to check rights availability
        # For now, return default rights structure
        
        return {
            "content_id": content_id,
            "available_rights": {
                "film": {
                    "available": True,
                    "exclusive": True,
                    "territories": ["worldwide"],
                    "duration": "7 years",
                    "revenue_share": "15% to platform, 85% to creator"
                },
                "television": {
                    "available": True,
                    "exclusive": False,
                    "territories": ["worldwide"],
                    "duration": "5 years",
                    "revenue_share": "15% to platform, 85% to creator"
                },
                "game": {
                    "available": True,
                    "exclusive": True,
                    "territories": ["worldwide"],
                    "duration": "10 years",
                    "revenue_share": "20% to platform, 80% to creator"
                },
                "comic": {
                    "available": True,
                    "exclusive": False,
                    "territories": ["worldwide"],
                    "duration": "3 years",
                    "revenue_share": "15% to platform, 85% to creator"
                },
                "audiobook": {
                    "available": True,
                    "exclusive": False,
                    "territories": ["worldwide"],
                    "duration": "5 years",
                    "revenue_share": "10% to platform, 90% to creator"
                },
                "translation": {
                    "available": True,
                    "exclusive": False,
                    "territories": ["by language"],
                    "duration": "indefinite",
                    "revenue_share": "10% to platform, 90% to creator"
                }
            },
            "restrictions": [],
            "contact_info": "licensing@legato.com"
        }
    
    async def suggest_enhancements(self, content_id: str, adaptation_type: str) -> Dict[str, Any]:
        """Provide AI-powered content enhancement suggestions"""
        # Get existing adaptations for this content (if database is available)
        try:
            adaptations = await self.list_adaptations(content_id=content_id)
        except (AttributeError, Exception):
            # If database is not available, continue without existing adaptations
            adaptations = []
        
        suggestions = {
            "content_id": content_id,
            "adaptation_type": adaptation_type,
            "suggestions": []
        }
        
        # Generate suggestions based on adaptation type
        if adaptation_type == AdaptationType.COMIC_SCRIPT:
            suggestions["suggestions"] = [
                {
                    "type": "visual_enhancement",
                    "suggestion": "Add more visual action sequences to increase panel variety",
                    "priority": "medium"
                },
                {
                    "type": "pacing",
                    "suggestion": "Consider breaking long dialogue into multiple panels",
                    "priority": "high"
                },
                {
                    "type": "sound_effects",
                    "suggestion": "Add sound effect indicators for action scenes",
                    "priority": "low"
                }
            ]
        elif adaptation_type == AdaptationType.FILM_SCRIPT:
            suggestions["suggestions"] = [
                {
                    "type": "scene_structure",
                    "suggestion": "Consider adding more visual transitions between scenes",
                    "priority": "medium"
                },
                {
                    "type": "dialogue",
                    "suggestion": "Some dialogue may be too literary for screen - consider simplification",
                    "priority": "high"
                },
                {
                    "type": "action_lines",
                    "suggestion": "Add more specific camera directions for key emotional moments",
                    "priority": "low"
                }
            ]
        elif adaptation_type == AdaptationType.GAME_SCRIPT:
            suggestions["suggestions"] = [
                {
                    "type": "interactivity",
                    "suggestion": "Add more meaningful player choices that affect story outcome",
                    "priority": "high"
                },
                {
                    "type": "branching",
                    "suggestion": "Consider multiple story paths for increased replayability",
                    "priority": "medium"
                },
                {
                    "type": "mechanics",
                    "suggestion": "Integrate story elements with potential game mechanics",
                    "priority": "low"
                }
            ]
        
        return suggestions


# Global service instance
adaptation_service = ContentAdaptationService()