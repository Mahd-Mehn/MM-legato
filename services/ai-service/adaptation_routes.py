"""
Content Adaptation API Routes for Legato Platform

Provides REST API endpoints for content adaptation services including
script generation for comics, films, games, and rights management.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
import logging

from models import ContentAdaptationRequest, ContentAdaptationResponse
from adaptation_service import adaptation_service, AdaptationType, AdaptationStatus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/adaptation", tags=["content-adaptation"])


@router.post("/create", response_model=ContentAdaptationResponse)
async def create_adaptation(request: ContentAdaptationRequest):
    """
    Create a new content adaptation
    
    Converts source content into different formats like comic scripts,
    film scripts, game scripts, etc.
    """
    try:
        logger.info(f"Creating adaptation for content {request.content_id} of type {request.adaptation_type}")
        
        adaptation = await adaptation_service.create_adaptation(request)
        
        logger.info(f"Successfully created adaptation {adaptation.adaptation_id}")
        return adaptation
        
    except ValueError as e:
        logger.error(f"Invalid adaptation request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating adaptation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/types")
async def get_adaptation_types():
    """
    Get available adaptation types and their descriptions
    """
    return {
        "adaptation_types": [
            {
                "type": AdaptationType.COMIC_SCRIPT,
                "name": "Comic Script",
                "description": "Convert story into comic book panel format with visual descriptions and dialogue",
                "output_format": "Panel-based script with visual cues"
            },
            {
                "type": AdaptationType.FILM_SCRIPT,
                "name": "Film Script",
                "description": "Convert story into screenplay format for film production",
                "output_format": "Standard screenplay format with scene headings and action lines"
            },
            {
                "type": AdaptationType.GAME_SCRIPT,
                "name": "Game Script",
                "description": "Convert story into interactive game format with player choices",
                "output_format": "Interactive script with branching dialogue and choices"
            },
            {
                "type": AdaptationType.SCREENPLAY,
                "name": "Professional Screenplay",
                "description": "Professional screenplay format for film/TV production",
                "output_format": "Industry-standard screenplay format"
            },
            {
                "type": AdaptationType.STAGE_PLAY,
                "name": "Stage Play",
                "description": "Convert story into theatrical stage play format",
                "output_format": "Stage play with acts, scenes, and stage directions"
            }
        ]
    }


@router.get("/{adaptation_id}")
async def get_adaptation(adaptation_id: str):
    """
    Retrieve a specific adaptation by ID
    """
    try:
        adaptation = await adaptation_service.get_adaptation(adaptation_id)
        
        if not adaptation:
            raise HTTPException(status_code=404, detail="Adaptation not found")
        
        return adaptation
        
    except Exception as e:
        logger.error(f"Error retrieving adaptation {adaptation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/")
async def list_adaptations(
    content_id: Optional[str] = Query(None, description="Filter by content ID"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    adaptation_type: Optional[str] = Query(None, description="Filter by adaptation type")
):
    """
    List adaptations with optional filtering
    """
    try:
        adaptations = await adaptation_service.list_adaptations(
            content_id=content_id,
            user_id=user_id
        )
        
        # Filter by adaptation type if specified
        if adaptation_type:
            adaptations = [a for a in adaptations if a.get("adaptation_type") == adaptation_type]
        
        return {
            "adaptations": adaptations,
            "total": len(adaptations)
        }
        
    except Exception as e:
        logger.error(f"Error listing adaptations: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/rights/{content_id}")
async def get_adaptation_rights(content_id: str):
    """
    Get available adaptation rights for specific content
    
    Returns information about what adaptation rights are available,
    licensing terms, and revenue sharing details.
    """
    try:
        rights_info = await adaptation_service.get_adaptation_rights(content_id)
        return rights_info
        
    except Exception as e:
        logger.error(f"Error retrieving adaptation rights for {content_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/suggestions/{content_id}")
async def get_enhancement_suggestions(
    content_id: str,
    adaptation_type: str = Query(..., description="Type of adaptation for suggestions")
):
    """
    Get AI-powered content enhancement suggestions
    
    Provides suggestions for improving content adaptation based on
    the target format and best practices.
    """
    try:
        # Validate adaptation type
        if adaptation_type not in [t.value for t in AdaptationType]:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid adaptation type. Must be one of: {[t.value for t in AdaptationType]}"
            )
        
        suggestions = await adaptation_service.suggest_enhancements(content_id, adaptation_type)
        return suggestions
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting suggestions for {content_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/batch")
async def create_batch_adaptations(requests: List[ContentAdaptationRequest]):
    """
    Create multiple adaptations in batch
    
    Useful for creating multiple format adaptations of the same content
    """
    try:
        if len(requests) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 adaptations per batch")
        
        results = []
        errors = []
        
        for i, request in enumerate(requests):
            try:
                adaptation = await adaptation_service.create_adaptation(request)
                results.append({
                    "index": i,
                    "status": "success",
                    "adaptation": adaptation
                })
            except Exception as e:
                errors.append({
                    "index": i,
                    "status": "error",
                    "error": str(e)
                })
        
        return {
            "results": results,
            "errors": errors,
            "total_requested": len(requests),
            "successful": len(results),
            "failed": len(errors)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch adaptation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/formats/preview")
async def preview_adaptation_formats():
    """
    Get preview examples of different adaptation formats
    
    Returns sample outputs for each adaptation type to help users
    understand what each format produces.
    """
    sample_text = '''
    Sarah walked into the dimly lit room, her heart pounding with anticipation. 
    "Is anyone there?" she called out, her voice echoing off the walls.
    A shadow moved in the corner, and a deep voice replied, "I've been waiting for you."
    '''
    
    previews = {}
    
    try:
        # Generate preview for each adaptation type
        for adaptation_type in AdaptationType:
            preview_content = await adaptation_service._generate_adaptation(
                sample_text, 
                adaptation_type.value, 
                "preview"
            )
            
            previews[adaptation_type.value] = {
                "type": adaptation_type.value,
                "sample_input": sample_text.strip(),
                "sample_output": preview_content[:500] + "..." if len(preview_content) > 500 else preview_content
            }
        
        return {
            "format_previews": previews,
            "note": "These are sample outputs. Actual adaptations will be more detailed and context-aware."
        }
        
    except Exception as e:
        logger.error(f"Error generating format previews: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/analytics/{content_id}")
async def get_adaptation_analytics(content_id: str):
    """
    Get analytics for content adaptations
    
    Returns metrics about adaptation performance, popularity, and usage.
    """
    try:
        adaptations = await adaptation_service.list_adaptations(content_id=content_id)
        
        # Calculate analytics
        total_adaptations = len(adaptations)
        adaptation_types = {}
        
        for adaptation in adaptations:
            adapt_type = adaptation.get("adaptation_type", "unknown")
            adaptation_types[adapt_type] = adaptation_types.get(adapt_type, 0) + 1
        
        # Most popular adaptation type
        most_popular = max(adaptation_types.items(), key=lambda x: x[1]) if adaptation_types else ("none", 0)
        
        return {
            "content_id": content_id,
            "total_adaptations": total_adaptations,
            "adaptation_breakdown": adaptation_types,
            "most_popular_type": {
                "type": most_popular[0],
                "count": most_popular[1]
            },
            "available_rights": await adaptation_service.get_adaptation_rights(content_id)
        }
        
    except Exception as e:
        logger.error(f"Error getting adaptation analytics for {content_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")