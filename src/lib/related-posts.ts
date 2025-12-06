// Calculate similarity between two strings based on common words
function calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
}

interface ArticleWithKeyword {
    id: string;
    title: string;
    slug: string;
    metaDesc: string;
    keyword: {
        keyword: string;
    };
}

export function findRelatedArticles(
    currentArticle: ArticleWithKeyword,
    allArticles: ArticleWithKeyword[],
    limit: number = 5
): ArticleWithKeyword[] {
    // Filter out current article
    const otherArticles = allArticles.filter(a => a.id !== currentArticle.id);

    if (otherArticles.length === 0) return [];

    // Calculate similarity scores
    const scored = otherArticles.map(article => {
        // Similarity based on title
        const titleSimilarity = calculateSimilarity(
            currentArticle.title,
            article.title
        );

        // Similarity based on keywords
        const keywordSimilarity = calculateSimilarity(
            currentArticle.keyword.keyword,
            article.keyword.keyword
        );

        // Combined score (weighted)
        const score = (titleSimilarity * 0.6) + (keywordSimilarity * 0.4);

        return { article, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // If we don't have enough highly related articles, add some random ones
    const related = scored.slice(0, limit);

    // If we need more articles and have low similarity scores, shuffle the rest
    if (related.length < limit && related.length > 0 && related[related.length - 1].score < 0.1) {
        const remaining = otherArticles.filter(
            a => !related.find(r => r.article.id === a.id)
        );

        // Shuffle and take what we need
        const shuffled = remaining.sort(() => Math.random() - 0.5);
        const needed = limit - related.length;

        return [
            ...related.map(r => r.article),
            ...shuffled.slice(0, needed),
        ];
    }

    return related.map(r => r.article);
}
