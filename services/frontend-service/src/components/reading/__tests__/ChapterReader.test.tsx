import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChapterReader } from '../ChapterReader';

// Mock the hooks
jest.mock('@/hooks/useReadingProgress', () => ({
  useReadingProgress: () => ({
    progress: 25,
    updateProgress: jest.fn(),
    saveBookmark: jest.fn(),
    loadBookmark: jest.fn(() => null),
  }),
}));

jest.mock('@/hooks/useOfflineContent', () => ({
  useOfflineContent: () => ({
    isOffline: false,
    saveForOffline: jest.fn(),
    isContentCached: jest.fn(() => false),
  }),
}));

const mockChapter = {
  id: 'chapter-1',
  title: 'The Beginning',
  content: '<p>This is the chapter content.</p>',
  storyId: 'story-1',
  chapterNumber: 1,
  wordCount: 500,
};

describe('ChapterReader', () => {
  it('renders chapter content correctly', () => {
    render(<ChapterReader chapter={mockChapter} />);
    
    expect(screen.getByText('The Beginning')).toBeInTheDocument();
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('500 words')).toBeInTheDocument();
  });

  it('shows navigation buttons when hasNext/hasPrev are true', () => {
    const mockNavigate = jest.fn();
    
    render(
      <ChapterReader
        chapter={mockChapter}
        onNavigate={mockNavigate}
        hasNext={true}
        hasPrev={true}
      />
    );
    
    const prevButton = screen.getByText('Previous');
    const nextButton = screen.getByText('Next');
    
    expect(prevButton).toBeEnabled();
    expect(nextButton).toBeEnabled();
  });

  it('disables navigation buttons when hasNext/hasPrev are false', () => {
    render(
      <ChapterReader
        chapter={mockChapter}
        hasNext={false}
        hasPrev={false}
      />
    );
    
    const prevButton = screen.getByText('Previous');
    const nextButton = screen.getByText('Next');
    
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('calls onNavigate when navigation buttons are clicked', () => {
    const mockNavigate = jest.fn();
    
    render(
      <ChapterReader
        chapter={mockChapter}
        onNavigate={mockNavigate}
        hasNext={true}
        hasPrev={true}
      />
    );
    
    fireEvent.click(screen.getByText('Next'));
    expect(mockNavigate).toHaveBeenCalledWith('next');
    
    fireEvent.click(screen.getByText('Previous'));
    expect(mockNavigate).toHaveBeenCalledWith('prev');
  });

  it('opens settings panel when settings button is clicked', () => {
    render(<ChapterReader chapter={mockChapter} />);
    
    const settingsButton = screen.getByLabelText('Reading settings');
    fireEvent.click(settingsButton);
    
    expect(screen.getByText('Reading Settings')).toBeInTheDocument();
  });

  it('shows bookmark confirmation when bookmark button is clicked', async () => {
    render(<ChapterReader chapter={mockChapter} />);
    
    const bookmarkButton = screen.getByLabelText('Bookmark current position');
    fireEvent.click(bookmarkButton);
    
    // Should show the check icon temporarily (BookmarkCheck component)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Bookmark current position' })).toBeInTheDocument();
    });
  });

  it('displays reading progress correctly', () => {
    render(<ChapterReader chapter={mockChapter} />);
    
    expect(screen.getByText('25% complete')).toBeInTheDocument();
  });

  it('shows offline indicator when offline', () => {
    // Mock offline state
    jest.mocked(require('@/hooks/useOfflineContent').useOfflineContent).mockReturnValue({
      isOffline: true,
      saveForOffline: jest.fn(),
      isContentCached: jest.fn(() => true),
    });

    render(<ChapterReader chapter={mockChapter} />);
    
    expect(screen.getByTitle('Offline mode')).toBeInTheDocument();
  });
});