# Content Publishing Workflow

This document describes the content publishing workflow implementation for the Legato Platform content management service.

## Overview

The content publishing workflow provides comprehensive functionality for:

1. **Story Creation with IP Fingerprinting** - Automatic intellectual property protection
2. **Chapter Publishing with Version History** - Complete content versioning and tracking
3. **Content Moderation and Approval** - Automated and manual content review processes
4. **Monetization Configuration** - Flexible pricing and access control

## Key Components

### 1. IP Fingerprinting Service (`IPFingerprintService`)

Generates unique fingerprints for stories and chapters to establish intellectual property ownership.

**Features:**
- Story-level fingerprinting based on metadata and authorship
- Chapter-level fingerprinting based on content and story context
- Deterministic hash generation for consistent IP tracking
- Blockchain-ready fingerprint format

**Usage:**
```python
fingerprint = IPFingerprintService.generate_story_fingerprint(story_data)
chapter_fingerprint = IPFingerprintService.generate_chapter_fingerprint(content, story_id, chapter_number)
```

### 2. Content Moderation Service (`ContentModerationService`)

Automated content review and approval workflows with configurable rules.

**Features:**
- Story metadata validation (title, description, genre, tags)
- Chapter content validation (length, quality, appropriateness)
- Adult content flagging for manual review
- Premium content pricing validation
- Configurable moderation rules and severity levels

**Moderation Results:**
- `approved`: Content passes all validation rules
- `requires_review`: Content needs manual review (warnings present)
- `issues`: List of validation errors that prevent publication
- `warnings`: List of concerns that require review

### 3. Publishing Workflow Service (`PublishingWorkflowService`)

Main orchestration service for content creation, updating, and publishing.

#### Story Management

**Create Story:**
```python
story = publishing_service.create_story(story_request, author_id)
```
- Validates story metadata
- Generates unique slug and IP fingerprint
- Sets initial status to DRAFT
- Sanitizes all text content

**Update Story:**
```python
story = publishing_service.update_story(story_id, update_request, author_id)
```
- Validates ownership and permissions
- Updates specified fields only
- Regenerates slug if title changes
- Maintains version history

**Publish Story:**
```python
story = publishing_service.publish_story(story_id, author_id)
```
- Requires at least one published chapter
- Runs content moderation checks
- Updates status to PUBLISHED
- Sets publication timestamp

#### Chapter Management

**Create Chapter:**
```python
chapter = publishing_service.create_chapter(story_id, chapter_request, author_id)
```
- Validates story ownership
- Prevents duplicate chapter numbers
- Generates content hash for IP protection
- Creates initial version snapshot
- Calculates word count automatically

**Update Chapter:**
```python
chapter = publishing_service.update_chapter(chapter_id, update_request, author_id)
```
- Creates version snapshot before changes
- Updates content hash and word count
- Increments version number
- Tracks change summaries
- Updates story statistics

**Publish Chapter:**
```python
chapter = publishing_service.publish_chapter(chapter_id, author_id)
```
- Runs content moderation
- Updates status to PUBLISHED
- Sets publication timestamp
- Updates story statistics

**Schedule Chapter:**
```python
chapter = publishing_service.schedule_chapter_publish(chapter_id, publish_time, author_id)
```
- Validates future publish time
- Sets status to SCHEDULED
- Enables automated publishing

#### Version Management

**Get Version History:**
```python
versions = publishing_service.get_chapter_versions(chapter_id, author_id)
```

**Revert to Previous Version:**
```python
chapter = publishing_service.revert_chapter_version(chapter_id, version_number, author_id)
```
- Creates pre-revert snapshot
- Restores content from target version
- Creates new version entry for revert
- Maintains complete audit trail

#### Monetization Configuration

**Configure Story Monetization:**
```python
story = publishing_service.configure_monetization(story_id, config, author_id)
```

Supported monetization types:
- `FREE`: No payment required
- `COINS`: Pay per chapter with platform coins
- `SUBSCRIPTION`: Requires active subscription
- `PREMIUM`: Both coins and subscription options

Configuration options:
- `monetization_type`: Payment model
- `coin_price_per_chapter`: Default price in coins
- `apply_to_existing_chapters`: Update existing chapters
- `default_premium_status`: Set premium flag for new chapters

### 4. Scheduled Publishing Service (`ScheduledPublishingService`)

Handles automated publishing of scheduled chapters.

