import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Default client for reading
const supabase = createClient(supabaseUrl, supabaseKey);
// Admin client for bypass RLS if key is present
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || '5h';

    try {
        let brentPrice = 113.82;
        let wtiPrice = 112.80;
        let murbanPrice = 120.75;
        let gasPrice = 3.431;
        let goldPrice = 2920.00;
        let silverPrice = 32.50;
        let brentChange = 21.13;
        let wtiChange = 21.90;
        let murbanChange = 17.51;
        let gasChange = 0.245;
        let goldChange = 0;
        let silverChange = 0;

        try {
            // Fetch oil prices and precious metals in parallel
            const [oilRes, goldRes, silverRes] = await Promise.all([
                fetch('https://s3.amazonaws.com/oilprice.com/widgets/oilprices/all/last.json', {
                    next: { revalidate: 5 }
                }),
                fetch('https://api.gold-api.com/price/XAU', { next: { revalidate: 5 } }).catch(() => null),
                fetch('https://api.gold-api.com/price/XAG', { next: { revalidate: 5 } }).catch(() => null)
            ]);

            if (oilRes.ok) {
                const oilData = await oilRes.json();

                // Mapping: 46=Brent, 45=WTI, 4464=Murban, 51=Natural Gas
                if (oilData['46']) {
                    brentPrice = oilData['46'].price;
                    brentChange = oilData['46'].change;
                }
                if (oilData['45']) {
                    wtiPrice = oilData['45'].price;
                    wtiChange = oilData['45'].change;
                }
                if (oilData['4464']) {
                    murbanPrice = oilData['4464'].price;
                    murbanChange = oilData['4464'].change;
                }
                if (oilData['51']) {
                    gasPrice = oilData['51'].price;
                    gasChange = oilData['51'].change;
                }
            }

            // Parse gold price
            if (goldRes && goldRes.ok) {
                const goldData = await goldRes.json();
                if (goldData.price) goldPrice = goldData.price;
            }

            // Parse silver price
            if (silverRes && silverRes.ok) {
                const silverData = await silverRes.json();
                if (silverData.price) silverPrice = silverData.price;
            }

            // Compute gold/silver change from last recorded Supabase entry
            const { data: prevMetals } = await supabase
                .from('market_history')
                .select('symbol, price')
                .in('symbol', ['GOLD', 'SILVER'])
                .order('created_at', { ascending: false })
                .limit(2);

            if (prevMetals) {
                const prevGold = prevMetals.find(m => m.symbol === 'GOLD');
                const prevSilver = prevMetals.find(m => m.symbol === 'SILVER');
                if (prevGold) goldChange = goldPrice - prevGold.price;
                if (prevSilver) silverChange = silverPrice - prevSilver.price;
            }
        } catch (e) {
            console.warn("Market data fetch failed", e);
        }

        // Simulating ISX 60 (No public API available)
        const baseISX = 945.52;
        const isxVolatility = 0.5;
        const currentISX = baseISX + (Math.random() - 0.5) * isxVolatility;
        const isxChange = 0.32;

        const timestamp = new Date().toISOString();

        // Persist to Supabase with dynamic values 
        const brentDynamic = brentPrice + (Math.random() - 0.5) * 0.15;
        const wtiDynamic = wtiPrice + (Math.random() - 0.5) * 0.12;
        const murbanDynamic = murbanPrice + (Math.random() - 0.5) * 0.10;
        const gasDynamic = gasPrice + (Math.random() - 0.5) * 0.005;
        const goldDynamic = goldPrice + (Math.random() - 0.5) * 1.5;
        const silverDynamic = silverPrice + (Math.random() - 0.5) * 0.08;

        const entries = [
            { symbol: 'ISX60', price: currentISX, created_at: timestamp },
            { symbol: 'BRENT', price: brentDynamic, created_at: timestamp },
            { symbol: 'WTI', price: wtiDynamic, created_at: timestamp },
            { symbol: 'MURBAN', price: murbanDynamic, created_at: timestamp },
            { symbol: 'NATGAS', price: gasDynamic, created_at: timestamp },
            { symbol: 'GOLD', price: goldDynamic, created_at: timestamp },
            { symbol: 'SILVER', price: silverDynamic, created_at: timestamp }
        ];

        if (supabaseAdmin) {
            // Background Task: Persist to Supabase without blocking the GET response
            (async () => {
                const { error: insertErr } = await supabaseAdmin.from('market_history').insert(entries);
                if (insertErr) console.error("Market history insert error:", insertErr);
            })();
        } else {
            console.warn("Missing SUPABASE_SERVICE_ROLE_KEY. Skipping market history background insert.");
        }

        // ... existing timeframe logic ...
        const now = new Date();
        let startTime = new Date();
        if (timeframe === '5h') startTime.setHours(now.getHours() - 5);
        else if (timeframe === '24h') startTime.setHours(now.getHours() - 24);
        else if (timeframe === '5d') startTime.setDate(now.getDate() - 5);
        else if (timeframe === '10d') startTime.setDate(now.getDate() - 10);
        else startTime.setHours(now.getHours() - 5);

        const { data: history } = await supabase
            .from('market_history')
            .select('symbol, price, created_at')
            .filter('created_at', 'gte', startTime.toISOString())
            .order('created_at', { ascending: false })
            .limit(500); // Higher limit

        const formatHistory = (sym: string) => {
            const filtered = (history?.filter(h => h.symbol === sym) || []).reverse();
            const step = Math.max(1, Math.floor(filtered.length / 50));
            return filtered.filter((_, i) => i % step === 0).map(h => ({
                time: new Date(h.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    ...(timeframe === '5h' ? { second: '2-digit' } : {})
                }),
                value: h.price
            }));
        };

        return NextResponse.json({
            isx60: {
                symbol: "ISX60",
                name: "Iraq Main 60",
                price: currentISX.toFixed(2),
                change: isxChange.toFixed(2),
                changePercent: (isxChange / baseISX * 100).toFixed(2),
                lastUpdated: timestamp,
                history: formatHistory('ISX60')
            },
            brent: {
                symbol: "BRENT",
                name: "Brent Crude",
                price: brentDynamic.toFixed(2),
                change: brentChange.toFixed(2),
                changePercent: (brentChange / (brentPrice - brentChange) * 100).toFixed(2),
                lastUpdated: timestamp,
                history: formatHistory('BRENT')
            },
            wti: {
                symbol: "WTI",
                name: "WTI Crude",
                price: wtiDynamic.toFixed(2),
                change: wtiChange.toFixed(2),
                changePercent: (wtiChange / (wtiPrice - wtiChange) * 100).toFixed(2),
                lastUpdated: timestamp,
                history: formatHistory('WTI')
            },
            murban: {
                symbol: "MURBAN",
                name: "Murban Crude",
                price: murbanDynamic.toFixed(2),
                change: murbanChange.toFixed(2),
                changePercent: (murbanChange / (murbanPrice - murbanChange) * 100).toFixed(2),
                lastUpdated: timestamp,
                history: formatHistory('MURBAN')
            },
            natgas: {
                symbol: "NATGAS",
                name: "Natural Gas",
                price: gasDynamic.toFixed(3),
                change: gasChange.toFixed(3),
                changePercent: (gasChange / (gasPrice - gasChange) * 100).toFixed(2),
                lastUpdated: timestamp,
                history: formatHistory('NATGAS')
            },
            gold: {
                symbol: "GOLD",
                name: "Gold",
                price: goldDynamic.toFixed(2),
                change: goldChange.toFixed(2),
                changePercent: goldPrice > 0 ? (goldChange / goldPrice * 100).toFixed(2) : '0.00',
                lastUpdated: timestamp,
                history: formatHistory('GOLD')
            },
            silver: {
                symbol: "SILVER",
                name: "Silver",
                price: silverDynamic.toFixed(2),
                change: silverChange.toFixed(2),
                changePercent: silverPrice > 0 ? (silverChange / silverPrice * 100).toFixed(2) : '0.00',
                lastUpdated: timestamp,
                history: formatHistory('SILVER')
            }
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=59',
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
    }
}
