export type ChatType = 'dm' | 'group' | 'house' | 'course' | 'event';

export interface Chat {
    id: string;
    type: ChatType;
    tenantId: string;
    participants: string[]; // User UIDs
    metadata?: {
        name?: string;
        image?: string;
        houseId?: string;
        courseId?: string;
        eventId?: string;
        description?: string;
    };
    lastMessage?: {
        content: string;
        senderId: string;
        createdAt: string; // ISO
    };
    createdAt: string; // ISO
    updatedAt: string; // ISO
}

export interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    senderName: string;
    senderImage?: string;
    content: string;
    type: 'text' | 'image' | 'system';
    metadata?: Record<string, unknown>;
    createdAt: string; // ISO
}

export interface ChatParticipantProfile {
    uid: string;
    displayName: string;
    photoURL?: string;
    role?: string;
}
