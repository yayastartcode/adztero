import { generateKeywordVariations } from './gemini';

// Keyword modifiers for expansion
const MODIFIERS = {
    question: ['what is', 'how to', 'why', 'when to', 'where to', 'who', 'can you', 'should i'],
    comparison: ['vs', 'or', 'compared to', 'versus', 'alternative to'],
    intent: ['best', 'top', 'review', 'guide', 'tutorial', 'tips', 'ideas', 'examples'],
    commercial: ['buy', 'price', 'cost', 'cheap', 'affordable', 'free', 'discount'],
    time: ['2024', '2025', 'today', 'now', 'latest', 'new'],
    location: ['near me', 'online', 'local'],
};

// Fetch suggestions from Google Suggest
async function fetchGoogleSuggest(query: string): Promise<string[]> {
    try {
        const url = `https://suggestqueries.google.com/complete/search?output=toolbar&hl=en&q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const text = await response.text();

        // Parse XML response
        const matches = text.match(/suggestion data="([^"]+)"/g) || [];
        return matches.map(m => {
            const match = m.match(/data="([^"]+)"/);
            return match ? match[1] : '';
        }).filter(Boolean);
    } catch (error) {
        console.error('Google Suggest error:', error);
        return [];
    }
}

// Fetch suggestions from Bing
async function fetchBingSuggest(query: string): Promise<string[]> {
    try {
        const url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
            return data[1].filter((s: unknown) => typeof s === 'string');
        }
        return [];
    } catch (error) {
        console.error('Bing Suggest error:', error);
        return [];
    }
}

// Fetch suggestions from DuckDuckGo
async function fetchDuckDuckGoSuggest(query: string): Promise<string[]> {
    try {
        const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`;
        const response = await fetch(url);
        const data = await response.json();

        if (Array.isArray(data)) {
            return data
                .filter((item: unknown) => typeof item === 'object' && item !== null && 'phrase' in item)
                .map((item: { phrase: string }) => item.phrase);
        }
        return [];
    } catch (error) {
        console.error('DuckDuckGo Suggest error:', error);
        return [];
    }
}

// Fetch related topics from Wikipedia
async function fetchWikipediaSuggest(query: string): Promise<string[]> {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=10&format=json&origin=*`;
        const response = await fetch(url);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
            return data[1].filter((s: unknown) => typeof s === 'string');
        }
        return [];
    } catch (error) {
        console.error('Wikipedia Suggest error:', error);
        return [];
    }
}

// Generate modified keywords
function generateModifiedKeywords(seedKeyword: string): string[] {
    const keywords: string[] = [];

    for (const [, mods] of Object.entries(MODIFIERS)) {
        for (const mod of mods) {
            // Prefix modifiers
            if (['what is', 'how to', 'why', 'when to', 'where to', 'who', 'can you', 'should i', 'best', 'top'].includes(mod)) {
                keywords.push(`${mod} ${seedKeyword}`);
            }
            // Suffix modifiers
            else if (['vs', 'or', 'compared to', 'versus', 'alternative to'].includes(mod)) {
                keywords.push(`${seedKeyword} ${mod}`);
            }
            // General modifiers
            else {
                keywords.push(`${seedKeyword} ${mod}`);
                keywords.push(`${mod} ${seedKeyword}`);
            }
        }
    }

    return keywords;
}

// Deduplicate and clean keywords
function deduplicateKeywords(keywords: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const keyword of keywords) {
        const normalized = keyword.toLowerCase().trim();
        if (normalized.length > 2 && !seen.has(normalized)) {
            seen.add(normalized);
            result.push(keyword.trim());
        }
    }

    return result;
}

// Main function: Expand seed keyword to target number of keywords
export async function expandKeywords(
    seedKeyword: string,
    targetCount: number = 500,
    onProgress?: (count: number, total: number) => void
): Promise<string[]> {
    const allKeywords = new Set<string>();
    allKeywords.add(seedKeyword);

    const queue: string[] = [seedKeyword];
    let processed = 0;

    // Phase 1: Add modifier-based keywords
    const modifiedKeywords = generateModifiedKeywords(seedKeyword);
    modifiedKeywords.forEach(k => allKeywords.add(k));
    queue.push(...modifiedKeywords.slice(0, 10)); // Add some to queue for expansion

    onProgress?.(allKeywords.size, targetCount);

    // Phase 2: Expand using suggestion APIs (recursive)
    while (queue.length > 0 && allKeywords.size < targetCount) {
        const currentKeyword = queue.shift()!;
        processed++;

        // Fetch from all sources in parallel
        const [googleResults, bingResults, ddgResults, wikiResults] = await Promise.all([
            fetchGoogleSuggest(currentKeyword),
            fetchBingSuggest(currentKeyword),
            fetchDuckDuckGoSuggest(currentKeyword),
            fetchWikipediaSuggest(currentKeyword),
        ]);

        const newKeywords = [...googleResults, ...bingResults, ...ddgResults, ...wikiResults];

        for (const keyword of newKeywords) {
            if (!allKeywords.has(keyword.toLowerCase())) {
                allKeywords.add(keyword);

                // Add to queue for further expansion (limit queue size)
                if (queue.length < 50 && allKeywords.size < targetCount * 0.8) {
                    queue.push(keyword);
                }
            }

            if (allKeywords.size >= targetCount) break;
        }

        onProgress?.(allKeywords.size, targetCount);

        // Small delay to avoid overwhelming APIs
        await new Promise(resolve => setTimeout(resolve, 100));

        // Safety: don't process too many
        if (processed > 100) break;
    }

    // Phase 3: Use AI to generate more variations if needed
    if (allKeywords.size < targetCount) {
        const remaining = targetCount - allKeywords.size;
        console.log(`Using AI to generate ${remaining} more keyword variations...`);

        try {
            const aiKeywords = await generateKeywordVariations(seedKeyword, Math.min(remaining, 100));
            aiKeywords.forEach(k => allKeywords.add(k));
            onProgress?.(allKeywords.size, targetCount);
        } catch (error) {
            console.error('AI keyword generation failed:', error);
        }
    }

    // Return deduplicated and cleaned list
    return deduplicateKeywords(Array.from(allKeywords)).slice(0, targetCount);
}

// Quick check if keyword expansion APIs are working
export async function testKeywordAPIs(): Promise<{
    google: boolean;
    bing: boolean;
    duckduckgo: boolean;
    wikipedia: boolean;
}> {
    const testQuery = 'test';

    const [google, bing, ddg, wiki] = await Promise.all([
        fetchGoogleSuggest(testQuery).then(r => r.length > 0).catch(() => false),
        fetchBingSuggest(testQuery).then(r => r.length > 0).catch(() => false),
        fetchDuckDuckGoSuggest(testQuery).then(r => r.length > 0).catch(() => false),
        fetchWikipediaSuggest(testQuery).then(r => r.length > 0).catch(() => false),
    ]);

    return { google, bing, duckduckgo: ddg, wikipedia: wiki };
}
