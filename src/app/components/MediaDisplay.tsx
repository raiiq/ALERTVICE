"use client";

export const parseMedia = (val: string | null | any[]): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
        try {
            return JSON.parse(val);
        } catch {
            return [val];
        }
    }
    return [typeof val === 'string' ? val : String(val)];
};

export const deduplicateTitle = (title: string | null) => {
    if (!title) return title;
    const t = title.trim();
    const half = Math.floor(t.length / 2);
    const first = t.substring(0, half).trim();
    const second = t.substring(half).trim();
    if (first === second && first.length > 3) return first;
    return t;
};

export const MediaDisplay = ({ images, videos, hasVideo, isAr, aspect, singleMode }: { images: string[], videos: string[], hasVideo: boolean, isAr: boolean, aspect?: string, singleMode?: boolean }) => {
    const allMedia = [
        ...videos.map(v => ({ type: 'video', url: v })),
        ...images.map(img => ({ type: 'image', url: img }))
    ].filter(item => item.url);

    if (allMedia.length === 0 && !hasVideo) return null;

    if (allMedia.length === 1 || singleMode) {
        const item = allMedia[0];
        if (!item) return null;
        return (
            <div className={`w-full h-full relative overflow-hidden rounded-lg border border-border shadow-lg bg-black ${aspect || ''} group/media`}>
                {item.type === 'video' ? (
                    <video src={item.url} controls className={`w-full h-full object-contain mx-auto`} />
                ) : (
                    <div className="relative w-full h-full">
                        <img
                            src={item.url}
                            alt="Intel"
                            className={`w-full h-full object-contain mx-auto`}
                            onError={(e) => {
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/svg%3E";
                                e.currentTarget.className = "w-1/3 h-1/3 object-contain mx-auto opacity-20 filter grayscale";
                            }}
                        />
                        {(hasVideo || item.type === 'video') && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/media:bg-black/10 transition-colors pointer-events-none">
                                <div className="w-12 h-12 bg-primary/90 rounded-full flex items-center justify-center shadow-[0_0_20px_var(--primary)] text-white translate-y-0 group-hover/media:-translate-y-1 transition-transform">
                                    <svg className={`w-6 h-6 ${!isAr ? 'translate-x-[2px]' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ENHANCED MULTI-MEDIA GRID (Handles 2-10+ items)
    const gridLimit = 5;
    const displayMedia = allMedia.slice(0, gridLimit);

    return (
        <div className="w-full relative overflow-hidden rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
            <div className={`grid gap-0.5 ${displayMedia.length >= 3 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {displayMedia.map((item, idx) => {
                    const isFeature = (displayMedia.length === 3 && idx === 0) || (displayMedia.length >= 5 && idx === 0);
                    return (
                        <div
                            key={idx}
                            className={`relative overflow-hidden bg-surface/40 group/mitem ${isFeature ? 'col-span-2 aspect-[16/9]' : 'aspect-square'}`}
                        >
                            {item.type === 'video' ? (
                                <video src={item.url} controls className="w-full h-full object-cover" />
                            ) : (
                                <img
                                    src={item.url}
                                    alt="Intelligence Asset"
                                    className="w-full h-full object-cover group-hover/mitem:scale-105 transition-transform duration-1000"
                                    onError={(e) => {
                                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/svg%3E";
                                        e.currentTarget.className = "w-1/3 h-1/3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain opacity-20 filter grayscale";
                                    }}
                                />
                            )}
                            {idx === gridLimit - 1 && allMedia.length > gridLimit && (
                                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                                    <span className="font-black text-2xl text-white">+{allMedia.length - gridLimit}</span>
                                    <span className="text-[8px] font-black text-primary tracking-widest uppercase mt-1">Files Pending</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {hasVideo && videos.length === 0 && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-lg z-20 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    SECURE STREAM ACTIVATED
                </div>
            )}
        </div>
    );
};

