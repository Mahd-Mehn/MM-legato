export interface CommentAuthor {
  id: string;
  username: string;
  profile_picture_url?: string;
  is_writer: boolean;
  is_book_author: boolean;
}

export interface Comment {
  id: string;
  chapter_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  like_count: number;
  is_reported: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author: CommentAuthor;
  replies: Comment[];
  is_liked_by_user: boolean;
  is_liked_by_author: boolean;
  can_delete: boolean;
}

export interface CommentCreateRequest {
  chapter_id: string;
  content: string;
  parent_id?: string;
}

export interface CommentUpdateRequest {
  content: string;
}

export interface CommentLikeResponse {
  comment_id: string;
  is_liked: boolean;
  like_count: number;
}

export interface CommentReportRequest {
  reason: string;
}