export interface Example {
    sentence: string;
    vocabulary: string;
}

export class TextParser {
    static parseExamples(generatedText: string): Example[] {
        const examples: Example[] = [];
        const lines = generatedText.split('\n').map((line: string) => line.trim()).filter((line: string) => line && !line.startsWith('Theme:') && !line.includes('Generate'));

        let currentExample: { sentence?: string, vocabulary?: string } = {};

        for (const line of lines) {
            if (line.startsWith('Sentence:')) {
                // Start new example if we have a complete previous one
                if (currentExample.sentence && currentExample.vocabulary) {
                    examples.push({ sentence: currentExample.sentence, vocabulary: currentExample.vocabulary });
                }
                currentExample = { sentence: line.substring(9).trim() };
            } else if (line.startsWith('Vocabulary:')) {
                currentExample.vocabulary = line.substring(11).trim();
                // Add example when vocabulary is found (assuming sentence comes first)
                if (currentExample.sentence) {
                    examples.push({ sentence: currentExample.sentence, vocabulary: currentExample.vocabulary });
                    currentExample = {};
                }
            }
        }

        return examples;
    }
}
