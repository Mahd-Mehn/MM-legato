# Legato AI Enhancement Service

The AI Enhancement Service provides intelligent content processing capabilities for the Legato platform, including automatic translation, audiobook generation, and content adaptation tools.

## Features

### 1. Automatic Translation System ✅

The translation system provides multi-language support with quality assessment and manual editing capabilities.

#### Key Features:
- **Language Detection**: Automatic detection of source language with confidence scoring
- **Multi-Provider Translation**: Support for Google Translate API and fallback to googletrans library
- **Quality Assessment**: Automatic quality scoring (Excellent, Good, Fair, Poor) based on confidence
- **Manual Editing**: Human editors can improve translations with edit history tracking
- **Caching**: Redis-based caching for improved performance and cost reduction
- **Translation Sync**: Synchronization system for when original content is updated
- **Background Processing**: Low-priority translations processed asynchronously

#### Supported Languages:
- English (en), Spanish (es), French (fr), German (de), Italian (it)
- Portuguese (pt), Russian (ru), Japanese (ja), Korean (ko), Chinese (zh)
- Arabic (ar), Hindi (hi), Swahili (sw), Yoruba (yo), Hausa (ha)
- Igbo (ig), Amharic (am), Oromo (om), Tigrinya (ti)

#### API Endpoints:

```bash
# Detect language
POST /translation/detect-language
{
  "text": "Hello, this is a test message."
}

# Translate content
POST /translation/translate
{
  "content_id": "story-123",
  "content_type": "chapter",
  "source_text": "Hello world",
  "source_language": "en",
  "target_language": "es",
  "user_id": "user-456",
  "priority": 3
}

# Get translation
GET /translation/translation/{translation_id}

# Get all translations for content
GET /translation/content/{content_id}/translations

# Edit translation
PUT /translation/translation/{translation_id}/edit
{
  "edited_text": "Improved translation",
  "editor_id": "editor-789",
  "edit_notes": "Fixed grammar and context"
}

# Sync translations
POST /translation/sync
{
  "original_content_id": "story-123",
  "translation_ids": ["trans-1", "trans-2"],
  "sync_type": "update"
}

# Get supported languages
GET /translation/languages

# Get translation status summary
GET /translation/content/{content_id}/translation-status
```

### 2. AI Audiobook Generation ✅

The audiobook generation system converts text content into high-quality audio with synchronization markers and mobile optimization.

#### Key Features:
- **Multi-Provider TTS**: Support for ElevenLabs, Azure Speech Services, and Google TTS
- **Voice Selection**: Configurable voices for different languages and genders
- **Synchronization Markers**: Audio-text synchronization for enhanced user experience
- **Mobile Optimization**: Adaptive quality and streaming chunks for mobile devices
- **Multi-language Support**: Support for English, Spanish, French, German, and more
- **Chapter-level Processing**: Consistent narration across story chapters
- **Quality Control**: Speed adjustment and voice consistency
- **Error Handling**: Robust error handling and fallback mechanisms

#### Supported Voices:
- **English**: Aria (Female), Davis (Male), Guy (Narrator)
- **Spanish**: Elvira (Female), Alvaro (Male)
- **French**: Denise (Female), Henri (Male)
- **German**: Katja (Female), Conrad (Male)

#### API Endpoints:

```bash
# Generate audiobook
POST /audiobook/generate
{
  "content_id": "story_123_chapter_1",
  "text": "Chapter content to convert to audio...",
  "language": "en",
  "voice_id": "en-US-AriaNeural",
  "speed": 1.0,
  "user_id": "user_123"
}

# Get audiobook details
GET /audiobook/{audiobook_id}

# Get audiobooks by content
GET /audiobook/content/{content_id}

# Delete audiobook
DELETE /audiobook/{audiobook_id}

# Mobile optimization
POST /audiobook/{audiobook_id}/optimize-mobile

# Get synchronization markers
GET /audiobook/{audiobook_id}/sync-markers

# Get available voices
GET /audiobook/voices/available?language=en

# Get generation status
GET /audiobook/{audiobook_id}/status
```

