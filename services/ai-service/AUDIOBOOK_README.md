# Audiobook Generation Service

## Overview

The Audiobook Generation Service is part of the Legato AI Enhancement Service that converts text content into high-quality audio with synchronization markers. This service supports multiple TTS providers, voice selection, and mobile optimization for streaming.

## Features

### ✅ Implemented Features

- **Text-to-Speech Integration**: Support for multiple TTS providers (ElevenLabs, Azure Speech, Google TTS)
- **Voice Selection**: Configurable voices for different languages and genders
- **Synchronization Markers**: Audio-text synchronization for enhanced user experience
- **Mobile Optimization**: Adaptive quality and streaming chunks for mobile devices
- **Multi-language Support**: Support for English, Spanish, French, German, and more
- **Chapter-level Processing**: Consistent narration across story chapters
- **Quality Control**: Speed adjustment and voice consistency
- **Error Handling**: Robust error handling and fallback mechanisms

## API Endpoints

### Generate Audiobook
```http
POST /audiobook/generate
```

**Request Body:**
```json
{
  "content_id": "story_123_chapter_1",
  "text": "Chapter content to convert to audio...",
  "language": "en",
  "voice_id": "en-US-AriaNeural",
  "speed": 1.0,
  "user_id": "user_123"
}
```

**Response:**
```json
{
  "audiobook_id": "audiobook_456",
  "content_id": "story_123_chapter_1",
  "audio_url": "/audio/audiobook_456.mp3",
  "duration": 125.5,
  "language": "en",
  "voice_id": "en-US-AriaNeural",
  "status": "completed",
  "created_at": "2025-01-11T10:30:00Z"
}
```

### Get Audiobook Details
```http
GET /audiobook/{audiobook_id}
```

### Get Audiobooks by Content
```http
GET /audiobook/content/{content_id}
```

### Delete Audiobook
```http
DELETE /audiobook/{audiobook_id}
```

### Mobile Optimization
```http
POST /audiobook/{audiobook_id}/optimize-mobile
```

### Get Synchronization Markers
```http
GET /audiobook/{audiobook_id}/sync-markers
```

**Response:**
```json
{
  "audiobook_id": "audiobook_456",
  "sync_markers": [
    {
      "sentence_index": 0,
      "text": "This is the first sentence.",
      "start_time": 0.0,
      "end_time": 3.2
    },
    {
      "sentence_index": 1,
      "text": "This is the second sentence.",
      "start_time": 3.2,
      "end_time": 6.8
    }
  ],
  "total_markers": 2,
  "duration": 6.8
}
```

### Get Available Voices
```http
GET /audiobook/voices/available?language=en
```

**Response:**
```json
{
  "language": "en",
  "voices": [
    {
      "id": "en-US-AriaNeural",
      "name": "Aria",
      "gender": "female",
      "description": "Natural female voice"
    },
    {
      "id": "en-US-DavisNeural",
      "name": "Davis",
      "gender": "male",
      "description": "Natural male voice"
    }
  ]
}
```

### Get Generation Status
```http
GET /audiobook/{audiobook_id}/status
```

## TTS Provider Configuration

### ElevenLabs (Premium)
```bash
export ELEVENLABS_API_KEY="your_api_key_here"
```

### Azure Speech Services
```bash
export AZURE_SPEECH_KEY="your_speech_key"
export AZURE_SPEECH_REGION="eastus"
```

### Google Cloud TTS
```bash
export GOOGLE_CLOUD_KEY="your_google_cloud_key"
```

## Voice Configurations

### English (en)
- **Default**: en-US-AriaNeural (Female)
- **Male**: en-US-DavisNeural
- **Female**: en-US-AriaNeural
- **Narrator**: en-US-GuyNeural

### Spanish (es)
- **Default**: es-ES-ElviraNeural (Female)
- **Male**: es-ES-AlvaroNeural
- **Female**: es-ES-ElviraNeural

### French (fr)
- **Default**: fr-FR-DeniseNeural (Female)
- **Male**: fr-FR-HenriNeural
- **Female**: fr-FR-DeniseNeural

### German (de)
- **Default**: de-DE-KatjaNeural (Female)
- **Male**: de-DE-ConradNeural
- **Female**: de-DE-KatjaNeural

