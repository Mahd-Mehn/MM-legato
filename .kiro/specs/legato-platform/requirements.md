# Requirements Document

## Introduction

Legato is a social reading and writing platform that enables readers to discover, read, and interact with books and chapters while providing writers with tools to publish, monetize, and build communities around their stories. The platform combines modern UX with integrated payments, media uploads, and audio generation to create a comprehensive literary ecosystem.

The MVP will be built using Next.js 14 with TypeScript, ShadCN UI, Prisma ORM, PostgreSQL, Stripe for payments, Cloudinary for media storage, and ElevenLabs for audio generation. The platform supports two user roles: Readers and Writers (where Writers have all Reader capabilities plus additional publishing features).

## Requirements

### Requirement 1: User Authentication and Profile Management

**User Story:** As a user, I want to create an account and manage my profile, so that I can access personalized features and maintain my identity on the platform.

#### Acceptance Criteria

1. WHEN a user visits the registration page THEN the system SHALL provide email and password signup functionality
2. WHEN a user provides valid credentials THEN the system SHALL create a new account and log them in
3. WHEN a user logs in with valid credentials THEN the system SHALL authenticate them and redirect to the dashboard
4. WHEN a user accesses their profile THEN the system SHALL allow editing of username and profile picture
5. WHEN a user updates their profile THEN the system SHALL save changes and provide confirmation
6. WHEN a user sets a password for Secret Vault THEN the system SHALL securely store this separate password

### Requirement 2: Dashboard and Navigation System

**User Story:** As a user, I want a centralized dashboard with clear navigation, so that I can easily access all platform features.

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL display the main dashboard
2. WHEN a user views the dashboard THEN the system SHALL provide tabs for Explore, Library, Reading Lists, Community, and Profile
3. WHEN a user is a writer THEN the system SHALL additionally display Writer Dashboard access
4. WHEN a user clicks any navigation tab THEN the system SHALL load the corresponding section
5. WHEN a user toggles dark/light theme THEN the system SHALL persist this preference across sessions
6. WHEN a user views the dashboard on mobile THEN the system SHALL display a bottom navigation bar instead of a sidebar
7. WHEN a user views the dashboard on desktop THEN the system SHALL display a traditional sidebar navigation
8. WHEN a user has recently read a chapter THEN the system SHALL display a "Continue Reading" section on the dashboard with the last read book and chapter
9. WHEN a user clicks "Continue Reading" THEN the system SHALL navigate directly to their last reading position

### Requirement 3: Reading Experience and Customization

**User Story:** As a reader, I want a customizable reading interface, so that I can read comfortably according to my preferences.

#### Acceptance Criteria

1. WHEN a reader opens a book THEN the system SHALL display chapters in a readable format
2. WHEN a reader adjusts font size, font family, or brightness THEN the system SHALL apply changes immediately
3. WHEN a reader selects background color or wallpaper THEN the system SHALL update the reading interface
4. WHEN a reader bookmarks a position THEN the system SHALL save the bookmark for future access
5. WHEN a reader returns to a bookmarked book THEN the system SHALL offer to resume from the bookmark
6. WHEN a reader selects text THEN the system SHALL provide option to generate a quote image
7. WHEN a reader requests chapter translation THEN the system SHALL provide translated text via API
8. WHEN a reader requests audiobook generation THEN the system SHALL use ElevenLabs to create audio for the chapter

### Requirement 4: Book Discovery and Library Management

**User Story:** As a reader, I want to discover new books and manage my personal library, so that I can find content I enjoy and organize my reading.

#### Acceptance Criteria

1. WHEN a reader visits Explore THEN the system SHALL display available books with filtering options
2. WHEN a reader applies filters (genre, page ranges, tags) THEN the system SHALL show matching results
3. WHEN a reader excludes global tags THEN the system SHALL hide books with those tags across all views
4. WHEN a reader adds a free book to library THEN the system SHALL make it accessible in their Library section
5. WHEN a reader removes a book from library THEN the system SHALL soft delete but preserve reading history
6. WHEN a reader views reading history THEN the system SHALL show all previously read books regardless of current library status

### Requirement 5: Monetization and Payment System

**User Story:** As a reader, I want to purchase books and chapters using an in-app currency system, so that I can access premium content.

#### Acceptance Criteria

1. WHEN a reader wants to purchase a book THEN the system SHALL support both fixed-price and per-chapter pricing models
2. WHEN a reader initiates a purchase THEN the system SHALL deduct coins from their wallet balance
3. WHEN a reader has insufficient coins THEN the system SHALL prompt them to top up via Stripe
4. WHEN a reader tops up their wallet THEN the system SHALL generate a Stripe checkout link
5. WHEN a payment is completed THEN the system SHALL add coins to the user's wallet and provide confirmation
6. WHEN a reader purchases content THEN the system SHALL immediately grant access to the purchased material
7. WHEN a reader views transaction history THEN the system SHALL display all purchases and top-ups

