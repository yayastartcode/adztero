import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createSlug } from '@/lib/generator';

// GET /api/sites - List all sites
export async function GET() {
    try {
        const sites = await prisma.site.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        keywords: true,
                        articles: true,
                    },
                },
            },
        });

        return NextResponse.json({ sites });
    } catch (error) {
        console.error('Error fetching sites:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sites' },
            { status: 500 }
        );
    }
}

// POST /api/sites - Create new site
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { keyword } = body;

        if (!keyword || typeof keyword !== 'string') {
            return NextResponse.json(
                { error: 'Keyword is required' },
                { status: 400 }
            );
        }

        const subdomain = createSlug(keyword);

        // Check if subdomain already exists
        const existing = await prisma.site.findUnique({
            where: { subdomain },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'A site with this keyword already exists', subdomain },
                { status: 409 }
            );
        }

        const site = await prisma.site.create({
            data: {
                subdomain,
                mainKeyword: keyword.trim(),
                status: 'pending',
                progress: 0,
            },
        });

        return NextResponse.json({ site }, { status: 201 });
    } catch (error) {
        console.error('Error creating site:', error);
        return NextResponse.json(
            { error: 'Failed to create site' },
            { status: 500 }
        );
    }
}
