import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { runFullPipeline } from '@/lib/queue';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/sites/[id]/generate - Start full generation pipeline
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const keywordCount = body.keywordCount || 500;

        const site = await prisma.site.findUnique({
            where: { id },
        });

        if (!site) {
            return NextResponse.json(
                { error: 'Site not found' },
                { status: 404 }
            );
        }

        // Check if already processing
        if (['expanding', 'generating', 'building'].includes(site.status)) {
            return NextResponse.json(
                { error: 'Site is already being processed', status: site.status },
                { status: 409 }
            );
        }

        // Start pipeline in background (non-blocking)
        // In production, this would be handled by a proper job queue
        runFullPipeline(id, { keywordCount })
            .then((result) => {
                console.log(`Pipeline completed for ${site.subdomain}:`, result);
            })
            .catch((error) => {
                console.error(`Pipeline failed for ${site.subdomain}:`, error);
                prisma.site.update({
                    where: { id },
                    data: { status: 'error', errorMsg: error.message },
                }).catch(console.error);
            });

        return NextResponse.json({
            message: 'Generation started',
            site: {
                id: site.id,
                subdomain: site.subdomain,
                status: 'expanding',
            },
        });
    } catch (error) {
        console.error('Error starting generation:', error);
        return NextResponse.json(
            { error: 'Failed to start generation' },
            { status: 500 }
        );
    }
}

// GET /api/sites/[id]/generate - Get generation status
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const site = await prisma.site.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        keywords: true,
                        articles: true,
                    },
                },
            },
        });

        if (!site) {
            return NextResponse.json(
                { error: 'Site not found' },
                { status: 404 }
            );
        }

        // Get processed keyword count
        const processedKeywords = await prisma.keyword.count({
            where: { siteId: id, processed: true },
        });

        return NextResponse.json({
            status: site.status,
            progress: site.progress,
            error: site.errorMsg,
            stats: {
                totalKeywords: site._count.keywords,
                processedKeywords,
                totalArticles: site._count.articles,
            },
        });
    } catch (error) {
        console.error('Error fetching generation status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch status' },
            { status: 500 }
        );
    }
}
