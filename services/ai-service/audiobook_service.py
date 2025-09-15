import os
import uuid
import asyncio
import json
from datetime import datetime
from typing import Optional, Dict, List, Any
from io import BytesIO
import base64

# TTS API integrations
import httpx
from gtts import gTTS
import tempfile

from models import AudiobookRequest, AudiobookResponse
from database import db_manager

class AudiobookService:
    def __init__(self):
        self.elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        self.azure_speech_key = os.getenv("AZURE_SPEECH_KEY")
        self.azure_speech_region = os.getenv("AZURE_SPEECH_REGION", "eastus")
        self.google_cloud_key = os.getenv("GOOGLE_CLOUD_KEY")
        
        # Voice configurations for different languages and genres
        self.voice_configs = {
            "en": {
                "default": "en-US-AriaNeural",
                "male": "en-US-DavisNeural", 
                "female": "en-US-AriaNeural",
                "narrator": "en-US-GuyNeural"
            },
            "es": {
                "default": "es-ES-ElviraNeural",
                "male": "es-ES-AlvaroNeural",
                "female": "es-ES-ElviraNeural"
            },
            "fr": {
                "default": "fr-FR-DeniseNeural",
                "male": "fr-FR-HenriNeural",
                "female": "fr-FR-DeniseNeural"
            },
            "de": {
                "default": "de-DE-KatjaNeural",
                "male": "de-DE-ConradNeural",
                "female": "de-DE-KatjaNeural"
            }
        }

    async def generate_audiobook(self, request: AudiobookRequest) -> AudiobookResponse:
        """Generate audiobook from text content"""
        try:
            audiobook_id = str(uuid.uuid4())
            
            # Store initial record
            audiobook_data = {
                "audiobook_id": audiobook_id,
                "content_id": request.content_id,
                "user_id": request.user_id,
                "language": request.language,
                "voice_id": request.voice_id or self._get_default_voice(request.language),
                "speed": request.speed,
                "status": "processing",
                "created_at": datetime.utcnow(),
                "text_length": len(request.text),
                "sync_markers": []
            }
            
            collection = await db_manager.get_audiobook_collection()
            await collection.insert_one(audiobook_data)
            
            # Generate audio with synchronization markers
            audio_result = await self._generate_audio_with_sync(
                text=request.text,
                language=request.language,
                voice_id=audiobook_data["voice_id"],
                speed=request.speed
            )
            
            # Store audio file and update record
            audio_url = await self._store_audio_file(audiobook_id, audio_result["audio_data"])
            
            # Update audiobook record
            await collection.update_one(
                {"audiobook_id": audiobook_id},
                {
                    "$set": {
                        "audio_url": audio_url,
                        "duration": audio_result["duration"],
                        "sync_markers": audio_result["sync_markers"],
                        "status": "completed",
                        "completed_at": datetime.utcnow()
                    }
                }
            )
            
            return AudiobookResponse(
                audiobook_id=audiobook_id,
                content_id=request.content_id,
                audio_url=audio_url,
                duration=audio_result["duration"],
                language=request.language,
                voice_id=audiobook_data["voice_id"],
                status="completed",
                created_at=audiobook_data["created_at"]
            )
            
        except Exception as e:
            # Update status to failed
            if 'audiobook_id' in locals():
                collection = await db_manager.get_audiobook_collection()
                await collection.update_one(
                    {"audiobook_id": audiobook_id},
                    {
                        "$set": {
                            "status": "failed",
                            "error": str(e),
                            "failed_at": datetime.utcnow()
                        }
                    }
                )
            raise Exception(f"Audiobook generation failed: {str(e)}")

    async def _generate_audio_with_sync(self, text: str, language: str, voice_id: str, speed: float) -> Dict[str, Any]:
        """Generate audio with synchronization markers"""
        
        # Split text into sentences for better synchronization
        sentences = self._split_into_sentences(text)
        
        # Try different TTS providers in order of preference
        if self.elevenlabs_api_key:
            return await self._generate_with_elevenlabs(sentences, voice_id, speed)
        elif self.azure_speech_key:
            return await self._generate_with_azure(sentences, language, voice_id, speed)
        else:
            # Fallback to Google TTS (free but lower quality)
            return await self._generate_with_gtts(sentences, language, speed)

    async def _generate_with_elevenlabs(self, sentences: List[str], voice_id: str, speed: float) -> Dict[str, Any]:
        """Generate audio using ElevenLabs API"""
        try:
            async with httpx.AsyncClient() as client:
                audio_segments = []
                sync_markers = []
                current_time = 0.0
                
                for i, sentence in enumerate(sentences):
                    response = await client.post(
                        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                        headers={
                            "Accept": "audio/mpeg",
                            "Content-Type": "application/json",
                            "xi-api-key": self.elevenlabs_api_key
                        },
                        json={
                            "text": sentence,
                            "model_id": "eleven_monolingual_v1",
                            "voice_settings": {
                                "stability": 0.5,
                                "similarity_boost": 0.5,
                                "speed": speed
                            }
                        }
                    )
                    
                    if response.status_code == 200:
                        audio_data = response.content
                        audio_segments.append(audio_data)
                        
                        # Estimate duration (rough calculation)
                        estimated_duration = len(sentence.split()) * 0.6 / speed
                        
                        sync_markers.append({
                            "sentence_index": i,
                            "text": sentence,
                            "start_time": current_time,
                            "end_time": current_time + estimated_duration
                        })
                        
                        current_time += estimated_duration
                    else:
                        raise Exception(f"ElevenLabs API error: {response.status_code}")
                
                # Combine audio segments
                combined_audio = b''.join(audio_segments)
                
                return {
                    "audio_data": combined_audio,
                    "duration": current_time,
                    "sync_markers": sync_markers,
                    "format": "mp3"
                }
                
        except Exception as e:
            raise Exception(f"ElevenLabs generation failed: {str(e)}")

    async def _generate_with_azure(self, sentences: List[str], language: str, voice_id: str, speed: float) -> Dict[str, Any]:
        """Generate audio using Azure Speech Services"""
        try:
            # Azure Speech SDK would be used here
            # For now, implementing a placeholder that shows the structure
            
            sync_markers = []
            current_time = 0.0
            
            # Create SSML for better control
            ssml_parts = []
            for i, sentence in enumerate(sentences):
                # Add timing markers
                ssml_parts.append(f'<mark name="sentence_{i}"/>{sentence}')
                
                estimated_duration = len(sentence.split()) * 0.6 / speed
                sync_markers.append({
                    "sentence_index": i,
                    "text": sentence,
                    "start_time": current_time,
                    "end_time": current_time + estimated_duration
                })
                current_time += estimated_duration
            
            ssml_text = f'''
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="{language}">
                <voice name="{voice_id}">
                    <prosody rate="{speed}">
                        {' '.join(ssml_parts)}
                    </prosody>
                </voice>
            </speak>
            '''
            
            # Placeholder for actual Azure Speech synthesis
            # In real implementation, this would call Azure Speech SDK
            audio_data = b"placeholder_audio_data"  # Would be actual audio from Azure
            
            return {
                "audio_data": audio_data,
                "duration": current_time,
                "sync_markers": sync_markers,
                "format": "wav"
            }
            
        except Exception as e:
            raise Exception(f"Azure Speech generation failed: {str(e)}")

    async def _generate_with_gtts(self, sentences: List[str], language: str, speed: float) -> Dict[str, Any]:
        """Generate audio using Google Text-to-Speech (fallback)"""
        try:
            audio_segments = []
            sync_markers = []
            current_time = 0.0
            
            for i, sentence in enumerate(sentences):
                # Create temporary file for each sentence
                with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
                    tts = gTTS(text=sentence, lang=language[:2], slow=(speed < 1.0))
                    tts.save(temp_file.name)
                    
                    # Read audio data
                    with open(temp_file.name, 'rb') as audio_file:
                        audio_data = audio_file.read()
                        audio_segments.append(audio_data)
                    
                    # Clean up temp file
                    os.unlink(temp_file.name)
                
                # Estimate duration
                estimated_duration = len(sentence.split()) * 0.6 / speed
                
                sync_markers.append({
                    "sentence_index": i,
                    "text": sentence,
                    "start_time": current_time,
                    "end_time": current_time + estimated_duration
                })
                
                current_time += estimated_duration
            
            # Combine audio segments (simplified - in production would use audio processing library)
            combined_audio = b''.join(audio_segments)
            
            return {
                "audio_data": combined_audio,
                "duration": current_time,
                "sync_markers": sync_markers,
                "format": "mp3"
            }
            
        except Exception as e:
            raise Exception(f"Google TTS generation failed: {str(e)}")

    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences for better synchronization"""
        import re
        
        # Simple sentence splitting - in production would use more sophisticated NLP
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # Ensure sentences aren't too long (split long sentences)
        final_sentences = []
        for sentence in sentences:
            if len(sentence) > 200:  # Split very long sentences
                parts = sentence.split(',')
                current_part = ""
                for part in parts:
                    if len(current_part + part) < 200:
                        current_part += part + ","
                    else:
                        if current_part:
                            final_sentences.append(current_part.rstrip(','))
                        current_part = part + ","
                if current_part:
                    final_sentences.append(current_part.rstrip(','))
            else:
                final_sentences.append(sentence)
        
        return final_sentences

    def _get_default_voice(self, language: str) -> str:
        """Get default voice for language"""
        lang_code = language[:2].lower()
        return self.voice_configs.get(lang_code, {}).get("default", "en-US-AriaNeural")

    async def _store_audio_file(self, audiobook_id: str, audio_data: bytes) -> str:
        """Store audio file and return URL"""
        # In production, this would upload to cloud storage (S3, Azure Blob, etc.)
        # For now, we'll store in local directory and return a placeholder URL
        
        audio_dir = "audio_files"
        os.makedirs(audio_dir, exist_ok=True)
        
        file_path = os.path.join(audio_dir, f"{audiobook_id}.mp3")
        
        with open(file_path, 'wb') as f:
            f.write(audio_data)
        
        # Return URL (in production would be CDN URL)
        return f"/audio/{audiobook_id}.mp3"

    async def get_audiobook(self, audiobook_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve audiobook by ID"""
        collection = await db_manager.get_audiobook_collection()
        return await collection.find_one({"audiobook_id": audiobook_id})

    async def get_audiobooks_by_content(self, content_id: str) -> List[Dict[str, Any]]:
        """Get all audiobooks for a content piece"""
        collection = await db_manager.get_audiobook_collection()
        cursor = collection.find({"content_id": content_id})
        return await cursor.to_list(length=None)

    async def delete_audiobook(self, audiobook_id: str) -> bool:
        """Delete audiobook and associated files"""
        try:
            collection = await db_manager.get_audiobook_collection()
            audiobook = await collection.find_one({"audiobook_id": audiobook_id})
            
            if audiobook:
                # Delete audio file
                if audiobook.get("audio_url"):
                    file_path = audiobook["audio_url"].replace("/audio/", "audio_files/")
                    if os.path.exists(file_path):
                        os.remove(file_path)
                
                # Delete database record
                await collection.delete_one({"audiobook_id": audiobook_id})
                return True
            
            return False
            
        except Exception as e:
            raise Exception(f"Failed to delete audiobook: {str(e)}")

    async def optimize_for_mobile(self, audiobook_id: str) -> Dict[str, Any]:
        """Optimize audio quality for mobile streaming"""
        try:
            collection = await db_manager.get_audiobook_collection()
            audiobook = await collection.find_one({"audiobook_id": audiobook_id})
            
            if not audiobook:
                raise Exception("Audiobook not found")
            
            # In production, this would:
            # 1. Create multiple quality versions (high, medium, low)
            # 2. Implement adaptive bitrate streaming
            # 3. Generate audio chunks for progressive loading
            
            optimization_result = {
                "audiobook_id": audiobook_id,
                "optimizations": {
                    "mobile_quality": "128kbps",
                    "streaming_chunks": True,
                    "adaptive_bitrate": True,
                    "compression": "optimized"
                },
                "mobile_url": f"/audio/mobile/{audiobook_id}.mp3",
                "chunk_urls": [
                    f"/audio/chunks/{audiobook_id}_chunk_{i}.mp3" 
                    for i in range(1, 6)  # Example chunks
                ]
            }
            
            # Update audiobook record with optimization info
            await collection.update_one(
                {"audiobook_id": audiobook_id},
                {
                    "$set": {
                        "mobile_optimized": True,
                        "optimization_data": optimization_result,
                        "optimized_at": datetime.utcnow()
                    }
                }
            )
            
            return optimization_result
            
        except Exception as e:
            raise Exception(f"Mobile optimization failed: {str(e)}")

# Global service instance
audiobook_service = AudiobookService()