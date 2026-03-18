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

    if (allMedia.length === 0 && hasVideo) {
        return (
            <div className={`w-full h-full relative overflow-hidden rounded-none border border-border-color bg-surfaceackground flex items-center justify-center ${aspect || ''}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.1)_0%,transparent_70%)] animate-pulse"></div>
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="w-16 h-16 border border-primary/40 rounded-none flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-none animate-ping"></div>
                    </div>
                    <div className="bg-red-600/80/90 text-foreground px-3 py-1 rounded-none text-[9px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-foreground rounded-none"></span>
                        SECURE STREAM ACTIVATED
                    </div>
                </div>
            </div>
        );
    }

    if (allMedia.length === 1 || singleMode) {
        const item = allMedia[0];
        if (!item) return null;
        return (
            <div className={`w-full h-full relative overflow-hidden rounded-none border border-border bg-surface ${aspect || ''} group/media`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.05)_0%,transparent_70%)]"></div>
                {item.type === 'video' ? (
                    <video 
                        src={item.url} 
                        controls 
                        className={`w-full h-full ${singleMode ? 'object-cover' : 'object-contain'} mx-auto relative z-10`} 
                    />
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={item.url}
                            alt="Intel Asset"
                            className={`w-full h-full ${singleMode ? 'object-cover' : 'object-contain'} mx-auto relative z-10`}
                            onError={(e) => {
                                // Double Layer Fallback: If Proxy Fails, Show Intel Icon
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    const icon = document.createElement('div');
                                    icon.className = "flex flex-col items-center gap-2 opacity-20 pointer-events-none";
                                    icon.innerHTML = `
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                        <span class="text-[8px] font-black uppercase tracking-[0.2em]">Asset Offline</span>
                                    `;
                                    parent.appendChild(icon);
                                }
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover/media:opacity-100 transition-opacity z-20">
                             <div className="w-10 h-10 rounded-none bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center">
                                 <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5-5-2.24 5-5zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ENHANCED MULTI-MEDIA GRID (Handles 2-10+ items)
    const gridLimit = 5;
    const displayMedia = allMedia.slice(0, gridLimit);

    return (
        <div className="w-full relative overflow-hidden rounded-none border border-border bg-surfaceackground shadow-2xl">
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
                                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='grey' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/svg%3E";
                                        e.currentTarget.className = "w-1/3 h-1/3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain opacity-20 filter grayscale";
                                    }}
                                />
                            )}
                            {idx === gridLimit - 1 && allMedia.length > gridLimit && (
                                <div className="absolute inset-0 bg-surface/80 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                                    <span className="font-black text-2xl text-foreground">+{allMedia.length - gridLimit}</span>
                                    <span className="text-[8px] font-black text-primary tracking-widest uppercase mt-1">Files Pending</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {hasVideo && videos.length === 0 && (
                <div className="absolute top-4 left-4 bg-red-600/80 text-foreground px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-lg z-20 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-foreground rounded-none"></span>
                    SECURE STREAM ACTIVATED
                </div>
            )}
        </div>
    );
};

