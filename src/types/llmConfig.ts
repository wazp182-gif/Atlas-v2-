export interface CustomLLMConfig {
  provider: 'gemini' | 'ollama' | 'openai-compatible';
  geminiApiKey?: string;
  geminiModel?: string;
  ollamaEndpoint?: string; // e.g. "http://localhost:11434" or tunnel URL
  ollamaModel?: string;    // e.g. "llama3", "mistral", "qwen2.5"
  customHeaders?: Record<string, string>;
}

export const DEFAULT_LLM_CONFIG: CustomLLMConfig = {
  provider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3:latest',
};