## Technical Implementation

### Audio Generation Flow

1. **Text Processing**: Split content into sentences for better synchronization
2. **Voice Selection**: Choose appropriate voice based on language and preferences
3. **TTS Generation**: Convert text to audio using preferred provider
4. **Synchronization**: Generate timing markers for each sentence
5. **Storage**: Store audio file and metadata in database
6. **Optimization**: Create mobile-optimized versions if requested

### Synchronization Markers

Each audiobook includes synchronization markers that map text segments to audio timestamps:

```json
{
  "sentence_index": 0,
  "text": "The actual sentence text",
  "start_time": 0.0,
  "end_time": 3.2
}
```

This enables:
- Highlighting text as audio plays
- Seeking to specific text positions
- Enhanced accessibility features
- Interactive reading experiences

### Mobile Optimization

The service provides mobile-specific optimizations:

- **Adaptive Quality**: Multiple bitrate versions (128kbps, 64kbps)
- **Streaming Chunks**: Split audio into smaller segments for progressive loading
- **Compression**: Optimized audio compression for mobile networks
- **Caching**: CDN-friendly URLs for global distribution

## Database Schema

### Audiobooks Collection
```javascript
{
  audiobook_id: "uuid",
  content_id: "string",
  user_id: "string",
  language: "string",
  voice_id: "string",
  speed: "number",
  status: "processing|completed|failed",
  audio_url: "string",
  duration: "number",
  sync_markers: [
    {
      sentence_index: "number",
      text: "string",
      start_time: "number",
      end_time: "number"
    }
  ],
  mobile_optimized: "boolean",
  optimization_data: "object",
  created_at: "datetime",
  completed_at: "datetime",
  error: "string"
}
```

## Error Handling

### Common Error Scenarios

1. **Empty Text**: Returns 400 Bad Request
2. **Text Too Long**: Returns 400 Bad Request (max 50,000 characters)
3. **TTS Service Unavailable**: Falls back to alternative provider
4. **Invalid Voice ID**: Uses default voice for language
5. **Storage Failure**: Returns 500 with error details

### Fallback Strategy

1. **ElevenLabs** (Premium quality)
2. **Azure Speech Services** (High quality)
3. **Google TTS** (Basic quality, free)

## Testing

### Run Unit Tests
```bash
python -m pytest test_audiobook.py -v
```

### Run Integration Tests
```bash
python test_audiobook_integration.py
```

### Run Simple Functionality Test
```bash
python simple_audiobook_test.py
```

## Performance Considerations

### Processing Time
- Short chapters (< 1000 words): 30-60 seconds
- Medium chapters (1000-5000 words): 2-5 minutes
- Long chapters (> 5000 words): 5-15 minutes

### Storage Requirements
- Audio files: ~1MB per minute of audio
- Metadata: ~1KB per audiobook record
- Sync markers: ~100 bytes per sentence

### Scalability
- Async processing for multiple requests
- Background task queuing for large content
- CDN distribution for global access
- Database indexing on content_id and user_id

## Requirements Fulfilled

This implementation addresses the following requirements from the Legato platform:

- **Requirement 6.2**: AI audiobook generation with voice selection
- **Requirement 6.5**: Audio quality optimization for mobile streaming
- **Requirement 4.4**: Mobile-optimized content consumption

## Future Enhancements

### Planned Features
- **Voice Cloning**: Custom voice generation for authors
- **Emotion Detection**: Adjust voice tone based on content sentiment
- **Background Music**: Add ambient music for enhanced experience
- **Multi-speaker**: Different voices for dialogue and narration
- **Real-time Generation**: Streaming TTS for live content

### Integration Opportunities
- **Content Service**: Automatic audiobook generation on chapter publish
- **User Service**: Voice preference storage and recommendations
- **Payment Service**: Premium voice access and quality tiers
- **Analytics Service**: Listening behavior and engagement tracking

## Support

For technical support or feature requests related to audiobook generation:

1. Check the error logs in the service
2. Verify TTS provider API keys and quotas
3. Test with simple content first
4. Review voice availability for target language
5. Check mobile optimization settings

## License

This audiobook generation service is part of the Legato platform and follows the same licensing terms.