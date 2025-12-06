import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { deploySite, generateDeploymentScript } from '@/lib/nginx';
import { getOutputDir } from '@/lib/queue';
import * as fs from 'fs/promises';
import * as path from 'path';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/sites/[id]/deploy - Deploy site to server
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const useSSL = body.ssl !== false; // Default to true

        const site = await prisma.site.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { articles: true },
                },
            },
        });

        if (!site) {
            return NextResponse.json(
                { error: 'Site not found' },
                { status: 404 }
            );
        }

        if (site._count.articles === 0) {
            return NextResponse.json(
                { error: 'No articles generated yet. Run generation first.' },
                { status: 400 }
            );
        }

        // Check if output directory exists
        const outputDir = getOutputDir(site.subdomain);
        try {
            await fs.access(outputDir);
        } catch {
            return NextResponse.json(
                { error: 'Static files not found. Run generation first.' },
                { status: 400 }
            );
        }

        try {
            await deploySite(site.subdomain, outputDir, useSSL);

            await prisma.site.update({
                where: { id },
                data: { status: 'deployed', progress: 100 },
            });

            const domain = `${site.subdomain}.${process.env.BASE_DOMAIN || 'aksi.info'}`;

            return NextResponse.json({
                success: true,
                message: 'Site deployed successfully',
                url: `https://${domain}`,
            });
        } catch (deployError) {
            // If automated deployment fails, return manual script
            const script = generateDeploymentScript(site.subdomain);

            return NextResponse.json({
                success: false,
                message: 'Automated deployment failed. Use manual script.',
                error: (deployError as Error).message,
                manualScript: script,
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error deploying site:', error);
        return NextResponse.json(
            { error: 'Failed to deploy site' },
            { status: 500 }
        );
    }
}

// GET /api/sites/[id]/deploy - Get deployment script
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const site = await prisma.site.findUnique({
            where: { id },
        });

        if (!site) {
            return NextResponse.json(
                { error: 'Site not found' },
                { status: 404 }
            );
        }

        const script = generateDeploymentScript(site.subdomain);
        const outputDir = path.join(process.cwd(), 'output', site.subdomain);

        return NextResponse.json({
            subdomain: site.subdomain,
            domain: `${site.subdomain}.${process.env.BASE_DOMAIN || 'aksi.info'}`,
            outputDir,
            script,
        });
    } catch (error) {
        console.error('Error generating deployment script:', error);
        return NextResponse.json(
            { error: 'Failed to generate deployment script' },
            { status: 500 }
        );
    }
}
