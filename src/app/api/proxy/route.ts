import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const secret = searchParams.get('s');

    if (!url || secret !== "ALERTVICE_INTEL_2026") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://t.me/'
            }
        });

        if (!response.ok) throw new Error("Failed to fetch asset");

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error: any) {
        return new NextResponse("Asset Retrieval Failed", { status: 500 });
    }
}
