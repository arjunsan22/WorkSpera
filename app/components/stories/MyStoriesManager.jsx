"use client";
import { useState, useEffect } from "react";
import { FiTrash2, FiX, FiLoader, FiEye } from "react-icons/fi";
import Swal from "sweetalert2";

export default function MyStoriesManager({ onClose }) {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    const fetchMyStories = async () => {
        try {
            const res = await fetch("/api/stories/mine");
            if (res.ok) {
                const data = await res.json();
                setStories(data.stories);
            }
        } catch (error) {
            console.error("Failed to fetch my stories", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyStories();
    }, []);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Story?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            background: '#1e293b',
            color: '#f1f5f9',
            customClass: {
                popup: 'rounded-2xl border border-slate-700',
                confirmButton: 'rounded-xl px-6 py-2',
                cancelButton: 'rounded-xl px-6 py-2',
            }
        });

        if (!result.isConfirmed) return;

        setDeleting(id);
        try {
            const res = await fetch(`/api/stories/${id}`, { method: "DELETE" });
            if (res.ok) {
                setStories(prev => prev.filter(s => s._id !== id));
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Your story has been deleted.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#1e293b',
                    color: '#f1f5f9',
                    customClass: {
                        popup: 'rounded-2xl border border-slate-700',
                    }
                });
            } else {
                const data = await res.json();
                Swal.fire({
                    title: 'Error!',
                    text: data.error || 'Failed to delete story',
                    icon: 'error',
                    background: '#1e293b',
                    color: '#f1f5f9',
                    customClass: {
                        popup: 'rounded-2xl border border-slate-700',
                    }
                });
            }
        } catch (error) {
            console.error("Failed to delete story", error);
            Swal.fire({
                title: 'Error!',
                text: 'Network error. Please try again.',
                icon: 'error',
                background: '#1e293b',
                color: '#f1f5f9',
                customClass: {
                    popup: 'rounded-2xl border border-slate-700',
                }
            });
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
            <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[80vh]">

                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
                    <h3 className="text-xl font-bold text-white">My Active Stories</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-white">
                        <FiX />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex justify-center py-10"><FiLoader className="animate-spin text-white text-2xl" /></div>
                    ) : stories.length === 0 ? (
                        <div className="text-center text-slate-400 py-10">You have no active stories.</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {stories.map(story => (
                                <div key={story._id} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-black aspect-[9/16]">
                                    <img src={story.image} alt="Story" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />

                                    {/* Info Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-xs text-white mb-2">
                                            Expires: {new Date(story.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-xs text-slate-300 flex items-center gap-1">
                                            <FiEye /> {story.viewers?.length || 0} views
                                        </p>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDelete(story._id)}
                                        disabled={deleting === story._id}
                                        className={`absolute top-2 right-2 p-2 text-white rounded-full transition-colors shadow-md ${deleting === story._id
                                                ? 'bg-slate-600 cursor-not-allowed'
                                                : 'bg-red-600/80 hover:bg-red-600'
                                            }`}
                                        title="Delete Story"
                                    >
                                        {deleting === story._id ? (
                                            <FiLoader className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <FiTrash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
