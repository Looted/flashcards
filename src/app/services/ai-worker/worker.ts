import { pipeline, env, TextGenerationPipeline } from "@huggingface/transformers";

// Skip local model check
env.allowLocalModels = false;

// Use the Singleton pattern to enable lazy construction of the pipeline.
class PipelineSingleton {
    static task: any = 'text-generation';
    static model = 'onnx-community/granite-4.0-350m-ONNX';
    static instance?: TextGenerationPipeline = undefined;

  static async getInstance(progress_callback?: (x: any) => void): Promise<TextGenerationPipeline> {
    if (this.instance === undefined) {
      console.log('Loading AI word generation pipeline in worker...');
      this.instance = await pipeline<'text-generation'>(this.task, this.model, { device: 'webgpu', progress_callback, dtype: "q4f16" });
      console.log('AI word generation pipeline loaded in worker.');
    }
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {

  console.log('Worker handling AI word generation message');
  const generator = await PipelineSingleton.getInstance((x: any) => {
    // Forward progress updates to the main thread
    self.postMessage(x);
  });

  // Generate words based on the request
  console.log('Worker received request:', event.data);
  const { theme, count } = event.data;

  const prompt = `Generate ${count} English-Polish vocabulary word pairs for the theme "${theme}". Each pair should be a common word or phrase used in this context. Format each pair as: English: [word] | Polish: [translation]

Examples for theme "IT":
English: computer | Polish: komputer
English: software | Polish: oprogramowanie
English: internet | Polish: internet

Theme: ${theme}
Generate exactly ${count} pairs:`;

  const messages = [
    { role: "system", content: "You are a helpful assistant that generates accurate English-Polish vocabulary pairs for given themes. Always provide exact translations and format them properly." },
    { role: "user", content: prompt }
  ];

  const output = await generator(messages, {
    max_new_tokens: 500,
    temperature: 0.3
  });

  console.log('Generated words in worker:', output);

  // Parse the generated text to extract word pairs
  const generatedText = (output as any)[0].generated_text.at(-1).content;
  const pairs: {english: string, polish: string}[] = [];
  const lines = generatedText.split('\n');

  for (const line of lines) {
    const match = line.match(/English:\s*([^|]+)\s*\|\s*Polish:\s*(.+)/i);
    if (match) {
      pairs.push({
        english: match[1].trim(),
        polish: match[2].trim()
      });
    }
  }

  // Send the output back to the main thread
  self.postMessage({
    status: 'complete',
    pairs: pairs.slice(0, count)
  });
});
