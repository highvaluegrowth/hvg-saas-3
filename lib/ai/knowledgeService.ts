import { adminDb, VectorValue } from '@/lib/firebase/admin';
import { generateEmbedding } from './embeddings';

export interface KnowledgeDocument {
    id: string;
    tenantId: string;
    content: string;
    embedding: number[];
    metadata: Record<string, any>;
    createdAt: string;
}

/**
 * Service for managing tenant-specific knowledge (RAG).
 */
export const knowledgeService = {
    /**
     * Adds a piece of knowledge to the tenant's base.
     */
    async addKnowledge(tenantId: string, content: string, metadata: Record<string, any> = {}): Promise<string> {
        const embeddingValues = await generateEmbedding(content);
        const docRef = adminDb.collection(`tenants/${tenantId}/knowledge`).doc();
        
        await docRef.set({
            tenantId,
            content,
            metadata,
            embedding: VectorValue.create(embeddingValues),
            createdAt: new Date().toISOString(),
        });

        return docRef.id;
    },

    /**
     * Performs a vector search for relevant knowledge.
     */
    async searchKnowledge(tenantId: string, query: string, limit: number = 5): Promise<any[]> {
        const queryEmbedding = await generateEmbedding(query);
        
        // Firestore Vector Search
        const knowledgeRef = adminDb.collection(`tenants/${tenantId}/knowledge`);
        const snapshot = await knowledgeRef
            .findNearest('embedding', VectorValue.create(queryEmbedding), {
                limit,
                distanceMeasure: 'COSINE'
            })
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Remove embedding from response to save bandwidth
            embedding: undefined
        }));
    },

    /**
     * Deletes a specific knowledge document.
     */
    async deleteKnowledge(tenantId: string, docId: string): Promise<void> {
        await adminDb.collection(`tenants/${tenantId}/knowledge`).doc(docId).delete();
    },

    /**
     * Chunks a large text into smaller overlapping pieces for better retrieval.
     */
    chunkText(text: string, size: number = 1000, overlap: number = 200): string[] {
        const chunks: string[] = [];
        let start = 0;
        
        while (start < text.length) {
            const end = start + size;
            chunks.push(text.slice(start, end));
            start += size - overlap;
        }
        
        return chunks;
    }
};
