import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const secret = searchParams.get('s');

    if (!url || secret !== "ALERTVICE_INTEL_2026") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const fetchHeaders: HeadersInit = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://t.me/'
        };

        // Forward Range header to support iOS/Android native video seekings
        const range = request.headers.get('range');
        if (range) {
            fetchHeaders['Range'] = range;
        }

        const response = await fetch(url, { headers: fetchHeaders });

        if (!response.ok && response.status !== 206) {
            throw new Error("Failed to fetch asset");
        }

        const responseHeaders = new Headers();
        
        // Bridge critical media streaming headers
        const headersToKeep = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified'];
        headersToKeep.forEach(h => {
            const val = response.headers.get(h);
            if (val) responseHeaders.set(h, val);
        });

        // Ensure cross-origin policies are met
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');

        // Stream the ReadableStream back directly
        return new NextResponse(response.body, {
            status: response.status === 206 ? 206 : 200,
            headers: responseHeaders
        });
    } catch (error: any) {
        return new NextResponse("Asset Retrieval Failed", { status: 500 });
    }
}
