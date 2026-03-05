export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  authorId: string;
  authorName: string;
  tenantId: string; // 'hvg' for platform posts
  body: string; // HTML from TipTap
  excerpt: string;
  coverImageUrl?: string;
  tags: string[];
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
