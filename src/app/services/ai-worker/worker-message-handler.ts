import { TextGenerationSingleton, TranslationSingleton } from './ai-models';
import { TextParser, Example } from './text-parser';

export interface WorkerRequest {
    theme: string;
    count: number;
}

export interface WorkerResponse {
    status: 'complete' | 'error';
    pairs?: Array<{ english: string; polish: string }>;
    error?: string;
}

export class WorkerMessageHandler {
    static async handleMessage(event: MessageEvent<WorkerRequest>): Promise<void> {
        console.log('Worker handling AI word generation message');
        const { theme, count } = event.data;

        try {
            // Step 1: Generate English words only
            const generator = await TextGenerationSingleton.getInstance(x => {
                self.postMessage({ ...x, step: 'generating' });
            });

            // STRATEGY UPDATE 1: Tweak prompt to ensure 'Sentence' is descriptive enough to provide context
            const prompt = `Generate exactly ${count} vocabulary learning examples for the theme "${theme}".
Crucial: The 'Sentence' must clearly demonstrate the meaning of the 'Vocabulary' word. The vocabulary word should always be a single word or phrase.

Format (repeat exactly for each example):
Sentence: [complete sentence]
Vocabulary: [word from the sentence]

Examples:
Sentence: The bad employee was fired from his job.
Vocabulary: fired

Sentence: The soldier fired his rifle at the target.
Vocabulary: fired

Sentence: Company really cares about employee work-life balance.
Vocabulary: work-life balance

Now generate exactly ${count} examples for theme "${theme}":`;

            const messages = [
                { role: "system", content: "You are an expert English teacher. Generate clear, context-rich vocabulary examples." },
                { role: "user", content: prompt }
            ];

            console.log('AI Prompt:', prompt);

            const output = await generator(messages, {
                max_new_tokens: 750, // Increased slightly to ensure full JSON/format completion
                temperature: 0.7,
                do_sample: true
            });

            const generatedText = (output as any)[0].generated_text.at(-1).content;
            console.log('AI Raw Response:', generatedText);
            const examples: Example[] = TextParser.parseExamples(generatedText);

            // Step 2: Translate with Context Injection
            const translator = await TranslationSingleton.getInstance(x => {
                self.postMessage({ ...x, step: 'translating' });
            });

            const pairs: { english: string, polish: string }[] = [];

            // We use a distinct separator that is unlikely to be modified by the translator
            // " === " is usually preserved or translated to " === "
            const SEPARATOR = " === ";

            for (const example of examples.slice(0, count)) {
                try {
                    console.log(`Translating with context: "${example.vocabulary}"`);

                    // STRATEGY UPDATE 2: Context Injection
                    // We send "Sentence === Word". The model translates the sentence first,
                    // establishing the context (e.g., "employment"), so when it hits
                    // "fired" after the separator, it maps it to "zwolniony" instead of "wystrzelony".
                    const inputWithContext = `${example.sentence}${SEPARATOR}${example.vocabulary}`;

                    const translationResult = await translator(inputWithContext, {
                        src_lang: 'eng_Latn',
                        tgt_lang: 'pol_Latn'
                    } as any);

                    const fullTranslatedText = (translationResult as any)[0]?.translation_text;

                    let polishWord = '';

                    // STRATEGY UPDATE 3: Parse the contextualized output
                    if (fullTranslatedText && fullTranslatedText.includes('===')) {
                        // Split by separator and take the word part
                        const parts = fullTranslatedText.split('===');
                        polishWord = parts[parts.length - 1].trim();

                        // Cleanup: Remove any trailing punctuation the translator might have added (like a period)
                        polishWord = polishWord.replace(/[.,;!?]+$/, '');
                    } else {
                        // Fallback: If separator was lost, try to translate just the word
                        // This happens rarely, but good to have a safety net
                        console.warn('Separator lost in translation, retrying single word...');
                        const retryResult = await translator(example.vocabulary, {
                            src_lang: 'eng_Latn',
                            tgt_lang: 'pol_Latn'
                        } as any);
                        polishWord = (retryResult as any)[0]?.translation_text;
                    }

                    if (polishWord) {
                        // Sanity check: Ensure we didn't get the english word back (unless they are same)
                        // and capitalize consistency (optional, but nice for Flashcards)
                        polishWord = polishWord.toLowerCase();

                        pairs.push({
                            english: example.vocabulary,
                            polish: polishWord
                        });
                        console.log(`Contextual success: "${example.vocabulary}" (Context: ${example.sentence}) -> "${polishWord}"`);
                    } else {
                        throw new Error("Empty translation");
                    }

                } catch (translationError) {
                    console.error(`Translation failed for "${example.vocabulary}":`, translationError);
                    pairs.push({
                        english: example.vocabulary,
                        polish: example.vocabulary // Fallback
                    });
                }
            }

            const finalMessage: WorkerResponse = {
                status: 'complete',
                pairs: pairs
            };
            self.postMessage(finalMessage);

        } catch (error) {
            console.error('Worker error:', error);
            self.postMessage({
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