### 3. Content Adaptation Tools (Planned)

Coming next: Script generation for comics, films, and games.

## Architecture

### Database Schema

**MongoDB Collections:**

```javascript
// translations collection
{
  translation_id: "uuid",
  content_id: "uuid",
  content_type: "story|chapter",
  source_text: "string",
  translated_text: "string",
  source_language: "string",
  target_language: "string",
  user_id: "uuid",
  quality_score: "excellent|good|fair|poor",
  confidence: 0.85,
  status: "pending|in_progress|completed|failed|manual_review",
  priority: 3,
  created_at: "datetime",
  completed_at: "datetime",
  updated_at: "datetime",
  edits: [
    {
      editor_id: "uuid",
      original_text: "string",
      edited_text: "string",
      edit_notes: "string",
      edited_at: "datetime"
    }
  ]
}

// audiobooks collection
{
  audiobook_id: "uuid",
  content_id: "uuid",
  user_id: "uuid",
  language: "string",
  voice_id: "string",
  speed: 1.0,
  status: "processing|completed|failed",
  audio_url: "string",
  duration: 125.5,
  sync_markers: [
    {
      sentence_index: 0,
      text: "string",
      start_time: 0.0,
      end_time: 3.2
    }
  ],
  mobile_optimized: false,
  optimization_data: {},
  created_at: "datetime",
  completed_at: "datetime",
  error: "string"
}
```

**Redis Caching:**
- Translation cache: `translation:{hash}:{source_lang}:{target_lang}`
- Cache TTL: 24 hours for translations
- Cache invalidation on content updates

### Service Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FastAPI App   │────│ Translation      │────│   Google        │
│                 │    │ Service          │    │   Translate API │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │              ┌─────────────────┐
         │                       └──────────────│   googletrans   │
         │                                      │   (fallback)    │
         │              ┌──────────────────┐    └─────────────────┘
         │              │ Audiobook        │    ┌─────────────────┐
         │──────────────│ Service          │────│   ElevenLabs    │
         │              └──────────────────┘    │   Azure Speech  │
         │                       │              │   Google TTS    │
         │                       │              └─────────────────┘
         │
┌─────────────────┐    ┌──────────────────┐
│    MongoDB      │    │      Redis       │
│ (Translations,  │    │    (Caching)     │
│  Audiobooks)    │    │                  │
└─────────────────┘    └──────────────────┘
```

## Configuration

### Environment Variables

```bash
# Database connections
MONGODB_URL=mongodb://localhost:27017/legato_ai
REDIS_URL=redis://localhost:6379/5

# Translation API
GOOGLE_TRANSLATE_API_KEY=your_api_key_here

# Audiobook TTS APIs
ELEVENLABS_API_KEY=your_elevenlabs_key
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=eastus
GOOGLE_CLOUD_KEY=your_google_cloud_key

# Service configuration
SERVICE_PORT=8006
```

### Docker Configuration

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8006

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8006"]
```

## Installation and Setup

1. **Install dependencies:**
```bash
cd services/ai-service
pip install -r requirements.txt
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the service:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8006 --reload
```

4. **Run tests:**
```bash
# Translation tests
pytest test_translation.py -v
pytest test_translation_api.py -v

# Audiobook tests
pytest test_audiobook.py -v
pytest test_audiobook_api.py -v
python test_audiobook_integration.py
python simple_audiobook_test.py
```

## Usage Examples

### Basic Translation Workflow

```python
import httpx

# 1. Detect language
response = await client.post("/translation/detect-language", json={
    "text": "Bonjour, comment allez-vous?"
})
# Returns: {"detected_language": "fr", "confidence": 0.95}

# 2. Translate content
response = await client.post("/translation/translate", json={
    "content_id": "chapter-123",
    "content_type": "chapter",
    "source_text": "Bonjour, comment allez-vous?",
    "source_language": "fr",
    "target_language": "en",
    "user_id": "user-456",
    "priority": 4
})

# 3. Get translation result
translation_id = response.json()["translation_id"]
response = await client.get(f"/translation/translation/{translation_id}")

# 4. Edit if needed
await client.put(f"/translation/translation/{translation_id}/edit", json={
    "edited_text": "Hello, how are you doing?",
    "editor_id": "editor-789",
    "edit_notes": "More natural English phrasing"
})
```

