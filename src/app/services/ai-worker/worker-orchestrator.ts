import { TextGenerationPipelineFactory } from './ai-pipelines';
import { TextParser, Example } from './text-parser';
import { PromptBuilder } from './prompt-builder';
import { TranslationService } from './translation-service';

export interface WorkerRequest {
    theme: string;
    count: number;
    difficulty?: number | null;
}

export interface WorkerResponse {
    status: 'complete' | 'error';
    pairs?: Array<{ english: string; polish: string; difficulty: 'beginner' | 'intermediate' | 'advanced' }>;
    error?: string;
}

export class WorkerOrchestrator {
    static async handleMessage(event: MessageEvent<WorkerRequest>): Promise<void> {
        console.log('Worker handling AI word generation message');
        const { theme, count, difficulty } = event.data;

        try {
            // Step 1: Generate English words only
            const generator = await TextGenerationPipelineFactory.getInstance(x => {
                self.postMessage({ ...x, step: 'generating' });
            });

            const messages = PromptBuilder.buildPrompt(theme, count, difficulty);

            console.log('AI Prompt:', messages[1].content);

            const output = await generator(messages, {
                max_new_tokens: 750,
                temperature: 0.7,
                do_sample: true
            });

            const generatedText = (output as any)[0].generated_text;
            console.log('AI Raw Response:', generatedText);
            const examples: Example[] = TextParser.parseExamples(generatedText);

            // Step 2: Translate with Context Injection
            const pairs = await TranslationService.translateExamples(examples, count, x => {
                self.postMessage({ ...x, step: 'translating' });
            });

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
