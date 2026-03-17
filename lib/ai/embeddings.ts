import { genai } from './gemini';

const EMBEDDING_MODEL = 'text-embedding-004';

/**
 * Generates a vector embedding for the given text using Gemini.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const model = genai.getGenerativeModel({ model: EMBEDDING_MODEL });
        const result = await model.embedContent(text);
        return result.embedding.values;
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
        const model = genai.getGenerativeModel({ model: EMBEDDING_MODEL });
        const result = await model.batchEmbedContents({
            requests: texts.map(text => ({
                content: { role: 'user', parts: [{ text }] },
                taskType: 'RETRIEVAL_DOCUMENT' as any
            }))
        });
        return result.embeddings.map(e => e.values);
    } catch (error) {
        console.error('Error generating batch embeddings:', error);
        throw new Error('Failed to generate batch embeddings');
    }
}
