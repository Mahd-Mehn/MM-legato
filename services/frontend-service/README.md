# Legato Frontend Service - Mobile Reading Interface

A mobile-first Progressive Web App for the Legato platform, providing an optimized reading experience with offline capabilities, reading progress tracking, and data-saving features.

## Features

### 📱 Mobile-First Design
- Responsive design optimized for mobile devices
- Touch-friendly interface with gesture support
- Safe area handling for modern mobile devices
- Optimized typography for mobile reading

### 📖 Reading Experience
- **Chapter Reader**: Full-screen reading interface with customizable settings
- **Reading Progress**: Automatic progress tracking and visual indicators
- **Bookmarks**: Save and resume reading positions
- **Reading Settings**: Customizable font size, themes (light/dark/sepia)
- **Navigation**: Easy chapter-to-chapter navigation

### 🔌 Offline Capabilities
- **Service Worker**: Automatic content caching for offline reading
- **IndexedDB Storage**: Efficient local storage for chapter content
- **Offline Indicator**: Visual feedback for network status
- **Smart Caching**: Automatic cleanup of old content to manage storage

### 📊 Data Saving Mode
- **Content Compression**: Reduce data usage with smart compression
- **Image Optimization**: Automatic image quality adjustment
- **Network Detection**: Automatic optimization based on connection type
- **Usage Tracking**: Monitor data savings and storage usage

### 🎯 Progressive Web App
- **Installable**: Can be installed as a native-like app
- **Offline First**: Works without internet connection
- **Push Notifications**: Reading reminders and updates
- **App Shortcuts**: Quick access to bookmarks and continue reading

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Storage**: IndexedDB for offline content, localStorage for settings
- **PWA**: Workbox for service worker management
- **Testing**: Jest + React Testing Library

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with PWA setup
│   ├── globals.css              # Global styles and reading optimizations
│   └── stories/[storyId]/chapters/[chapterId]/
│       └── page.tsx             # Chapter reading page
├── components/
│   └── reading/                 # Reading interface components
│       ├── ChapterReader.tsx    # Main reading component
│       ├── ReadingSettings.tsx  # Settings panel
│       ├── ReadingProgress.tsx  # Progress indicator
│       ├── OfflineIndicator.tsx # Network status
│       └── BookmarksList.tsx    # Bookmarks management
├── hooks/                       # Custom React hooks
│   ├── useReadingProgress.ts    # Reading progress and bookmarks
│   ├── useOfflineContent.ts     # Offline content management
│   └── useDataSaver.ts          # Data saving features
└── lib/
    └── serviceWorker.ts         # Service worker utilities
```

## Key Components

### ChapterReader
The main reading interface component that provides:
- Full-screen reading experience
- Customizable reading settings
- Progress tracking and bookmarking
- Navigation between chapters
- Offline content support

### Reading Hooks

#### useReadingProgress
Manages reading progress and bookmarks:
- Tracks reading progress percentage
- Saves/loads bookmarks with scroll position
- Maintains reading statistics
- Handles chapter completion

#### useOfflineContent
Handles offline content management:
- Caches chapters in IndexedDB
- Manages storage limits and cleanup
- Provides offline/online status
- Retrieves cached content

#### useDataSaver
Implements data-saving features:
- Content compression based on network conditions
- Image quality optimization
- Network-aware settings
- Data usage tracking

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

4. **Run tests**:
   ```bash
   npm test
   npm run test:watch
   ```

## Configuration

### PWA Configuration
The app is configured as a Progressive Web App with:
- Manifest file for installation
- Service worker for offline functionality
- Caching strategies for different content types
- Background sync for reading progress

### Tailwind CSS
Custom configuration includes:
- Reading-optimized font sizes
- Mobile-first responsive breakpoints
- Safe area handling for modern devices
- Dark mode and theme support

## Performance Optimizations

### Mobile Performance
- Lazy loading of non-critical components
- Optimized images with WebP format
- Minimal JavaScript bundle size
- Efficient scroll handling with passive listeners

### Offline Performance
- Smart caching with size limits (50MB default)
- Automatic cleanup of old content
- Compressed content storage
- Background sync for progress updates

### Data Saving
- Content compression up to 70%
- Image quality adjustment based on network
- Automatic optimization for slow connections
- User-configurable data saving levels

## Testing

The project includes comprehensive tests for:
- Component rendering and interactions
- Hook functionality and state management
- Offline capabilities and caching
- Reading progress and bookmarks
- Data saving features

Run tests with:
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## Browser Support

- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Mobile browsers**: iOS Safari 14+, Chrome Mobile 90+
- **PWA features**: Requires HTTPS in production
- **Offline features**: Requires IndexedDB and Service Worker support

## API Integration

The reading interface expects the following API endpoints:
- `GET /api/stories/{storyId}/chapters/{chapterId}` - Chapter content
- `GET /api/stories/{storyId}/chapters/{chapterId}/navigation` - Navigation info
- `POST /api/reading/progress` - Save reading progress
- `GET /api/reading/bookmarks` - Retrieve bookmarks

## Deployment

The frontend service can be deployed as:
- **Static site**: Using `next export` for CDN deployment
- **Server-side**: Using Next.js server for dynamic features
- **Docker**: Containerized deployment with the provided Dockerfile
- **Edge**: Deployed to edge locations for global performance

## Future Enhancements

- **Audio Integration**: Synchronized audiobook playback
- **Social Features**: Reading groups and discussions
- **Advanced Analytics**: Detailed reading behavior tracking
- **Accessibility**: Enhanced screen reader support
- **Internationalization**: Multi-language interface support