### Batch Translation Management

```python
# Get all translations for a story
response = await client.get("/translation/content/story-123/translations")
translations = response.json()

# Check translation status
response = await client.get("/translation/content/story-123/translation-status")
status = response.json()
print(f"Total translations: {status['total_translations']}")
print(f"Completed: {status['by_status']['completed']}")

# Sync translations after content update
await client.post("/translation/sync", json={
    "original_content_id": "story-123",
    "translation_ids": [t["translation_id"] for t in translations],
    "sync_type": "update"
})
```

## Quality Assurance

### Translation Quality Levels

- **Excellent (90-100%)**: Ready for publication, minimal editing needed
- **Good (70-89%)**: Good quality, may need minor adjustments
- **Fair (50-69%)**: Acceptable but requires review and editing
- **Poor (<50%)**: Needs significant manual editing or retranslation

### Quality Improvement Workflow

1. **Automatic Assessment**: AI service provides initial quality score
2. **Manual Review**: Human editors review translations marked as Fair or Poor
3. **Edit Tracking**: All manual edits are tracked with editor attribution
4. **Quality Upgrade**: Manual edits automatically upgrade quality to Excellent
5. **Feedback Loop**: Quality patterns inform future translation improvements

## Performance Considerations

### Caching Strategy
- **Cache Hit Rate**: Target 70%+ for repeated content
- **Cache Invalidation**: Smart invalidation on content updates
- **Memory Usage**: Redis memory optimization for large translation volumes

### Scaling
- **Background Processing**: Low-priority translations processed asynchronously
- **Rate Limiting**: API rate limiting to prevent abuse
- **Load Balancing**: Multiple service instances for high availability

### Cost Optimization
- **API Usage**: Intelligent fallback to reduce API costs
- **Batch Processing**: Group similar translations for efficiency
- **Cache First**: Always check cache before external API calls

## Monitoring and Logging

### Health Checks
- Database connectivity (MongoDB, Redis)
- External API availability (Google Translate)
- Service response times and error rates

### Metrics
- Translation requests per minute
- Cache hit/miss ratios
- Quality score distributions
- API cost tracking

### Alerts
- High error rates (>5%)
- API quota approaching limits
- Database connection failures
- Unusual translation patterns

## Security

### Data Protection
- Content encryption in transit and at rest
- API key secure storage and rotation
- User data privacy compliance

### Access Control
- Service-to-service authentication
- Rate limiting per user/service
- Audit logging for all translation operations

## Future Enhancements

### Planned Features
1. **Custom Translation Models**: Domain-specific translation models
2. **Translation Memory**: Reuse of previous translations for consistency
3. **Collaborative Translation**: Multiple editors working on same content
4. **Quality Prediction**: ML models to predict translation quality
5. **Real-time Translation**: WebSocket-based real-time translation updates

### Integration Roadmap
1. **Content Service Integration**: Direct integration with content management
2. **User Service Integration**: User preference-based translation settings
3. **Analytics Integration**: Translation performance analytics
4. **Payment Integration**: Translation cost tracking and billing

## Contributing

### Development Guidelines
1. Follow FastAPI best practices
2. Write comprehensive tests for all features
3. Document all API endpoints with examples
4. Use type hints throughout the codebase
5. Follow async/await patterns consistently

### Testing Requirements
- Unit tests for all service methods
- Integration tests for API endpoints
- Mock external dependencies in tests
- Achieve >90% code coverage

This translation system provides a robust foundation for multi-language content support in the Legato platform, with built-in quality assurance and scalability features.