**Process Scheduled Chapters:**
```python
results = scheduled_service.process_scheduled_chapters()
```
- Finds chapters scheduled for current time
- Publishes eligible chapters
- Updates story statistics
- Returns processing results

## API Endpoints

### Story Endpoints

- `POST /content/stories` - Create new story
- `GET /content/stories` - List stories with filtering
- `GET /content/stories/{story_id}` - Get specific story
- `PUT /content/stories/{story_id}` - Update story
- `POST /content/stories/{story_id}/publish` - Publish story
- `POST /content/stories/{story_id}/monetization` - Configure monetization
- `GET /content/stories/{story_id}/stats` - Get story statistics

### Chapter Endpoints

- `POST /content/stories/{story_id}/chapters` - Create new chapter
- `GET /content/stories/{story_id}/chapters` - List story chapters
- `GET /content/chapters/{chapter_id}` - Get specific chapter
- `PUT /content/chapters/{chapter_id}` - Update chapter
- `POST /content/chapters/{chapter_id}/publish` - Publish chapter
- `POST /content/chapters/{chapter_id}/schedule` - Schedule publishing
- `GET /content/chapters/{chapter_id}/versions` - Get version history
- `POST /content/chapters/{chapter_id}/revert/{version_number}` - Revert version

### Validation Endpoints

- `POST /content/validate/story` - Validate story before creation
- `POST /content/validate/chapter` - Validate chapter before creation

### Admin Endpoints

- `POST /content/admin/process-scheduled` - Process scheduled chapters

## Content Validation

### Story Validation Rules

1. **Title Requirements:**
   - Length: 1-200 characters
   - No profanity or spam content
   - Required field

2. **Description:**
   - Maximum 2,000 characters
   - Optional field
   - Profanity filtering

3. **Synopsis:**
   - Maximum 5,000 characters
   - Optional field
   - Profanity filtering

4. **Genre:**
   - Must be from allowed genres list
   - Required field

5. **Tags:**
   - Maximum 10 tags
   - Each tag maximum 50 characters

### Chapter Validation Rules

1. **Title Requirements:**
   - Length: 1-200 characters
   - No profanity
   - Required field

2. **Content Requirements:**
   - Minimum 100 characters
   - Maximum 50,000 characters
   - Profanity and spam detection
   - HTML sanitization

3. **Premium Content:**
   - Must have coin price > 0 if premium
   - Pricing validation

## Security Features

### Content Protection

1. **IP Fingerprinting:**
   - SHA-256 content hashing
   - Immutable original content hash
   - Version-specific hashes

2. **Content Sanitization:**
   - HTML tag filtering
   - XSS prevention
   - Content encoding

3. **Access Control:**
   - Author ownership verification
   - Permission-based operations
   - Secure UUID handling

### Data Integrity

1. **Version History:**
   - Complete change tracking
   - Immutable version snapshots
   - Audit trail maintenance

2. **Content Backup:**
   - Automatic version creation
   - Integrity verification
   - Recovery capabilities

## Error Handling

The system provides comprehensive error handling:

- **Validation Errors:** Detailed field-specific error messages
- **Permission Errors:** Clear access denied messages
- **Business Logic Errors:** Contextual error descriptions
- **System Errors:** Graceful failure handling

## Testing

Comprehensive test suite covers:

- IP fingerprinting functionality
- Content moderation workflows
- Publishing service operations
- API endpoint behavior
- Error scenarios and edge cases

Run tests:
```bash
python -m pytest test_publishing_workflow.py -v
```

## Integration Points

### Auth Service Integration
- User authentication and authorization
- Author identity verification
- Permission management

### User Service Integration
- Subscription status checking
- Coin balance verification
- User preference handling

### Payment Service Integration
- Monetization processing
- Revenue tracking
- Transaction management

## Performance Considerations

1. **Database Optimization:**
   - Indexed fields for fast queries
   - Efficient pagination
   - Connection pooling

2. **Content Processing:**
   - Asynchronous validation
   - Batch operations for scheduled publishing
   - Caching for frequently accessed content

3. **Scalability:**
   - Stateless service design
   - Horizontal scaling support
   - Background task processing

## Monitoring and Logging

Key metrics to monitor:
- Story creation and publication rates
- Chapter publishing frequency
- Content moderation results
- Version history growth
- API response times

## Future Enhancements

Planned improvements:
- AI-powered content quality scoring
- Advanced plagiarism detection
- Multi-language content support
- Enhanced monetization models
- Real-time collaboration features