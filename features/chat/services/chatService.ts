import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Conversation, CreateConversationInput, Message } from '../schemas/chat.schemas';

const CONVERSATIONS = 'conversations';

// ─── createConversation ───────────────────────────────────────────────────────
// Initializes a new conversation document with a server-generated ID.
export async function createConversation(
  data: CreateConversationInput
): Promise<string> {
  const ref = doc(collection(db, CONVERSATIONS));
  await setDoc(ref, {
    ...data,
    id: ref.id,
    lastMessage: data.lastMessage ?? null,
    updatedAt: serverTimestamp(),
    metadata: data.metadata ?? {},
  });
  return ref.id;
}

// ─── sendMessage ──────────────────────────────────────────────────────────────
// Adds a message to the subcollection AND atomically updates the parent
// conversation's `lastMessage` and `updatedAt` in a single batch write.
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const batch = writeBatch(db);

  const messagesRef = collection(db, CONVERSATIONS, conversationId, 'messages');
  const msgRef = doc(messagesRef);

  batch.set(msgRef, {
    id: msgRef.id,
    senderId,
    text,
    createdAt: serverTimestamp(),
    readBy: [senderId],
    metadata: metadata ?? {},
  });

  const convRef = doc(db, CONVERSATIONS, conversationId);
  batch.update(convRef, {
    lastMessage: {
      text,
      senderId,
      createdAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return msgRef.id;
}

// ─── markMessageRead ─────────────────────────────────────────────────────────
// Adds the user's uid to the `readBy` array of a specific message.
export async function markMessageRead(
  conversationId: string,
  messageId: string,
  uid: string
): Promise<void> {
  const msgRef = doc(db, CONVERSATIONS, conversationId, 'messages', messageId);
  await updateDoc(msgRef, { readBy: arrayUnion(uid) });
}

// ─── subscribeToUserConversations ─────────────────────────────────────────────
// Real-time listener for all conversations the user participates in,
// ordered by most recently updated first.
export function subscribeToUserConversations(
  uid: string,
  onData: (conversations: Conversation[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, CONVERSATIONS),
    where('participants', 'array-contains', uid),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          // Convert Firestore Timestamps to JS Dates for schema compatibility
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
          lastMessage: data.lastMessage
            ? {
                ...data.lastMessage,
                createdAt: data.lastMessage.createdAt?.toDate?.() ?? new Date(),
              }
            : null,
        } as Conversation;
      });
      onData(conversations);
    },
    onError
  );
}

// ─── subscribeToMessages ─────────────────────────────────────────────────────
// Real-time listener for messages within a single conversation.
export function subscribeToMessages(
  conversationId: string,
  onData: (messages: Message[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, CONVERSATIONS, conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        } as Message;
      });
      onData(messages);
    },
    onError
  );
}
