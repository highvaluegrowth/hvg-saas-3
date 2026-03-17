import { genai } from './gemini';

const EMBEDDING_MODEL = 'text-embedding-004';

/**
 * Generates a vector embedding for the given text using Gemini.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const result = await genai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: [{ role: 'user', parts: [{ text }] }]
        });
        
        const embedding = result.embeddings?.[0]?.values;
        if (!embedding) throw new Error('No embedding returned from Gemini');
        
        return embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding');
    }
}

/**
 * Generates embeddings for multiple strings in a batch.
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        const result = await genai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: texts.map(text => ({ role: 'user', parts: [{ text }] }))
        });
        
        const embeddings = result.embeddings?.map(e => e.values).filter((v): v is number[] => !!v);
        if (!embeddings || embeddings.length === 0) throw new Error('No embeddings returned from Gemini');
        
        return embeddings;
    } catch (error) {
        console.error('Error generating batch embeddings:', error);
        throw new Error('Failed to generate batch embeddings');
    }
}
