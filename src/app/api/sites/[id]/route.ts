import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import * as fs from 'fs/promises';
import * as path from 'path';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/sites/[id] - Get site details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const site = await prisma.site.findUnique({
            where: { id },
            include: {
                keywords: {
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                },
                articles: {
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        metaDesc: true,
                        createdAt: true,
                    },
                },
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

        return NextResponse.json({ site });
    } catch (error) {
        console.error('Error fetching site:', error);
        return NextResponse.json(
            { error: 'Failed to fetch site' },
            { status: 500 }
        );
    }
}

// DELETE /api/sites/[id] - Delete a site and its output files
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // First get the site to know the subdomain
        const site = await prisma.site.findUnique({
            where: { id },
        });

        if (!site) {
            return NextResponse.json(
                { error: 'Site not found' },
                { status: 404 }
            );
        }

        // Delete output folder if it exists
        const outputDir = path.join(process.cwd(), 'output', site.subdomain);
        try {
            await fs.rm(outputDir, { recursive: true, force: true });
            console.log(`Deleted output folder: ${outputDir}`);
        } catch (fsError) {
            // Folder might not exist, that's okay
            console.log(`Output folder not found or already deleted: ${outputDir}`);
        }

        // Delete from database (cascades to keywords and articles)
        await prisma.site.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: `Site "${site.subdomain}" and its output files deleted`
        });
    } catch (error) {
        console.error('Error deleting site:', error);
        return NextResponse.json(
            { error: 'Failed to delete site' },
            { status: 500 }
        );
    }
}
