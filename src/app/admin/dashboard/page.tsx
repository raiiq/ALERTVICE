'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
    { id: 'world', en: 'WORLD', ar: 'عالمي' },
    { id: 'politics', en: 'POLITICS', ar: 'سياسة' },
    { id: 'market', en: 'MARKET', ar: 'سوق' },
    { id: 'tech', en: 'TECH', ar: 'تكنولوجيا' }
];

export default function AdminDashboard() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState<any>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'signals'>('all');
    const [newPost, setNewPost] = useState({
        title: '',
        summary: '',
        tag: 'world',
        language: 'en',
        image_url: [] as string[],
        video_url: [] as string[]
    });
    const router = useRouter();

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/admin/news');
            if (res.status === 401) {
                router.push('/admin/login');
                return;
            }
            const data = await res.json();
            setPosts(data.posts || []);
        } catch (err) {
            console.error('Failed to fetch posts', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            const res = await fetch('/api/admin/news', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (res.ok) fetchPosts();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/news', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingPost.id,
                    updates: {
                        title: editingPost.title,
                        summary: editingPost.summary,
                        tag: editingPost.tag,
                        image_url: editingPost.image_url,
                        video_url: editingPost.video_url
                    }
                }),
            });
            if (res.ok) {
                setEditingPost(null);
                fetchPosts();
            }
        } catch (err) {
            alert('Update failed');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPost),
            });
            if (res.ok) {
                setIsCreateModalOpen(false);
                setNewPost({ title: '', summary: '', tag: 'world', language: 'en', image_url: [], video_url: [] });
                fetchPosts();
            }
        } catch (err) {
            alert('Creation failed');
        }
    };

    const filteredPosts = posts.filter(post => {
        const hasMedia = (post.image_url && post.image_url.length > 0) || (post.video_url && post.video_url.length > 0) || post.has_video;
        if (activeTab === 'articles') return hasMedia;
        if (activeTab === 'signals') return !hasMedia;
        return true;
    });

    const addUrl = (type: 'image' | 'video', post: any, setPost: any) => {
        const url = prompt(`Enter ${type} URL:`);
        if (url) {
            const key = type === 'image' ? 'image_url' : 'video_url';
            setPost({ ...post, [key]: [...(post[key] || []), url] });
        }
    };

    const removeUrl = (type: 'image' | 'video', index: number, post: any, setPost: any) => {
        const key = type === 'image' ? 'image_url' : 'video_url';
        const newUrls = [...(post[key] || [])];
        newUrls.splice(index, 1);
        setPost({ ...post, [key]: newUrls });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
            <div className="text-foreground text-xl animate-pulse tracking-widest">INITIALIZING COMMAND...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#05070a] text-foreground flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border-color/50 bg-[#0a0c11] p-6 hidden lg:flex flex-col sticky top-0 h-screen">
                <div className="mb-12">
                    <h2 className="text-xl font-black tracking-tighter text-blue-500">ALERTVICE Admin</h2>
                </div>
                
                <nav className="space-y-2 flex-grow">
                    <button 
                        onClick={() => setActiveTab('all')}
                        className={`w-full text-left px-4 py-3 rounded-none text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-surfacelue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-foreground'}`}
                    >
                        DASHBOARD
                    </button>
                    <button 
                        onClick={() => setActiveTab('articles')}
                        className={`w-full text-left px-4 py-3 rounded-none text-sm font-bold transition-all ${activeTab === 'articles' ? 'bg-surfacelue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-foreground'}`}
                    >
                        MEDIA ARTICLES
                    </button>
                    <button 
                        onClick={() => setActiveTab('signals')}
                        className={`w-full text-left px-4 py-3 rounded-none text-sm font-bold transition-all ${activeTab === 'signals' ? 'bg-surfacelue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-foreground'}`}
                    >
                        TEXT SIGNALS
                    </button>
                    <button 
                        onClick={() => router.push('/admin/sql')}
                        className="w-full text-left px-4 py-3 rounded-none text-sm font-bold transition-all text-gray-500 hover:text-amber-400 hover:bg-surfacember-600/5 group flex items-center justify-between"
                    >
                        SQL CONSOLE
                        <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </button>
                </nav>

                <div className="mt-auto space-y-4">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full bg-surfacelue-600 hover:bg-surfacelue-500 text-foreground font-bold py-3 rounded-none transition-all shadow-lg shadow-blue-600/20"
                    >
                        + NEW INTEL
                    </button>
                    <button 
                        onClick={() => router.push('/')}
                        className="w-full bg-foreground/5 hover:bg-foreground/10 text-gray-400 font-bold py-3 rounded-none transition-all text-xs"
                    >
                        LIVE FEED
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
                <header className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase whitespace-nowrap text-foreground">
                             REAL-TIME DATASET CONTROL
                        </h1>
                    </div>
                    <div className="lg:hidden">
                        <button onClick={() => setIsCreateModalOpen(true)} className="bg-surfacelue-600 p-3 rounded-none shadow-xl">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>
                </header>

                <div className="bg-[#0a0c11] border border-border-color/50 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-foreground/5 text-[9px] uppercase tracking-[0.3em] text-gray-500 font-black border-b border-border-color">
                                    <th className="px-8 py-5">Source</th>
                                    <th className="px-8 py-5">Content Preview</th>
                                    <th className="px-8 py-5">Intel Type</th>
                                    <th className="px-8 py-5">Language</th>
                                    <th className="px-8 py-5 text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredPosts.map((post) => (
                                    <tr key={`${post.id}-${post.language}`} className="hover:bg-foreground/[0.01] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-mono text-gray-600">ID: {post.telegram_id?.substring(0, 10) || 'MANUAL'}...</span>
                                                <span className="text-[9px] text-blue-500/50 font-bold">{new Date(post.post_date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="max-w-md">
                                                <h3 className="font-bold text-gray-200 group-hover:text-foreground transition-colors truncate">{post.title}</h3>
                                                <p className="text-xs text-gray-500 mt-1 truncate opacity-60">{post.summary}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex gap-2">
                                                {((post.image_url?.length || 0) > 0) && (
                                                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20">IMG</span>
                                                )}
                                                {(post.has_video || (post.video_url?.length || 0) > 0) && (
                                                    <span className="bg-surfacember-500/10 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-500/20">VID</span>
                                                )}
                                                {(!post.has_video && (!post.image_url || post.image_url.length === 0)) && (
                                                    <span className="bg-surfacelue-500/10 text-blue-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-blue-500/20">TXT</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black text-gray-400 uppercase">{post.language}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => setEditingPost(post)} className="text-gray-500 hover:text-blue-400 transition-colors p-2 hover:bg-surfacelue-400/5 rounded-none">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(post.id)} className="text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/5 rounded-none">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <AnimatePresence>
                {(editingPost || isCreateModalOpen) && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#05070a]/95 backdrop-blur-md flex items-center justify-end z-50"
                        onClick={() => { setEditingPost(null); setIsCreateModalOpen(false); }}
                    >
                        <motion.div 
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-[#0a0c11] w-full max-w-2xl h-full border-l border-border-color/50 p-8 overflow-y-auto shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter uppercase">
                                        {isCreateModalOpen ? 'New Intel Post' : 'Edit Intelligence'}
                                    </h2>
                                    <p className="text-blue-500 text-[10px] font-bold tracking-widest mt-1">
                                        {isCreateModalOpen ? 'GENERATE NEW RECORD' : `REF: ${editingPost.telegram_id}`}
                                    </p>
                                </div>
                                <button onClick={() => { setEditingPost(null); setIsCreateModalOpen(false); }} className="p-3 hover:bg-foreground/5 rounded-none transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={isCreateModalOpen ? handleCreate : handleUpdate} className="space-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">Headline Header</label>
                                        <input 
                                            value={isCreateModalOpen ? newPost.title : editingPost.title}
                                            onChange={(e) => isCreateModalOpen ? setNewPost({...newPost, title: e.target.value}) : setEditingPost({...editingPost, title: e.target.value})}
                                            className="w-full bg-foreground/[0.02] border border-border-color/50 rounded-none p-5 text-xl font-bold focus:border-blue-500/50 outline-none transition-all"
                                            placeholder="Impactful headline..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">Full Summary Brief</label>
                                        <textarea 
                                            value={isCreateModalOpen ? newPost.summary : (editingPost.summary || '')}
                                            onChange={(e) => isCreateModalOpen ? setNewPost({...newPost, summary: e.target.value}) : setEditingPost({...editingPost, summary: e.target.value})}
                                            className="w-full bg-foreground/[0.02] border border-border-color/50 rounded-none p-5 text-gray-300 min-h-[150px] focus:border-blue-500/50 outline-none transition-all"
                                            placeholder="Detailed content breakdown..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">Category Tag</label>
                                            <select 
                                                value={isCreateModalOpen ? newPost.tag : (editingPost.tag || 'world')}
                                                onChange={(e) => isCreateModalOpen ? setNewPost({...newPost, tag: e.target.value}) : setEditingPost({...editingPost, tag: e.target.value})}
                                                className="w-full bg-foreground/[0.02] border border-border-color/50 rounded-none p-4 font-bold outline-none cursor-pointer"
                                            >
                                                {CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-[#0a0c11]">{c.en}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block">Language Port</label>
                                            <select 
                                                value={isCreateModalOpen ? newPost.language : editingPost.language}
                                                onChange={(e) => isCreateModalOpen ? setNewPost({...newPost, language: e.target.value}) : setEditingPost({...editingPost, language: e.target.value})}
                                                className="w-full bg-foreground/[0.02] border border-border-color/50 rounded-none p-4 font-bold outline-none cursor-pointer"
                                            >
                                                <option value="en" className="bg-[#0a0c11]">ENGLISH (EN)</option>
                                                <option value="ar" className="bg-[#0a0c11]">ARABIC (AR)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Media Management */}
                                    <div className="pt-6 border-t border-border-color/50">
                                        <div className="flex justify-between items-center mb-6">
                                           <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Multimedia Assets</label>
                                           <div className="flex gap-2">
                                                <button type="button" onClick={() => addUrl('image', isCreateModalOpen ? newPost : editingPost, isCreateModalOpen ? setNewPost : setEditingPost)} className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-none border border-emerald-500/20 hover:bg-emerald-500 hover:text-foreground transition-all">+ IMAGE</button>
                                                <button type="button" onClick={() => addUrl('video', isCreateModalOpen ? newPost : editingPost, isCreateModalOpen ? setNewPost : setEditingPost)} className="text-[9px] font-black bg-surfacember-500/10 text-amber-500 px-3 py-1.5 rounded-none border border-amber-500/20 hover:bg-surfacember-500 hover:text-foreground transition-all">+ VIDEO</button>
                                           </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Image Grid */}
                                            {(isCreateModalOpen ? newPost.image_url : editingPost.image_url)?.map((url: string, i: number) => (
                                                <div key={i} className="flex items-center gap-4 bg-foreground/[0.02] border border-border-color/50 p-3 rounded-none group">
                                                    <img src={url} className="w-12 h-12 rounded-none object-cover border border-border-color" alt="Preview" />
                                                    <span className="flex-1 text-[10px] text-gray-500 truncate font-mono">{url}</span>
                                                    <button type="button" onClick={() => removeUrl('image', i, isCreateModalOpen ? newPost : editingPost, isCreateModalOpen ? setNewPost : setEditingPost)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-none group-hover:opacity-100 transition-opacity">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                            {/* Video Grid */}
                                            {(isCreateModalOpen ? newPost.video_url : editingPost.video_url)?.map((url: string, i: number) => (
                                                <div key={i} className="flex items-center gap-4 bg-foreground/[0.02] border border-border-color/50 p-3 rounded-none group">
                                                    <div className="w-12 h-12 rounded-none bg-surfacember-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm10 1a1 1 0 00-1-1H5a1 1 0 000 2h6a1 1 0 001-1z" /></svg>
                                                    </div>
                                                    <span className="flex-1 text-[10px] text-gray-500 truncate font-mono">{url}</span>
                                                    <button type="button" onClick={() => removeUrl('video', i, isCreateModalOpen ? newPost : editingPost, isCreateModalOpen ? setNewPost : setEditingPost)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-none group-hover:opacity-100 transition-opacity">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 flex gap-4">
                                    <button 
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-400 text-foreground font-black py-5 rounded-none shadow-2xl shadow-blue-600/20 hover:scale-[1.02] transition-all"
                                    >
                                        {isCreateModalOpen ? 'DEPLOY INTEL RECORD' : 'COMMIT REVISIONS'}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => { setEditingPost(null); setIsCreateModalOpen(false); }}
                                        className="px-10 bg-foreground/5 hover:bg-foreground/10 text-gray-400 font-bold rounded-none transition-all"
                                    >
                                        DISCARD
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
