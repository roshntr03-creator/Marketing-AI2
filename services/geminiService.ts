/**
 * This file serves as a "barrel" file for Gemini-related services.
 * It re-exports all modules from the './gemini' directory, allowing for
 * cleaner and more convenient imports in other parts of the application.
 *
 * For example, instead of:
 * import { callGenerateContentApi } from './services/gemini/api';
 * import { getPrompt } from './services/gemini/prompts';
 *
 * You can do:
 * import { callGenerateContentApi, getPrompt } from './services/geminiService';
 */

export * from './gemini/api';
export * from './gemini/parser';
export * from './gemini/prompts';
