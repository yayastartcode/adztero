import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiting configuration
const GEMINI_RPM = parseInt(process.env.GEMINI_RPM || '10');
const MIN_DELAY_MS = Math.ceil(60000 / GEMINI_RPM); // Minimum delay between requests

let lastRequestTime = 0;

// API Key rotation support
let apiKeys: string[] = [];
let currentKeyIndex = 0;

// Initialize API keys from environment
function initializeApiKeys() {
    if (apiKeys.length > 0) return; // Already initialized

    const primaryKey = process.env.GEMINI_API_KEY;
    const rotatingKeys = process.env.GEMINI_API_KEYS; // Comma-separated keys

    if (rotatingKeys) {
        // Use multiple keys for rotation
        apiKeys = rotatingKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
        console.log(`🔑 Using ${apiKeys.length} API keys for rotation`);
    } else if (primaryKey && primaryKey !== 'your-gemini-api-key-here') {
        // Use single key
        apiKeys = [primaryKey];
        console.log(`🔑 Using single API key`);
    } else {
        throw new Error('GEMINI_API_KEY or GEMINI_API_KEYS is not configured. Get one from https://aistudio.google.com/apikey');
    }
}

// Initialize Gemini client with round-robin key selection
function getGeminiClient() {
    initializeApiKeys();

    // Round-robin through available keys
    const apiKey = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;

    return new GoogleGenerativeAI(apiKey);
}

// Rate limiter - ensures we don't exceed RPM limit
async function rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < MIN_DELAY_MS) {
        const waitTime = MIN_DELAY_MS - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
}

// Retry with exponential backoff
async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Check if it's a rate limit error
            if (lastError.message.includes('429') || lastError.message.includes('RESOURCE_EXHAUSTED')) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.log(`Rate limited. Waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }

    throw lastError;
}

export interface GeneratedArticle {
    title: string;
    metaDescription: string;
    content: string; // HTML content
}

// Generate SEO-optimized article from keyword
export async function generateArticle(keyword: string, relatedKeywords: string[] = []): Promise<GeneratedArticle> {
    await rateLimit();

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const relatedKwList = relatedKeywords.slice(0, 5).join(', ');

    const prompt = `You are an expert SEO content writer. Generate a comprehensive, SEO-optimized article about "${keyword}".

REQUIREMENTS:
1. Title: Catchy, includes the main keyword, under 60 characters
2. Meta Description: Compelling, 150-160 characters, includes keyword
3. Content: 1500-2000 words, well-structured with H2 and H3 headings

STRUCTURE:
- Introduction with hook
- 3-5 main sections with H2 headings
- Subsections with H3 where appropriate
- FAQ section with 3-5 questions
- Conclusion with call-to-action

INCLUDE:
- Natural keyword usage (2-3% density)
- Related keywords: ${relatedKwList || 'use semantically related terms'}
- Bullet points and numbered lists where appropriate
- Practical tips and actionable advice

OUTPUT FORMAT (JSON):
{
  "title": "Your SEO Title Here",
  "metaDescription": "Your meta description here (150-160 chars)",
  "content": "<article>Full HTML content with h2, h3, p, ul, ol tags</article>"
}

Respond ONLY with valid JSON, no markdown code blocks.`;

    return withRetry(async () => {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean up response - remove markdown code blocks if present
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.slice(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.slice(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.slice(0, -3);
        }
        cleanText = cleanText.trim();

        try {
            const parsed = JSON.parse(cleanText);
            return {
                title: parsed.title || `Guide to ${keyword}`,
                metaDescription: parsed.metaDescription || `Learn everything about ${keyword}. Comprehensive guide with tips and best practices.`,
                content: parsed.content || `<p>Article about ${keyword}</p>`,
            };
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', text.substring(0, 200));
            throw new Error('Failed to parse AI response as JSON');
        }
    });
}

// Generate keyword variations using AI
export async function generateKeywordVariations(seedKeyword: string, count: number = 50): Promise<string[]> {
    await rateLimit();

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Generate ${count} unique, SEO-valuable long-tail keyword variations for "${seedKeyword}".

Include:
- Question-based keywords (how to, what is, why, when)
- Comparison keywords (vs, or, compared to)
- Intent-based keywords (best, top, review, guide, tutorial)
- Location/modifier keywords (near me, online, free)
- Year-based keywords (2024, 2025)

Output as JSON array of strings only:
["keyword 1", "keyword 2", ...]

No explanations, just the JSON array.`;

    return withRetry(async () => {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean up response
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.slice(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.slice(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.slice(0, -3);
        }
        cleanText = cleanText.trim();

        try {
            const parsed = JSON.parse(cleanText);
            if (Array.isArray(parsed)) {
                return parsed.filter(k => typeof k === 'string' && k.trim().length > 0);
            }
            throw new Error('Response is not an array');
        } catch (parseError) {
            console.error('Failed to parse keyword variations:', text.substring(0, 200));
            return [];
        }
    });
}
