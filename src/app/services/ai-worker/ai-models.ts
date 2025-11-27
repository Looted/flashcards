import { pipeline, env, TextGenerationPipeline, TranslationPipeline, ProgressCallback } from "@huggingface/transformers";

// Skip local model check
env.allowLocalModels = false;

// Use the Singleton pattern to enable lazy construction of the pipeline.
export class TextGenerationSingleton {
    static task: any = 'text-generation';
    static model = 'HuggingFaceTB/SmolLM2-360M-Instruct';
    static instance?: TextGenerationPipeline = undefined;

    static async getInstance(progress_callback?: ProgressCallback): Promise<TextGenerationPipeline> {
        if (this.instance === undefined) {
            console.log('Loading AI text generation pipeline in worker...');
            this.instance = await pipeline<'text-generation'>(this.task, this.model, { device: 'webgpu', progress_callback });
            console.log('AI text generation pipeline loaded in worker.');
        }
        return this.instance;
    }
}

export class TranslationSingleton {
    static task: any = 'translation';
    static model = 'Xenova/nllb-200-distilled-600M';
    static instance?: TranslationPipeline = undefined;

    static async getInstance(progress_callback?: ProgressCallback): Promise<TranslationPipeline> {
        if (this.instance === undefined) {
            console.log('Loading AI translation pipeline in worker...');
            this.instance = await pipeline<'translation'>(this.task, this.model, { device: 'wasm', progress_callback, dtype: "q8" });
            console.log('AI translation pipeline loaded in worker.');
        }
        return this.instance;
    }
}
