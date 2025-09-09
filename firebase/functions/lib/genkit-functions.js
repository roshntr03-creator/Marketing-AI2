"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoFlow = exports.generateStreamingContentFlow = exports.generateContentFlow = void 0;
const core_1 = require("@genkit-ai/core");
const googleai_1 = require("@genkit-ai/googleai");
const functions_1 = require("@genkit-ai/firebase/functions");
// Configure Genkit
(0, core_1.configureGenkit)({
    plugins: [(0, googleai_1.googleAI)()],
});
// Define flows for different AI operations
exports.generateContentFlow = (0, functions_1.onFlow)({
    name: 'generateContent',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: { type: 'string' },
            model: { type: 'string', default: 'gemini-1.5-flash' },
            config: { type: 'object' }
        },
        required: ['prompt']
    },
    outputSchema: {
        type: 'object',
        properties: {
            text: { type: 'string' },
            candidates: { type: 'array' }
        }
    }
}, async (input) => {
    const { prompt, model = 'gemini-1.5-flash', config = {} } = input;
    const selectedModel = model === 'gemini-1.5-pro' ? googleai_1.gemini15Pro : googleai_1.gemini15Flash;
    const { generate } = await Promise.resolve().then(() => __importStar(require('@genkit-ai/ai')));
    const response = await generate({
        model: selectedModel,
        prompt: prompt,
        config: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            ...config
        }
    });
    return {
        text: response.text,
        candidates: response.candidates || []
    };
});
exports.generateStreamingContentFlow = (0, functions_1.onFlow)({
    name: 'generateStreamingContent',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: { type: 'string' },
            model: { type: 'string', default: 'gemini-1.5-flash' },
            config: { type: 'object' }
        },
        required: ['prompt']
    },
    outputSchema: {
        type: 'object',
        properties: {
            stream: { type: 'boolean' }
        }
    },
    streamSchema: {
        type: 'string'
    }
}, async function* (input) {
    const { prompt, model = 'gemini-1.5-flash', config = {} } = input;
    const selectedModel = model === 'gemini-1.5-pro' ? googleai_1.gemini15Pro : googleai_1.gemini15Flash;
    const { generateStream } = await Promise.resolve().then(() => __importStar(require('@genkit-ai/ai')));
    const response = await generateStream({
        model: selectedModel,
        prompt: prompt,
        config: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            ...config
        }
    });
    for await (const chunk of response) {
        yield chunk.text;
    }
});
exports.generateVideoFlow = (0, functions_1.onFlow)({
    name: 'generateVideo',
    inputSchema: {
        type: 'object',
        properties: {
            prompt: { type: 'string' },
            config: { type: 'object' }
        },
        required: ['prompt']
    },
    outputSchema: {
        type: 'object',
        properties: {
            videoUrl: { type: 'string' },
            status: { type: 'string' }
        }
    }
}, async (input) => {
    const { prompt, config = {} } = input;
    // This would use the video generation model when available
    // For now, we'll return a placeholder
    return {
        videoUrl: '',
        status: 'Video generation with Genkit coming soon'
    };
});
//# sourceMappingURL=genkit-functions.js.map