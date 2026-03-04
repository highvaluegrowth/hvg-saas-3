// features/marketing/types.ts
// Date fields: ISO 8601 strings (not Firestore Timestamps or Date objects).
// Services are responsible for serializing with new Date().toISOString().

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'x' | 'linkedin';
export type PostType = 'bed_availability' | 'success_story' | 'event_promo' | 'job_listing' | 'general';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type AccountStatus = 'active' | 'expired' | 'revoked';

export interface SocialPost {
    id: string;
    tenantId: string;
    content: string;
    platforms: SocialPlatform[];
    hashtags: string[];
    status: PostStatus;
    postType: PostType;
    scheduledAt: string | null;   // ISO string
    publishedAt: string | null;   // ISO string
    createdBy: string;            // uid
    createdAt: string;
    updatedAt: string;
    aiGenerated: boolean;
    sourceContext: Record<string, unknown>;
}

export interface SocialAccount {
    id: string;
    platform: SocialPlatform;
    accessToken: string;
    tokenExpiresAt: string;       // ISO string
    accountName: string;
    accountId: string;
    connectedAt: string;
    connectedBy: string;
    status: AccountStatus;
}

export interface MarketingTemplate {
    id: string;
    name: string;
    category: PostType;
    promptHint: string;
    defaultHashtags: string[];
    createdBy: string;
    createdAt: string;
    active: boolean;
}

// Payload for creating a new post
export interface CreatePostPayload {
    content: string;
    platforms: SocialPlatform[];
    hashtags: string[];
    postType: PostType;
    scheduledAt?: string | null;
    aiGenerated: boolean;
    sourceContext?: Record<string, unknown>;
}

// AI tool return shape
export interface DraftPostResult {
    draft: string;
    hashtags: {
        general: string[];
        houseSpecific: string[];
        platformOptimized: string[];
    };
}
