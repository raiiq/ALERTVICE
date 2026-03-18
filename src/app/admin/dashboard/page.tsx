'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState<any>(null);
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

    const handleDelete = async (id: string, language: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const res = await fetch('/api/admin/news', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, language }),
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
                    id: editingPost.telegram_id,
                    language: editingPost.language,
                    updates: {
                        title: editingPost.title,
                        summary: editingPost.summary,
                        tag: editingPost.tag
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

    if (loading) return (
        <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
            <div className="text-white text-xl animate-pulse tracking-widest">LOADING INTEL...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#05070a] text-white p-4 md:p-8">
            <header className="max-w-7xl mx-auto flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white">COMMAND CENTER</h1>
                    <p className="text-blue-500 text-xs font-bold tracking-[0.3em] uppercase mt-2">News Management System</p>
                </div>
                <button 
                    onClick={() => router.push('/')}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2 rounded-full text-sm font-medium transition-all"
                >
                    Live Site
                </button>
            </header>

            <main className="max-w-7xl mx-auto">
                <div className="bg-[#0a0c11] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold border-b border-white/10">
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Language</th>
                                    <th className="px-6 py-4">Tag</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {posts.map((post) => (
                                    <tr key={`${post.telegram_id}-${post.language}`} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5 text-gray-500 text-xs font-mono">{post.telegram_id}</td>
                                        <td className="px-6 py-5">
                                            <div className="max-w-md truncate font-medium group-hover:text-blue-400 transition-colors">
                                                {post.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${post.language === 'ar' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {post.language}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 capitalize text-xs text-gray-400">{post.tag}</td>
                                        <td className="px-6 py-5 text-right space-x-2">
                                            <button 
                                                onClick={() => setEditingPost(post)}
                                                className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                            >
                                                EDIT
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(post.telegram_id, post.language)}
                                                className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                            >
                                                DELETE
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingPost && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0f1218] border border-white/10 p-8 rounded-3xl w-full max-w-2xl shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold mb-6">Edit Intelligence Post</h2>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Title</label>
                                    <textarea 
                                        value={editingPost.title}
                                        onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50"
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Summary</label>
                                    <textarea 
                                        value={editingPost.summary || ''}
                                        onChange={(e) => setEditingPost({...editingPost, summary: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50"
                                        rows={4}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tag</label>
                                        <select 
                                            value={editingPost.tag || 'world'}
                                            onChange={(e) => setEditingPost({...editingPost, tag: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none"
                                        >
                                            <option value="politics">Politics</option>
                                            <option value="tech">Tech</option>
                                            <option value="market">Market</option>
                                            <option value="world">World</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Language</label>
                                        <input type="text" disabled value={editingPost.language} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-500 cursor-not-allowed uppercase" />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-4 mt-8">
                                    <button 
                                        type="button" 
                                        onClick={() => setEditingPost(null)}
                                        className="px-6 py-3 rounded-xl hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="bg-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                                    >
                                        Save Changes
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
