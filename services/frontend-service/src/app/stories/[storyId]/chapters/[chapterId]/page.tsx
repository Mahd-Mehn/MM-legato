'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChapterReader } from '@/components/reading/ChapterReader';
import { Loader2, AlertCircle } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  content: string;
  storyId: string;
  chapterNumber: number;
  wordCount: number;
}

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const storyId = params.storyId as string;
  const chapterId = params.chapterId as string;

  useEffect(() => {
    loadChapter();
  }, [chapterId]);

  const loadChapter = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock API call - replace with actual API integration
      const response = await fetch(`/api/stories/${storyId}/chapters/${chapterId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load chapter');
      }

      const chapterData = await response.json();
      setChapter(chapterData);

      // Check for next/previous chapters
      const navigationResponse = await fetch(`/api/stories/${storyId}/chapters/${chapterId}/navigation`);
      if (navigationResponse.ok) {
        const navData = await navigationResponse.json();
        setHasNext(navData.hasNext);
        setHasPrev(navData.hasPrev);
      }

    } catch (err) {
      // Fallback to mock data for development
      const mockChapter: Chapter = {
        id: chapterId,
        title: 'The Beginning of Everything',
        content: generateMockContent(),
        storyId: storyId,
        chapterNumber: 1,
        wordCount: 1250
      };
      
      setChapter(mockChapter);
      setHasNext(true);
      setHasPrev(false);
      
      console.warn('Using mock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!chapter) return;

    const newChapterNumber = direction === 'next' 
      ? chapter.chapterNumber + 1 
      : chapter.chapterNumber - 1;

    // Navigate to the new chapter
    router.push(`/stories/${storyId}/chapters/chapter-${newChapterNumber}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error && !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-semibold mb-2">Failed to Load Chapter</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadChapter}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Chapter not found</p>
        </div>
      </div>
    );
  }

  return (
    <ChapterReader
      chapter={chapter}
      onNavigate={handleNavigate}
      hasNext={hasNext}
      hasPrev={hasPrev}
    />
  );
}

function generateMockContent(): string {
  return `
    <p>The morning sun cast long shadows across the cobblestone streets of Eldoria, its golden rays filtering through the ancient oak trees that lined the main thoroughfare. Maya Chen adjusted her worn leather satchel and quickened her pace, the familiar weight of her grandmother's journal pressing against her hip.</p>

    <p>She had been walking these same streets for three years now, ever since arriving from the outer provinces to study at the Academy of Arcane Arts. But today felt different. Today, the very air seemed to hum with an energy she couldn't quite place—a subtle vibration that made her fingertips tingle and her heart race with anticipation.</p>

    <p>"You're late again," called a voice from behind her. Maya turned to see her roommate, Kira, jogging to catch up. Her friend's silver hair caught the morning light, a telltale sign of her ice magic heritage.</p>

    <p>"I know, I know," Maya replied, not slowing her pace. "But I had the strangest dream last night. My grandmother was trying to tell me something about the journal, something important."</p>

    <p>Kira raised an eyebrow. "Your grandmother has been gone for five years, Maya. Maybe it's time to stop looking for messages in every dream and shadow."</p>

    <p>But Maya couldn't shake the feeling that today would change everything. As they approached the Academy's towering spires, she noticed something odd. The usually bustling courtyard was eerily quiet, and the great bronze doors—which were never closed during daylight hours—stood firmly shut.</p>

    <p>"That's... unusual," Kira murmured, her breath forming small puffs of frost in the suddenly cold air.</p>

    <p>Maya's hand instinctively moved to her grandmother's journal. The leather cover felt warm beneath her palm, warmer than it should have been. And for just a moment, she could have sworn she heard her grandmother's voice whispering on the wind: "The time has come, little star. The time has come."</p>

    <p>As if responding to some unseen signal, the bronze doors began to creak open, revealing not the familiar entrance hall, but a swirling vortex of silver light that seemed to pulse with the rhythm of a heartbeat.</p>

    <p>Maya and Kira exchanged glances. Whatever lay beyond that threshold would either fulfill Maya's destiny or destroy everything she thought she knew about magic, about her family, and about herself.</p>

    <p>"Well," Kira said, ice crystals forming around her fingers as her magic responded to her nervousness, "I suppose we're not going to be late for Theoretical Enchantments after all."</p>

    <p>Maya took a deep breath, her grandmother's journal growing warmer still. "No," she agreed, stepping toward the swirling light. "I don't think we are."</p>
  `;
}