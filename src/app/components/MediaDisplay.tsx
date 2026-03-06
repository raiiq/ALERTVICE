"use client";

export const parseMedia = (val: string | null): string[] => {
    if (!val) return [];
    if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
        try {
            return JSON.parse(val);
        } catch {
            return [val];
        }
    }
    return [val];
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
                        <img src={item.url} alt="Intel" className={`w-full h-full object-contain mx-auto`} />
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

    return (
        <div className="w-full relative overflow-hidden rounded-lg border border-border bg-black shadow-2xl overflow-hidden">
            <div className="grid grid-cols-2 gap-0.5">
                {allMedia.slice(0, 4).map((item, idx) => (
                    <div
                        key={idx}
                        className={`relative overflow-hidden bg-surface/40 ${allMedia.length === 3 && idx === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}
                    >
                        {item.type === 'video' ? (
                            <video src={item.url} controls className="w-full h-full object-cover" />
                        ) : (
                            <img
                                src={item.url}
                                alt="Intel"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                            />
                        )}
                        {idx === 3 && allMedia.length > 4 && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-10 font-black text-2xl text-white">
                                +{allMedia.length - 4}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {hasVideo && videos.length === 0 && (
                <div className="absolute top-4 left-4 bg-primary text-black px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_var(--primary)] z-10">
                    SECURE VIDEO FEED
                </div>
            )}
        </div>
    );
};
