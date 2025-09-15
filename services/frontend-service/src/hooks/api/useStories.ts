import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { StoriesService, CreateStoryRequest, UpdateStoryRequest, CreateChapterRequest, UpdateChapterRequest } from '@/lib/api/services/stories';
import { queryKeys } from '@/lib/api/queries';
import { SearchFilters } from '@/lib/api/types';
import { toast } from 'react-hot-toast';

// Story queries
export function useStories(filters?: SearchFilters & { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.stories.list(filters || {}),
    queryFn: () => StoriesService.getStories(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useInfiniteStories(filters?: SearchFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.stories.list(filters || {}),
    queryFn: ({ pageParam = 1 }) => StoriesService.getStories({ ...filters, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useStory(id: string) {
  return useQuery({
    queryKey: queryKeys.stories.detail(id),
    queryFn: () => StoriesService.getStory(id),
    enabled: !!id,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStoryRequest) => StoriesService.createStory(data),
    onSuccess: (story) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.myStories() });
      queryClient.setQueryData(queryKeys.stories.detail(story.id), story);
      toast.success('Story created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create story');
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoryRequest }) => 
      StoriesService.updateStory(id, data),
    onSuccess: (story) => {
      queryClient.setQueryData(queryKeys.stories.detail(story.id), story);
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.myStories() });
      toast.success('Story updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update story');
    },
  });
}export
 function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => StoriesService.deleteStory(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.stories.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.myStories() });
      toast.success('Story deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete story');
    },
  });
}

// Chapter queries and mutations
export function useChapters(storyId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.stories.chapters(storyId),
    queryFn: () => StoriesService.getChapters(storyId, page, limit),
    enabled: !!storyId,
  });
}

export function useChapter(storyId: string, chapterId: string) {
  return useQuery({
    queryKey: queryKeys.stories.chapter(storyId, chapterId),
    queryFn: () => StoriesService.getChapter(storyId, chapterId),
    enabled: !!storyId && !!chapterId,
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, data }: { storyId: string; data: CreateChapterRequest }) =>
      StoriesService.createChapter(storyId, data),
    onSuccess: (chapter, { storyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.chapters(storyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
      toast.success('Chapter created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create chapter');
    },
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, chapterId, data }: { storyId: string; chapterId: string; data: UpdateChapterRequest }) =>
      StoriesService.updateChapter(storyId, chapterId, data),
    onSuccess: (chapter, { storyId, chapterId }) => {
      queryClient.setQueryData(queryKeys.stories.chapter(storyId, chapterId), chapter);
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.chapters(storyId) });
      toast.success('Chapter updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update chapter');
    },
  });
}

// Search and discovery
export function useSearchStories(filters: SearchFilters) {
  return useQuery({
    queryKey: queryKeys.stories.search(filters.query || '', filters),
    queryFn: () => StoriesService.searchStories(filters),
    enabled: !!(filters.query || Object.keys(filters).length > 1),
  });
}

export function useTrendingStories(period: 'day' | 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: queryKeys.stories.trending(period),
    queryFn: () => StoriesService.getTrendingStories(period),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRecommendedStories() {
  return useQuery({
    queryKey: queryKeys.stories.recommended(),
    queryFn: () => StoriesService.getRecommendedStories(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useMyStories(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.stories.myStories(),
    queryFn: () => StoriesService.getMyStories(page, limit),
  });
}