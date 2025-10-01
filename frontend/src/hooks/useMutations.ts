import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { createCacheManager } from '@/lib/cache-utils';
import { api } from '@/lib/api';

export function useBookMutations() {
  const queryClient = useQueryClient();
  const cacheManager = createCacheManager(queryClient);

  const addToLibrary = useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.post(`/library/add`, { book_id: bookId });
      return response.data;
    },
    onMutate: async (bookId) => {
      // Optimistically update the library
      await queryClient.cancelQueries({ queryKey: queryKeys.library.books() });
      
      const previousLibrary = queryClient.getQueryData(queryKeys.library.books());
      
      queryClient.setQueryData(queryKeys.library.books(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          books: [...(old.books || []), { id: bookId, added_at: new Date().toISOString() }]
        };
      });

      return { previousLibrary };
    },
    onError: (_err, _bookId, context) => {
      queryClient.setQueryData(queryKeys.library.books(), context?.previousLibrary);
      toast.error('Failed to add book to library');
    },
    onSuccess: () => {
      toast.success('Book added to library');
    },
    onSettled: () => {
      cacheManager.invalidateUserData();
    }
  });

  const removeFromLibrary = useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.delete(`/library/remove/${bookId}`);
      return response.data;
    },
    onMutate: async (bookId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.library.books() });
      
      const previousLibrary = queryClient.getQueryData(queryKeys.library.books());
      
      queryClient.setQueryData(queryKeys.library.books(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          books: old.books?.filter((book: any) => book.id !== bookId) || []
        };
      });

      return { previousLibrary };
    },
    onError: (_err, _bookId, context) => {
      queryClient.setQueryData(queryKeys.library.books(), context?.previousLibrary);
      toast.error('Failed to remove book from library');
    },
    onSuccess: () => {
      toast.success('Book removed from library');
    },
    onSettled: () => {
      cacheManager.invalidateUserData();
    }
  });

  const purchaseBook = useMutation({
    mutationFn: async ({ bookId, chapterId }: { bookId: string; chapterId?: string }) => {
      const response = await api.post('/payments/purchase', {
        book_id: bookId,
        chapter_id: chapterId
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      toast.success('Purchase successful!');
      cacheManager.invalidatePaymentData();
      cacheManager.invalidateUserData();
      cacheManager.invalidateBookData(variables.bookId);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Purchase failed';
      toast.error(message);
    }
  });

  return {
    addToLibrary,
    removeFromLibrary,
    purchaseBook
  };
}

export function useCommentMutations() {
  const queryClient = useQueryClient();
  const cacheManager = createCacheManager(queryClient);

  const createComment = useMutation({
    mutationFn: async ({ chapterId, content, parentId }: {
      chapterId: string;
      content: string;
      parentId?: string;
    }) => {
      const response = await api.post('/comments', {
        chapter_id: chapterId,
        content,
        parent_id: parentId
      });
      return response.data;
    },
    onMutate: async ({ chapterId, content, parentId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.chapter(chapterId) });
      
      const previousComments = queryClient.getQueryData(queryKeys.comments.chapter(chapterId));
      
      // Optimistically add the comment
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content,
        user: { username: 'You' }, // Will be replaced with actual user data
        created_at: new Date().toISOString(),
        like_count: 0,
        parent_id: parentId,
        replies: []
      };

      queryClient.setQueryData(queryKeys.comments.chapter(chapterId), (old: any) => {
        if (!old) return { pages: [{ comments: [optimisticComment] }] };
        
        const newPages = [...old.pages];
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            comments: [optimisticComment, ...newPages[0].comments]
          };
        }
        
        return { ...old, pages: newPages };
      });

      return { previousComments };
    },
    onError: (_err, variables, context) => {
      queryClient.setQueryData(
        queryKeys.comments.chapter(variables.chapterId),
        context?.previousComments
      );
      toast.error('Failed to post comment');
    },
    onSuccess: (_data, _variables) => {
      toast.success('Comment posted successfully');
    },
    onSettled: (_data, _error, variables) => {
      cacheManager.invalidateCommentData(variables.chapterId);
    }
  });

  const likeComment = useMutation({
    mutationFn: async ({ commentId, chapterId }: { commentId: string; chapterId: string }) => {
      const response = await api.post(`/comments/${commentId}/like`);
      return response.data;
    },
    onMutate: async ({ commentId, chapterId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.chapter(chapterId) });
      
      const previousComments = queryClient.getQueryData(queryKeys.comments.chapter(chapterId));
      
      // Optimistically update like count
      cacheManager.updateCommentInCache(chapterId, commentId, (comment: any) => ({
        ...comment,
        like_count: comment.like_count + 1,
        is_liked: true
      }));

      return { previousComments };
    },
    onError: (_err, variables, context) => {
      queryClient.setQueryData(
        queryKeys.comments.chapter(variables.chapterId),
        context?.previousComments
      );
      toast.error('Failed to like comment');
    },
    onSettled: (_data, _error, variables) => {
      cacheManager.invalidateCommentData(variables.chapterId);
    }
  });

  const deleteComment = useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    },
    onSuccess: (_data, _variables) => {
      toast.success('Comment deleted');
      // Invalidate all comment queries since we don't know which chapter
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all });
    },
    onError: () => {
      toast.error('Failed to delete comment');
    }
  });

  return {
    createComment,
    likeComment,
    deleteComment
  };
}

