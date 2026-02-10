"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaTimes, FaWhatsapp } from 'react-icons/fa';
import Link from "next/link";
import { FiArrowLeft, FiUserPlus, FiMenu, FiUser, FiMessageSquare, FiBookOpen, FiBell, FiLogOut, FiRefreshCw, FiX } from "react-icons/fi";
import StoryFeed from "@/app/components/stories/StoryFeed";
// Toast Component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`px-6 py-4 rounded-lg shadow-2xl backdrop-blur-lg border ${type === 'success'
        ? 'bg-green-500/90 border-green-400/50'
        : 'bg-red-500/90 border-red-400/50'
        }`}>
        <div className="flex items-center space-x-3">
          <span className="text-white font-medium">{message}</span>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <FaTimes />
          </button>
        </div>
      </div>
    </div>
  );
};

// Comments Modal Component
const CommentsModal = ({
  post,
  onClose,
  onAddComment,
  newComment,
  setNewComment,
  session,
  onAddReply,
  replyTexts,
  setReplyTexts,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-800 animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-black/50 backdrop-blur-lg border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Comments ({post.commentCount})</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Comments List */}
        <div className="overflow-y-auto max-h-[calc(80vh-200px)] px-6 py-4">
          {post.comments.length === 0 ? (
            <div className="text-center py-12">
              <FaComment className="text-5xl text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {post.comments.map((comment) => {
                const replyValue = replyTexts[comment._id] || "";
                return (
                  <div key={comment._id} className="space-y-2 animate-fade-in">
                    <div className="flex space-x-3 group">
                      <img
                        src={comment.user.profileImage || '/default-avatar.png'}
                        alt={comment.user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-800 group-hover:ring-blue-500 transition-all"
                      />
                      <div className="flex-1">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700 group-hover:border-gray-600 transition-all">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-white text-sm">
                              {comment.user.name}
                            </p>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">{comment.text}</p>
                          {/* Reply input */}
                          {session && (
                            <div className="mt-3 flex items-center space-x-2">
                              <input
                                type="text"
                                value={replyValue}
                                onChange={(e) =>
                                  setReplyTexts((prev) => ({
                                    ...prev,
                                    [comment._id]: e.target.value,
                                  }))
                                }
                                placeholder="Reply..."
                                className="flex-1 px-3 py-2 text-xs bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && replyValue.trim()) {
                                    onAddReply(post._id, comment._id, replyValue)
                                  }
                                }}
                              />
                              <button
                                onClick={() =>
                                  replyValue.trim() && onAddReply(post._id, comment._id, replyValue) // ✅
                                }
                                className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                              >
                                Reply
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-2 pl-10 space-y-2">
                            {comment.replies.map((reply) => (
                              <div
                                key={reply._id}
                                className="flex space-x-2 text-sm"
                              >
                                <img
                                  src={reply.user?.profileImage || '/default-avatar.png'}
                                  alt={reply.user?.name || "User"}
                                  className="w-7 h-7 rounded-full object-cover ring-2 ring-gray-800"
                                />
                                <div className="flex-1 bg-gray-900/70 rounded-2xl px-3 py-2 border border-gray-800">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs font-semibold text-white">
                                      {reply.user?.name || "User"}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                      {reply.createdAt
                                        ? new Date(reply.createdAt).toLocaleDateString()
                                        : ""}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-300">{reply.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Comment */}
        <div className="sticky bottom-0 bg-black/50 backdrop-blur-lg border-t border-gray-800 px-6 py-4">
          <div className="flex space-x-3">
            <img
              src={session?.user?.image || '/default-avatar.png'}
              alt="You"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-800"
            />
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-3 text-sm bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onAddComment();
                }
              }}
            />
            <button
              onClick={onAddComment}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all font-medium text-sm shadow-lg hover:shadow-blue-500/50 hover:scale-105 transform"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Feeds() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComments, setNewComments] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [toast, setToast] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/user/notifications');

        if (!res.ok) {
          console.error('Failed to fetch notifications, status:', res.status);
          return;
        }

        const data = await res.json();
        setNotifications(data.notifications || []);
        const unread = data.notifications?.filter((n) => !n.read).length || 0;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (!session?.user?.id) {
      console.error('No user ID found in session for logout update.');
      signOut({ callbackUrl: '/login' });
      return;
    }

    const userId = session.user.id;
    try {
      const updateResponse = await fetch('/api/user/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isOnline: false }),
      });

      if (!updateResponse.ok) {
        console.error('Failed to update user status on logout:', updateResponse.statusText);
      } else {
        console.log(`Client Logout: Updated user ${userId} to offline in DB.`);
      }
    } catch (dbError) {
      console.error('Error calling update-status API on logout:', dbError);
    } finally {
      await signOut({ callbackUrl: '/login' });
      console.log('Client Logout: NextAuth signOut called.');
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/user/posts');
      const data = await response.json();
      if (response.ok) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleLike = async (postId) => {
    if (!session) {
      showToast('Please login to like posts', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/user/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (response.ok) {
        const updatedPosts = posts.map(post => {
          if (post._id === postId) {
            const isLiked = post.likes.includes(session.user.id);
            return {
              ...post,
              likes: isLiked
                ? post.likes.filter(id => id.toString() !== session.user.id)
                : [...post.likes, session.user.id],
              isLiked: !isLiked,
              likeCount: isLiked ? post.likeCount - 1 : post.likeCount + 1
            };
          }
          return post;
        });
        setPosts(updatedPosts);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      showToast('Failed to like post', 'error');
    }
  };

  const handleAddComment = async (postId) => {
    const commentText = newComments[postId];
    if (!commentText?.trim()) return;

    try {
      const response = await fetch(`/api/user/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          text: commentText
        }),
      });

      if (response.ok) {
        const updatedPosts = posts.map(post => {
          if (post._id === postId) {
            const newComment = {
              _id: Date.now().toString(),
              user: {
                _id: session.user.id,
                name: session.user.name,
                username: session.user.username,
                profileImage: session.user.image
              },
              text: commentText,
              createdAt: new Date().toISOString()
            };
            return {
              ...post,
              comments: [...post.comments, newComment],
              commentCount: post.commentCount + 1
            };
          }
          return post;
        });
        setPosts(updatedPosts);
        setNewComments(prev => ({ ...prev, [postId]: '' }));
        showToast('Comment added successfully!');

        // Update selected post if modal is open
        if (selectedPost?._id === postId) {
          const updatedPost = updatedPosts.find(p => p._id === postId);
          setSelectedPost(updatedPost);
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('Failed to add comment', 'error');
    }
  };

  const handleAddReply = async (postId, commentId, text) => {
    const replyText = text || replyTexts[commentId];
    if (!replyText?.trim()) return;

    try {
      const response = await fetch(`/api/user/posts/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          text: replyText,
          parentCommentId: commentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let updatedPost = data.post;

        // Fallback: If API didn't return the post, refetch it
        if (!updatedPost) {
          const postRes = await fetch(`/api/user/posts/${postId}`);
          const resData = await postRes.json();
          updatedPost = resData.post;
        }

        // Update global feed
        setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));

        // Update modal if open
        if (selectedPost?._id === postId) {
          setSelectedPost(updatedPost);
        }

        // Clear input
        setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
        showToast('Reply added!');
      } else {
        throw new Error('Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      showToast('Failed to add reply', 'error');
    }
  };

  const handleShare = (postId) => {
    navigator.clipboard.writeText(`${window.location.origin}/feeds/${postId}`);
    showToast('Post link copied to clipboard!');
  };

  // No early return for loading, we handle it inside the layout

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 overflow-hidden">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-all"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <FaWhatsapp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              WorkSpera
            </span>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="p-2 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-all"
          >
            <FiUser className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex w-20 flex-col items-center py-6 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
          <FaWhatsapp className="w-7 h-7 text-white" />
        </div>

        <div className="flex flex-col gap-3 flex-1">
          <button
            onClick={() => router.push('/messages')}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105"
          >
            <FiMessageSquare className="w-6 h-6" />
          </button>

          <button
            onClick={() => router.push('/messages')}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105"
          >
            <FiUserPlus className="w-6 h-6" />
          </button>

          <button
            className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105"
          >
            <FiBookOpen className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/profile')}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105"
          >
            <FiUser className="w-6 h-6" />
          </button>

          <button
            onClick={() => setShowNotifications(true)}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105 relative"
          >
            <FiBell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="p-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all transform hover:scale-105"
          >
            <FiLogOut className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="lg:hidden fixed top-0 left-0 h-full w-20 flex flex-col items-center py-6 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50 z-50"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
          <FaWhatsapp className="w-7 h-7 text-white" />
        </div>

        <div className="flex flex-col gap-3 flex-1 mt-20 lg:mt-0">
          <button
            onClick={() => { router.push('/messages'); setSidebarOpen(false); }}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105"
          >
            <FiMessageSquare className="w-6 h-6" />
          </button>

          <button
            onClick={() => { router.push('/messages'); setSidebarOpen(false); }}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105"
          >
            <FiUserPlus className="w-6 h-6" />
          </button>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105"
          >
            <FiBookOpen className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { router.push('/profile'); setSidebarOpen(false); }}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105"
          >
            <FiUser className="w-6 h-6" />
          </button>

          <button
            onClick={() => { setShowNotifications(true); setSidebarOpen(false); }}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105 relative"
          >
            <FiBell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="p-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all transform hover:scale-105"
          >
            <FiLogOut className="w-6 h-6" />
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {selectedPost && (
          <CommentsModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onAddComment={() => handleAddComment(selectedPost._id)}
            newComment={newComments[selectedPost._id] || ''}
            setNewComment={(value) => setNewComments(prev => ({
              ...prev,
              [selectedPost._id]: value
            }))}
            session={session}
            onAddReply={handleAddReply}
            replyTexts={replyTexts}
            setReplyTexts={setReplyTexts}
          />
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-4 mt-16 lg:mt-0">
          <div className="max-w-2xl mx-auto pb-20 lg:pb-0">
            <div className="mb-8 animate-fade-in">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent mb-2">
                🇼​🇭​🇦​🇹​’🇸​ 🇳​🇪​🇼​ 🇹​🇴​🇩​🇦​🇾​?              </h1>
              <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>

            {/* Stories Feed */}
            <StoryFeed />

            {loading ? (
              <div className="space-y-6 mt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-800 animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gray-800 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-800 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-800 rounded w-1/6"></div>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="h-4 bg-gray-800 rounded"></div>
                      <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                    </div>
                    <div className="h-64 bg-gray-800 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 animate-fade-in">
                <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl p-12 border border-gray-800">
                  <p className="text-gray-400 text-lg">No posts yet. Be the first to share!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 mt-8 max-w-2xl mx-auto">
                {posts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800/60 overflow-hidden shadow-2xl"
                  >
                    {/* Post Header */}
                    <div className="p-4 md:p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative group cursor-pointer">
                          <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
                          <img
                            src={post.user.profileImage || '/default-avatar.png'}
                            alt={post.user.name}
                            className="relative w-11 h-11 rounded-full object-cover border-2 border-slate-900 shadow-lg"
                          />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 shadow-sm"></div>
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-bold text-white text-[15px] leading-tight hover:text-indigo-400 transition-colors cursor-pointer">
                            {post.user.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">@{post.user.username}</p>
                        </div>
                      </div>

                      {/* Connect Button Logic Kept Exactly Same */}
                      {(post.type === 'job' || post.isServiceRequest === true) && (
                        <button
                          onClick={async () => {
                            const res = await fetch(`/api/user/posts/${post._id}/connect`, {
                              method: "POST",
                            });
                            if (res.ok) {
                              showToast("Connection request sent!");
                            } else {
                              const data = await res.json();
                              showToast(data.error || "Failed to connect", "error");
                            }
                          }}
                          className="group flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-tight transition-all active:scale-95 shadow-lg shadow-indigo-500/20 cursor-pointer"
                        >
                          <FiUserPlus className="text-base" />
                          <span className="hidden sm:block">Connect for Work</span>
                        </button>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="px-4 md:px-5 pb-3">
                      {post.caption && (
                        <p className="text-slate-200 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap">
                          {post.caption}
                        </p>
                      )}

                      {/* Improved Image Grid */}
                      {post.image && post.image.length > 0 && (
                        <div className={`grid gap-1.5 rounded-2xl overflow-hidden border border-slate-800 ${post.image.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                          }`}>
                          {post.image.map((img, imgIdx) => (
                            <div
                              key={imgIdx}
                              className={`relative group/img overflow-hidden ${post.image.length === 3 && imgIdx === 0 ? 'row-span-2 h-full' : 'h-64'
                                }`}
                            >
                              <img
                                src={img}
                                alt={`Post content`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="px-4 py-3 border-t border-slate-800/50 bg-slate-800/20">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-6">
                          {/* Like Button */}
                          <button
                            onClick={() => handleLike(post._id)}
                            className={`group flex items-center gap-2 transition-all active:scale-125 ${post.isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                              }`}
                          >
                            {post.isLiked ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}
                            <span className="text-sm font-bold">{post.likeCount}</span>
                          </button>

                          {/* Comment Button */}
                          <button
                            onClick={() => setSelectedPost(post)}
                            className="group flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-all active:scale-125"
                          >
                            <FaComment className="text-xl" />
                            <span className="text-sm font-bold">{post.commentCount}</span>
                          </button>
                        </div>

                        {/* Share Button */}
                        <button
                          onClick={() => handleShare(post._id)}
                          className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-all active:scale-125"
                        >
                          <FaShare className="text-xl" />
                          <span className="hidden sm:inline text-sm font-bold">Share</span>
                        </button>
                      </div>

                      {/* Latest Comment Preview */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800/40">
                          <div className="flex items-start gap-2 group cursor-pointer" onClick={() => setSelectedPost(post)}>
                            <img
                              src={post.comments[post.comments.length - 1].user.profileImage || '/default-avatar.png'}
                              alt="Commenter"
                              className="w-5 h-5 rounded-full object-cover mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                                <span className="text-slate-200 font-bold mr-1">
                                  {post.comments[post.comments.length - 1].user.name}
                                </span>
                                {post.comments[post.comments.length - 1].text}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedPost(post)}
                            className="text-[11px] font-bold text-slate-500 hover:text-indigo-400 transition-colors mt-2 uppercase tracking-widest"
                          >
                            View all {post.commentCount} comments
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div >

      {/* Notification Modal */}
      < AnimatePresence >
        {showNotifications && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <FiBell className="w-5 h-5 text-indigo-400" />
                  Notifications
                </h2>
                <div className="flex gap-2">
                  {/* Mark all as read */}
                  <button
                    onClick={async () => {
                      try {
                        await fetch('/api/user/notifications/read', { method: 'POST' });
                        // Optimistically mark all as read
                        setNotifications(notifs =>
                          notifs.map(n => ({ ...n, read: true }))
                        );
                        setUnreadCount(0);
                      } catch (err) {
                        console.error('Failed to mark as read');
                      }
                    }}
                    className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-700/50 hover:text-slate-300"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <FiBell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif, idx) => (
                    <motion.div
                      key={notif._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`p-4 rounded-xl mb-2.5 transition-colors ${notif.read
                        ? 'bg-slate-900/30 hover:bg-slate-900/50'
                        : 'bg-indigo-900/20 border-l-4 border-indigo-500 hover:bg-indigo-900/30'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {notif.sender?.profileImage ? (
                          <img
                            src={notif.sender.profileImage}
                            alt={notif.sender.name}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                            {notif.sender?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200">
                            <span className="font-semibold">{notif.sender?.name || 'Someone'}</span>{' '}
                            {notif.type === 'follow' ? 'followed you' : '(connects) he wants to help with your work'}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/chat/${notif.sender._id}`);
                              setShowNotifications(false);
                            }}
                            className="mt-2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow shadow-indigo-500/20 cursor-pointer"
                          >
                            Message
                          </button>
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {notif.message || ''}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {new Date(notif.createdAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )
        }
      </AnimatePresence >

    </div >
  );
}