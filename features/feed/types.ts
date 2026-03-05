export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  imageUrl?: string;
  scope: 'house' | 'tenant' | 'global';
  houseId?: string;
  reactions: Record<string, string[]>; // emoji -> uid[]
  pinned: boolean;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}
