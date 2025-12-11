/**
 * Available text-only LLM models for the wizard
 * These models are used for conversational AI in the book creation wizard
 */

export interface TextLLMModel {
  value: string;
  label: string;
  description?: string;
}

export const TEXT_LLM_MODELS: TextLLMModel[] = [
  // Google Gemini Models
  {
    value: 'google/gemini-3-pro-preview',
    label: 'Gemini 3 Pro Preview (Latest)',
    description: 'Newest Gemini model - best quality'
  },
  {
    value: 'google/gemini-2.0-flash-exp',
    label: 'Gemini 2.0 Flash (Recommended)',
    description: 'Fast, high-quality responses'
  },
  {
    value: 'google/gemini-pro',
    label: 'Gemini Pro',
    description: 'Balanced performance and quality'
  },
  
  // Anthropic Claude Models (Latest versions)
  {
    value: 'anthropic/claude-sonnet-4.5',
    label: 'Claude Sonnet 4.5',
    description: 'Latest Sonnet - best for creative writing and analysis'
  },
  {
    value: 'anthropic/claude-opus-4.5',
    label: 'Claude Opus 4.5',
    description: 'Latest Opus - most capable, best for complex tasks'
  },
  {
    value: 'anthropic/claude-haiku-4.5',
    label: 'Claude Haiku 4.5',
    description: 'Latest Haiku - fast and cost-effective'
  },
  
  // OpenAI GPT Models
  {
    value: 'openai/gpt-5-chat',
    label: 'GPT-5 Chat',
    description: 'Latest GPT-5 model'
  },
  {
    value: 'openai/gpt-4-turbo',
    label: 'GPT-4 Turbo',
    description: 'High quality, slower'
  },
  {
    value: 'openai/gpt-4o',
    label: 'GPT-4o',
    description: 'Multimodal, very capable'
  },
  {
    value: 'openai/gpt-4o-mini',
    label: 'GPT-4o Mini',
    description: 'Fast and affordable'
  },
  {
    value: 'openai/gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    description: 'Budget-friendly option'
  },
  
  // Meta Llama Models
  {
    value: 'meta-llama/llama-3.1-70b-instruct',
    label: 'Llama 3.1 70B',
    description: 'Open source, good quality'
  },
  {
    value: 'meta-llama/llama-3.1-8b-instruct',
    label: 'Llama 3.1 8B',
    description: 'Fast, budget-friendly'
  },
  
  // Mistral Models
  {
    value: 'mistralai/mistral-large',
    label: 'Mistral Large',
    description: 'European alternative, very capable'
  },
  {
    value: 'mistralai/mistral-medium',
    label: 'Mistral Medium',
    description: 'Balanced performance'
  },
  {
    value: 'mistralai/mistral-small',
    label: 'Mistral Small',
    description: 'Fast and efficient'
  }
];
