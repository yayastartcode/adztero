import prisma from './db';
import { expandKeywords } from './keywords';
import { generateArticle, GeneratedArticle } from './gemini';
import { generateStaticSite, createSlug } from './generator';
import * as path from 'path';

type JobType = 'keyword_expansion' | 'article_generation' | 'static_generation' | 'deployment';

interface JobPayload {
    keywordId?: string;
    keyword?: string;
}

// Get the output directory for generated sites
export function getOutputDir(subdomain: string): string {
    return path.join(process.cwd(), 'output', subdomain);
}

// Create a new job
export async function createJob(
    siteId: string,
    type: JobType,
    payload?: JobPayload
): Promise<string> {
    const job = await prisma.job.create({
        data: {
            siteId,
            type,
            payload: payload ? JSON.stringify(payload) : null,
            status: 'pending',
        },
    });
    return job.id;
}

// Update job status
export async function updateJobStatus(
    jobId: string,
    status: 'pending' | 'running' | 'completed' | 'failed',
    error?: string
): Promise<void> {
    await prisma.job.update({
        where: { id: jobId },
        data: {
            status,
            error,
            attempts: { increment: 1 },
        },
    });
}

// Update site progress
export async function updateSiteProgress(
    siteId: string,
    status: string,
    progress: number,
    errorMsg?: string
): Promise<void> {
    await prisma.site.update({
        where: { id: siteId },
        data: { status, progress, errorMsg },
    });
}

// Process keyword expansion for a site
export async function processKeywordExpansion(
    siteId: string,
    targetCount: number = 500
): Promise<string[]> {
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) throw new Error('Site not found');

    await updateSiteProgress(siteId, 'expanding', 0);

    // Expand keywords
    const keywords = await expandKeywords(
        site.mainKeyword,
        targetCount,
        async (current, total) => {
            const progress = Math.floor((current / total) * 100);
            await updateSiteProgress(siteId, 'expanding', Math.min(progress, 99));
        }
    );

    // Save keywords to database
    // Note: We don't use skipDuplicates as it's not supported in SQLite
    // Keywords are already deduplicated in expandKeywords()
    await prisma.keyword.createMany({
        data: keywords.map((keyword) => ({
            keyword,
            siteId,
            processed: false,
        })),
    });

    await updateSiteProgress(siteId, 'expanding', 100);

    return keywords;
}

// Process article generation for all keywords of a site
export async function processArticleGeneration(
    siteId: string,
    onProgress?: (current: number, total: number) => Promise<void>
): Promise<number> {
    await updateSiteProgress(siteId, 'generating', 0);

    // Get all unprocessed keywords
    const keywords = await prisma.keyword.findMany({
        where: { siteId, processed: false },
        orderBy: { createdAt: 'asc' },
    });

    if (keywords.length === 0) {
        return 0;
    }

    let completed = 0;
    const total = keywords.length;

    // Get some related keywords for context
    const allKeywords = keywords.map((k: { keyword: string }) => k.keyword);

    for (const kw of keywords) {
        try {
            // Generate article
            const article = await generateArticle(kw.keyword, allKeywords.slice(0, 10));

            // Save article
            await prisma.article.create({
                data: {
                    title: article.title,
                    slug: createSlug(article.title),
                    content: article.content,
                    metaDesc: article.metaDescription,
                    siteId,
                    keywordId: kw.id,
                },
            });

            // Mark keyword as processed
            await prisma.keyword.update({
                where: { id: kw.id },
                data: { processed: true },
            });

            completed++;
            const progress = Math.floor((completed / total) * 100);
            await updateSiteProgress(siteId, 'generating', progress);
            await onProgress?.(completed, total);

        } catch (error) {
            console.error(`Failed to generate article for "${kw.keyword}":`, error);
            // Continue with next keyword
        }
    }

    return completed;
}

// Process static site generation
export async function processStaticGeneration(
    siteId: string,
    themeId?: string
): Promise<string> {
    await updateSiteProgress(siteId, 'building', 0);

    const site = await prisma.site.findUnique({
        where: { id: siteId },
        include: {
            articles: {
                include: {
                    keyword: true, // Include keyword for related posts
                },
            },
        },
    });

    if (!site) throw new Error('Site not found');

    const outputDir = getOutputDir(site.subdomain);

    await generateStaticSite(site, site.articles, outputDir, themeId);

    await updateSiteProgress(siteId, 'built', 100);

    return outputDir;
}

// Run full pipeline for a site
export async function runFullPipeline(
    siteId: string,
    options: {
        keywordCount?: number;
        onKeywordProgress?: (current: number, total: number) => Promise<void>;
        onArticleProgress?: (current: number, total: number) => Promise<void>;
    } = {}
): Promise<{
    keywords: number;
    articles: number;
    outputDir: string;
}> {
    const { keywordCount = 500 } = options;

    console.log(`Starting full pipeline for site ${siteId}`);

    // Step 1: Keyword expansion
    console.log('Step 1: Expanding keywords...');
    const keywords = await processKeywordExpansion(siteId, keywordCount);
    console.log(`Generated ${keywords.length} keywords`);

    // Step 2: Article generation
    console.log('Step 2: Generating articles...');
    const articlesGenerated = await processArticleGeneration(siteId, options.onArticleProgress);
    console.log(`Generated ${articlesGenerated} articles`);

    // Step 3: Static site generation
    console.log('Step 3: Building static site...');
    const outputDir = await processStaticGeneration(siteId);
    console.log(`Static site built at ${outputDir}`);

    await updateSiteProgress(siteId, 'deployed', 100);

    return {
        keywords: keywords.length,
        articles: articlesGenerated,
        outputDir,
    };
}

// Get pending jobs
export async function getPendingJobs(limit: number = 10): Promise<{
    id: string;
    type: string;
    siteId: string;
    payload: string | null;
}[]> {
    return prisma.job.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take: limit,
        select: {
            id: true,
            type: true,
            siteId: true,
            payload: true,
        },
    });
}

// Clean up old jobs
export async function cleanupOldJobs(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.job.deleteMany({
        where: {
            status: { in: ['completed', 'failed'] },
            createdAt: { lt: cutoffDate },
        },
    });

    return result.count;
}