export function useProfileMutations() {
  const queryClient = useQueryClient();
  const cacheManager = createCacheManager(queryClient);

  const updateProfile = useMutation({
    mutationFn: async (profileData: {
      username?: string;
      bio?: string;
      profile_picture?: File;
    }) => {
      const formData = new FormData();
      
      if (profileData.username) formData.append('username', profileData.username);
      if (profileData.bio) formData.append('bio', profileData.bio);
      if (profileData.profile_picture) formData.append('profile_picture', profileData.profile_picture);
      
      const response = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      cacheManager.invalidateUserData();
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const setVaultPassword = useMutation({
    mutationFn: async (password: string) => {
      const response = await api.post('/users/vault-password', { password });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Vault password set successfully');
    },
    onError: () => {
      toast.error('Failed to set vault password');
    }
  });

  return {
    updateProfile,
    setVaultPassword
  };
}

export function useReadingMutations() {
  const queryClient = useQueryClient();

  const updateReadingProgress = useMutation({
    mutationFn: async ({
      chapterId,
      position,
      percentage
    }: {
      chapterId: string;
      position: number;
      percentage: number;
    }) => {
      const response = await api.post('/reading/progress', {
        chapter_id: chapterId,
        position,
        percentage
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate reading progress queries
      queryClient.invalidateQueries({ queryKey: queryKeys.reading.all });
    },
    onError: () => {
      // Silent error for reading progress - not critical
      console.error('Failed to update reading progress');
    }
  });

  const createBookmark = useMutation({
    mutationFn: async ({
      chapterId,
      position,
      note
    }: {
      chapterId: string;
      position: number;
      note?: string;
    }) => {
      const response = await api.post('/reading/bookmarks', {
        chapter_id: chapterId,
        position,
        note
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Bookmark created');
      queryClient.invalidateQueries({ queryKey: queryKeys.reading.bookmarks() });
    },
    onError: () => {
      toast.error('Failed to create bookmark');
    }
  });

  return {
    updateReadingProgress,
    createBookmark
  };
}

export function useWriterMutations() {
  const queryClient = useQueryClient();

  const createBook = useMutation({
    mutationFn: async (bookData: {
      title: string;
      description: string;
      cover_image?: File;
      genre: string;
      tags: string[];
      pricing_model: string;
      fixed_price?: number;
      per_chapter_price?: number;
    }) => {
      const formData = new FormData();
      
      Object.entries(bookData).forEach(([key, value]) => {
        if (key === 'cover_image' && value instanceof File) {
          formData.append(key, value);
        } else if (key === 'tags' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });
      
      const response = await api.post('/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Book created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      // Note: writer queries would need to be added to queryKeys if needed
    },
    onError: () => {
      toast.error('Failed to create book');
    }
  });

  const updateChapter = useMutation({
    mutationFn: async ({
      chapterId,
      title,
      content
    }: {
      chapterId: string;
      title: string;
      content: string;
    }) => {
      const response = await api.put(`/chapters/${chapterId}`, {
        title,
        content
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      toast.success('Chapter updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters.detail(variables.chapterId) });
    },
    onError: () => {
      toast.error('Failed to update chapter');
    }
  });

  return {
    createBook,
    updateChapter
  };
}