### Requirement 6: Community Features and Interaction

**User Story:** As a user, I want to engage with the community through comments and discussions, so that I can share thoughts and connect with other readers and writers.

#### Acceptance Criteria

1. WHEN a user reads a chapter THEN the system SHALL provide commenting functionality
2. WHEN a user posts a comment THEN the system SHALL display it with their username and timestamp
3. WHEN a user likes a comment THEN the system SHALL increment the like count and track the interaction
4. WHEN an author likes a comment on their book THEN the system SHALL display "Liked by Author" badge
5. WHEN a user replies to a comment THEN the system SHALL create a threaded conversation
6. WHEN a user reports a comment THEN the system SHALL flag it for moderation
7. WHEN a user deletes their own comment THEN the system SHALL remove it from display

### Requirement 7: Notification and Communication System

**User Story:** As a user, I want to receive notifications about relevant activities, so that I can stay engaged with the community and my content.

#### Acceptance Criteria

1. WHEN someone likes a user's comment THEN the system SHALL create a notification
2. WHEN someone replies to a user's comment THEN the system SHALL notify the original commenter
3. WHEN a followed author publishes new content THEN the system SHALL notify followers
4. WHEN a purchase is completed THEN the system SHALL send a receipt notification
5. WHEN a user accesses notifications THEN the system SHALL display them in chronological order
6. WHEN a user views a notification THEN the system SHALL mark it as read

### Requirement 8: Secret Vault Feature

**User Story:** As a reader, I want a password-protected section for private books, so that I can keep certain content secure and private.

#### Acceptance Criteria

1. WHEN a user accesses Secret Vault THEN the system SHALL require password authentication
2. WHEN a user enters correct vault password THEN the system SHALL display vault contents
3. WHEN a user adds a book to vault THEN the system SHALL move it to the protected section
4. WHEN a user removes a book from vault THEN the system SHALL return it to regular library
5. WHEN a user session expires THEN the system SHALL require vault password re-entry for access

### Requirement 9: Writer Dashboard and Content Creation

**User Story:** As a writer, I want tools to create, edit, and manage my books and chapters, so that I can publish content and build my audience.

#### Acceptance Criteria

1. WHEN a writer accesses Writer Dashboard THEN the system SHALL display all their books (published and drafts)
2. WHEN a writer creates a new book THEN the system SHALL provide fields for title, description, cover, tags, and pricing model
3. WHEN a writer edits a chapter THEN the system SHALL provide a text editor with preview functionality
4. WHEN a writer saves a chapter THEN the system SHALL store the content and update modification timestamp
5. WHEN a writer publishes a book THEN the system SHALL make it available in Explore for readers
6. WHEN a writer creates a book THEN the system SHALL generate a unique license stored in the database for ownership proof

### Requirement 10: Character Profile Management

**User Story:** As a writer, I want to create and manage character profiles for my books, so that I can provide rich context and enhance the reading experience.

#### Acceptance Criteria

1. WHEN a writer creates a character profile THEN the system SHALL provide fields for name, image, description, title, gender, age, and relationships
2. WHEN a writer uploads a character image THEN the system SHALL store it using Cloudinary
3. WHEN a writer attaches characters to a book THEN the system SHALL associate them for reader access
4. WHEN a writer edits character details THEN the system SHALL update the profile across all associated books
5. WHEN a writer deletes a character THEN the system SHALL remove associations but preserve historical references

### Requirement 11: Writer Analytics and Monetization

**User Story:** As a writer, I want to track the performance of my content and earnings, so that I can understand my audience and optimize my monetization strategy.

#### Acceptance Criteria

1. WHEN a writer views analytics THEN the system SHALL display views per chapter and book
2. WHEN a writer checks earnings THEN the system SHALL show revenue per book and chapter
3. WHEN a writer reviews purchase history THEN the system SHALL list who bought what content
4. WHEN content is purchased THEN the system SHALL update writer earnings in real-time
5. WHEN a writer sets pricing THEN the system SHALL apply it to new purchases immediately

### Requirement 12: Content Moderation Tools

**User Story:** As a writer, I want moderation tools for my content, so that I can maintain a positive community environment around my books.

#### Acceptance Criteria

1. WHEN a writer views comments on their content THEN the system SHALL provide delete options
2. WHEN a writer deletes a comment THEN the system SHALL remove it and log the moderation action
3. WHEN users report comments THEN the system SHALL notify the content owner
4. WHEN a writer reviews reports THEN the system SHALL display flagged content with context
5. WHEN moderation actions are taken THEN the system SHALL maintain an audit log



## Out of Scope (MVP)

- Offline reading mode
- Mobile app (PWA optional later)
- AI-generated summaries or recommendations
- Social media sharing (Phase 2)
- Multi-user collaboration on books
- Refund system (manual for MVP)