'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiGrid, FiImage, FiHeart, FiMessageCircle, FiCalendar, FiUserPlus, FiCheck } from 'react-icons/fi';
import Link from 'next/link';

export default function UserProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();

    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [commentModalOpen, setCommentModalOpen] = useState(false);

    // Redirect if viewing own profile
    useEffect(() => {
        if (session?.user?.id === id) {
            router.push('/profile');
        }
    }, [session, id, router]);

    useEffect(() => {
        if (id) {
            fetchProfileData();
            checkFollowStatus();
        }
    }, [id, session]);

    const fetchProfileData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/user/profile/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch profile data');
            }
            const data = await response.json();
            setUser(data.user);
            setPosts(data.posts);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkFollowStatus = async () => {
        if (!session?.user?.id) return;
        // We can check if the current user is in the target user's followers list
        // OR we can fetch the current user's following list.
        // Let's assume we can check via the profile data or a seprate call.
        // Simpler: The user object fetched might have 'followers' array.
    };

    // We need to update isFollowing when user data is loaded
    useEffect(() => {
        if (user && session?.user?.id) {
            const isFollower = user.followers?.includes(session.user.id);
            setIsFollowing(isFollower);
        }
    }, [user, session]);


    const handleFollow = async () => {
        if (!session) {
            alert("Please login to follow");
            return;
        }

        // Optimistic update
        setIsFollowing(!isFollowing);

        try {
            const res = await fetch('/api/user/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: id }),
            });

            if (!res.ok) {
                setIsFollowing(!isFollowing); // Revert
                const data = await res.json();
                alert(data.message || 'Action failed');
            } else {
                // Update user followers count locally
                setUser(prev => ({
                    ...prev,
                    followers: isFollowing
                        ? prev.followers.filter(uid => uid !== session.user.id)
                        : [...(prev.followers || []), session.user.id]
                }));
            }
        } catch (err) {
            setIsFollowing(!isFollowing); // Revert
            console.error(err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
                    </div>
                    <p className="text-slate-300 font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="text-center">
                    <p className="text-slate-300 text-lg">User not found.</p>
                    <Link href="/" className="text-indigo-400 hover:text-indigo-300 mt-4 inline-block">Back to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
                {/* 🔹 Back Navigation */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 
                   transition-colors font-medium mb-4"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    Back to Feed
                </Link>

                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative overflow-hidden bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 rounded-3xl shadow-2xl p-6 md:p-10 mb-8"
                >
                    {/* Background Decorative Gradient */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">

                        {/* --- AVATAR SECTION --- */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="relative flex-shrink-0"
                        >
                            <div className="p-1 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-900 overflow-hidden bg-slate-800">
                                    <img
                                        src={user.profileImage || '/public/profile-default-image.png'}
                                        alt={user.name}
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* --- INFO SECTION --- */}
                        <div className="flex-1 flex flex-col items-center md:items-start w-full">

                            {/* Top Row: Username & Primary Actions */}
                            <div className="flex flex-col md:flex-row items-center gap-4 mb-6 w-full">
                                <h2 className="text-2xl md:text-3xl font-light text-white tracking-tight">
                                    @{user.username}
                                </h2>

                                <button
                                    onClick={handleFollow}
                                    className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-95 flex items-center gap-2
                    ${isFollowing
                                            ? 'bg-slate-700 text-white hover:bg-slate-600'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'
                                        }`}
                                >
                                    {isFollowing ? (
                                        <>
                                            <FiCheck className="w-4 h-4" />
                                            Following
                                        </>
                                    ) : (
                                        <>
                                            <FiUserPlus className="w-4 h-4" />
                                            Follow
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Middle Row: Stats */}
                            <div className="flex items-center justify-around md:justify-start gap-8 md:gap-10 mb-6 w-full md:w-auto py-4 md:py-0 border-y border-slate-800/50 md:border-none">
                                <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                                    <span className="text-lg font-bold text-white">{posts.length}</span>
                                    <span className="text-slate-400 text-sm md:text-base">posts</span>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                                    <span className="text-lg font-bold text-white">
                                        {user.followers?.length || 0}
                                    </span>
                                    <span className="text-slate-400 text-sm md:text-base">followers</span>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                                    <span className="text-lg font-bold text-white">
                                        {user.following?.length || 0}
                                    </span>
                                    <span className="text-slate-400 text-sm md:text-base">following</span>
                                </div>
                            </div>

                            {/* Bottom Row: Name & Bio */}
                            <div className="text-center md:text-left mb-8">
                                <h1 className="text-lg font-bold text-white mb-1">{user.name}</h1>
                                <p className="text-slate-300 leading-relaxed max-w-lg whitespace-pre-wrap">
                                    {user.bio || 'No bio yet.'}
                                </p>
                            </div>

                        </div>
                    </div>
                </motion.div>

                {/* Posts Grid Header */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 mb-4 px-2"
                >
                    <FiGrid className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-xl font-bold text-white">Posts</h2>
                </motion.div>

                {/* Posts Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    <AnimatePresence>
                        {posts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="col-span-full flex flex-col items-center justify-center py-16 px-6 bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl"
                            >
                                <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mb-4">
                                    <FiImage className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-200 mb-2">No posts yet</h3>
                            </motion.div>
                        ) : (
                            posts.map((post, index) => (
                                <motion.div
                                    key={post._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-500/10"
                                >
                                    {post.image && post.image.length > 0 && (
                                        <div className="relative aspect-square overflow-hidden bg-slate-900">
                                            <img
                                                src={post.image[0]}
                                                alt={`Post ${index + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {post.image.length > 1 && (
                                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                                                    +{post.image.length - 1}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="p-4">
                                        <p className="text-slate-200 text-sm mb-3 line-clamp-2">{post.caption}</p>

                                        <div className="flex items-center justify-between text-slate-400 text-sm">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <FiHeart className="w-4 h-4" />
                                                    {post.likes?.length || 0}
                                                </span>
                                                <span
                                                    className="flex items-center gap-1"
                                                >
                                                    <FiMessageCircle className="w-4 h-4" />
                                                    {post.comments?.length || 0}
                                                </span>
                                            </div>
                                            <span className="flex items-center gap-1 text-xs">
                                                <FiCalendar className="w-3 h-3" />
                                                {new Date(post.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
