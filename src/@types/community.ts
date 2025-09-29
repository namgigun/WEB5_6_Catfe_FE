import { UserProfile } from './type';
import { JSONContent } from '@tiptap/react';

export type UserSummary = Pick<UserProfile, 'nickname' | 'profileImageUrl'> & { userId: number };

export type Post = {
  post_id: string;
  author: UserSummary;
  title: string;
  content: JSONContent | null;
  categories: string[];
  likeCount: number;
  commentCount: number;

  isLikedByMe?: boolean;
  isBookmarkedByMe?: boolean;

  createdAt?: string;
  updatedAt?: string;
};

export type InitialPost =
  | Pick<Post, 'post_id' | 'title' | 'categories' | 'content'>
  | null
  | undefined;

type CommentBase = {
  comment_id: string;
  post_id: string;
  author: UserSummary;
  content: string | null;
  likeCount: number;
  isLikedByMe?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type RootComment = CommentBase & {
  parentCommentId?: null;
  children?: ReplyComment[];
  replyCount?: number;
};

export type ReplyComment = CommentBase & {
  parentCommentId?: string;
  children?: never;
  replyCount?: never;
};

export type Comment = RootComment | ReplyComment;
export type CommentTree = RootComment[];
