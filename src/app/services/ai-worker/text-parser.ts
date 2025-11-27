export interface Example {
    sentence: string;
    vocabulary: string;
}

export class TextParser {
    static parseExamples(generatedText: string): Example[] {
        const examples: Example[] = [];
        const lines = generatedText.split('\n').map((line: string) => line.trim()).filter((line: string) => line && !line.startsWith('Theme:') && !line.includes('Generate'));

        let currentExample: { scene?: string, sentence?: string, vocabulary?: string } = {};

        for (const line of lines) {
            if (line.startsWith('Scene:')) {
                // Start new example
                if (currentExample.sentence && currentExample.vocabulary) {
                    examples.push({ sentence: currentExample.sentence, vocabulary: currentExample.vocabulary });
                }
                currentExample = { scene: line.substring(6).trim() };
            } else if (line.startsWith('Sentence:')) {
                currentExample.sentence = line.substring(9).trim();
            } else if (line.startsWith('Vocabulary:')) {
                currentExample.vocabulary = line.substring(11).trim();
            }
        }

        // Add the last example
        if (currentExample.sentence && currentExample.vocabulary) {
            examples.push({ sentence: currentExample.sentence, vocabulary: currentExample.vocabulary });
        }

        return examples;
    }
}
