import pdf from 'pdf-parse';

export async function extractTextFromBuffer(buffer) {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        throw new Error(`PDF extraction failed: ${error.message}`);
    }
}
