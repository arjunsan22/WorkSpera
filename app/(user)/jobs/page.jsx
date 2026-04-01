"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaTimes, FaWhatsapp, FaBookmark, FaRegBookmark, FaCopy, FaExternalLinkAlt, FaExclamationTriangle } from 'react-icons/fa';
import Link from "next/link";
import { FiArrowLeft, FiUserPlus, FiMenu, FiUser, FiMessageSquare, FiBookOpen, FiBriefcase, FiBell, FiLogOut, FiRefreshCw, FiX, FiSearch, FiZap } from "react-icons/fi";
import StoryFeed from "@/app/components/stories/StoryFeed";
import ReactionModal from "@/app/components/user/ReactionModal";
import NotificationModal from "@/app/components/user/NotificationModal";
import ReportModal from "@/app/components/user/ReportModal";

// Toast Component - Refined
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed top-6 right-6 z-[100]"
    >
      <div className={`px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center space-x-3 ${type === 'success'
        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
        : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
        }`}>
        <div className={`w-2 h-2 rounded-full animate-pulse ${type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        <span className="font-medium text-sm">{message}</span>
        <button onClick={onClose} className="hover:opacity-70 transition-opacity">
          <FaTimes size={12} />
        </button>
      </div>
    </motion.div>
  );
};

// Comments Modal Component - Modernized
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
  setReportData,
}) => {
  const [expandedComments, setExpandedComments] = useState(new Set());
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
          <div>
            <h3 className="text-lg font-bold text-white">Discussion</h3>
            <p className="text-xs text-slate-400">{post.commentCount} perspectives shared</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-6">
          {post.comments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                <FaComment className="text-2xl text-slate-600" />
              </div>
              <p className="text-slate-500 font-medium">No comments yet. Start the conversation!</p>
            </div>
          ) : (
            post.comments.map((comment) => {
              const replyValue = replyTexts[comment._id] || "";
              return (
                <div key={comment._id} className="flex gap-4 group">
                  <Link href={`/profile/${comment.user._id}`} className="shrink-0">
                    <img
                      src={comment.user.profileImage || '/default-avatar.png'}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-800"
                    />
                  </Link>
                  <div className="flex-1 space-y-3">
                    <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50 group-hover:border-slate-600 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <Link href={`/profile/${comment.user._id}`} className="font-bold text-sm text-slate-100 hover:text-indigo-400">
                          {comment.user.name}
                        </Link>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">{comment.text}</p>
                    </div>

                    {/* Replies Logic */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-2 ml-4">
                        <button
                          onClick={() => {
                            setExpandedComments(prev => {
                              const next = new Set(prev);
                              if (next.has(comment._id)) next.delete(comment._id);
                              else next.add(comment._id);
                              return next;
                            });
                          }}
                          className="text-[10px] font-black text-slate-500 hover:text-indigo-400 flex items-center gap-2 mb-2 transition-colors uppercase tracking-widest"
                        >
                          <div className="w-6 h-[1px] bg-slate-800" />
                          {expandedComments.has(comment._id) ? 'Hide replies' : `View ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                        </button>

                        {expandedComments.has(comment._id) && (
                          <div className="space-y-3 animate-fade-in mb-4">
                            {comment.replies.map((reply) => (
                              <div key={reply._id} className="flex gap-3 bg-slate-800/20 p-3 rounded-xl border border-slate-800/50 group/reply hover:border-slate-700/50 transition-all">
                                <img src={reply.user?.profileImage || '/default-avatar.png'} className="w-6 h-6 rounded-lg object-cover ring-1 ring-slate-800" alt="" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-200 group-hover/reply:text-indigo-300 transition-colors">{reply.user?.name}</span>
                                  </div>
                                  <p className="text-xs text-slate-400 mt-1">{reply.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reply Input */}
                    {session && (
                      <div className="flex items-center gap-2 ml-4">
                        <input
                          type="text"
                          value={replyValue}
                          onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment._id]: e.target.value }))}
                          placeholder="Write a reply..."
                          className="flex-1 bg-transparent border-b border-slate-800 text-xs py-1 focus:border-indigo-500 outline-none text-slate-300"
                          onKeyDown={(e) => e.key === "Enter" && replyValue.trim() && onAddReply(post._id, comment._id, replyValue)}
                        />
                        <button
                          onClick={() => replyValue.trim() && onAddReply(post._id, comment._id, replyValue)}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Input */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50 focus-within:border-indigo-500/50 transition-all">
            <img src={session?.user?.image || '/default-avatar.png'} className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-700" alt="" />
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your thoughts..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-200 placeholder-slate-500"
              onKeyPress={(e) => e.key === 'Enter' && onAddComment()}
            />
            <button
              onClick={onAddComment}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              Post
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function Jobs() {
  // Logic & State - Kept Exactly the same
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComments, setNewComments] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [toast, setToast] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [shareMenuPostId, setShareMenuPostId] = useState(null);
  const [hoveredReactionPostId, setHoveredReactionPostId] = useState(null);
  const [showReactionModal, setShowReactionModal] = useState(false);
  const [reactionModalLikes, setReactionModalLikes] = useState([]);
  const [reportData, setReportData] = useState(null);

  useEffect(() => { fetchPosts(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(searchQuery);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/user/notifications');
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications || []);
        const unread = data.notifications?.filter((n) => !n.read).length || 0;
        setUnreadCount(unread);
      } catch (err) { console.error('Failed to fetch notifications', err); }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (!session?.user?.id) { signOut({ callbackUrl: '/login' }); return; }
    try {
      await fetch('/api/user/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, isOnline: false }),
      });
    } catch (dbError) { console.error(dbError); } finally { await signOut({ callbackUrl: '/login' }); }
  };

  const fetchPosts = async (query = '') => {
    setLoading(true);
    try {
      const url = query ? `/api/user/jobs?q=${encodeURIComponent(query)}` : '/api/user/jobs';
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) setPosts(data.posts);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleLike = async (postId, reactionType = 'like') => {
    if (!session) { showToast('Please login to like posts', 'error'); return; }
    try {
      const response = await fetch(`/api/user/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, reactionType }),
      });
      if (response.ok) {
        const data = await response.json();
        const updatedPosts = posts.map(post => {
          if (post._id === postId) {
            const currentReaction = post.userReaction;
            let newIsLiked, newUserReaction, newLikeCount;
            if (currentReaction === reactionType) {
              newIsLiked = false; newUserReaction = null; newLikeCount = post.likeCount - 1;
            } else if (currentReaction) {
              newIsLiked = true; newUserReaction = reactionType; newLikeCount = post.likeCount;
            } else {
              newIsLiked = true; newUserReaction = reactionType; newLikeCount = post.likeCount + 1;
            }
            return { ...post, isLiked: newIsLiked, userReaction: newUserReaction, likeCount: data.likes ? data.likes.length : newLikeCount, likes: data.likes || post.likes };
          }
          return post;
        });
        setPosts(updatedPosts);
      }
    } catch (error) { showToast('Failed to like post', 'error'); }
  };

  const handleAddComment = async (postId) => {
    const commentText = newComments[postId];
    if (!commentText?.trim()) return;
    try {
      const response = await fetch(`/api/user/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, text: commentText }),
      });
      if (response.ok) {
        fetchPosts(searchQuery); // Refreshing for accuracy
        setNewComments(prev => ({ ...prev, [postId]: '' }));
        showToast('Comment added successfully!');
      }
    } catch (error) { showToast('Failed to add comment', 'error'); }
  };

  const handleAddReply = async (postId, commentId, text) => {
    const replyText = text || replyTexts[commentId];
    if (!replyText?.trim()) return;
    try {
      const response = await fetch(`/api/user/posts/${postId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, text: replyText, parentCommentId: commentId }),
      });
      if (response.ok) {
        const data = await response.json();
        let updatedPost = data.post;
        if (!updatedPost) {
          const postRes = await fetch(`/api/user/posts/${postId}`);
          const resData = await postRes.json();
          updatedPost = resData.post;
        }
        setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
        if (selectedPost?._id === postId) setSelectedPost(updatedPost);
        setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
        showToast('Reply added!');
      }
    } catch (error) { showToast('Failed to add reply', 'error'); }
  };

  const handleShare = (postId) => setShareMenuPostId(shareMenuPostId === postId ? null : postId);
  const handleCopyLink = (postId) => {
    const postUrl = `${window.location.origin}/feeds?post=${postId}`;
    navigator.clipboard.writeText(postUrl);
    showToast('Post link copied!');
    setShareMenuPostId(null);
  };
  const handleWhatsAppShare = (post) => {
    const postUrl = `${window.location.origin}/feeds?post=${post._id}`;
    const text = `Check this out on WorkSpera: ${postUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShareMenuPostId(null);
  };

  const handleSavePost = async (postId) => {
    if (!session) { showToast('Please login to save posts', 'error'); return; }
    try {
      const response = await fetch(`/api/user/posts/${postId}/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(post => post._id === postId ? { ...post, isSaved: data.isSaved } : post));
        showToast(data.isSaved ? 'Saved to collection' : 'Removed from collection');
      }
    } catch (error) { showToast('Failed to save post', 'error'); }
  };

  const handleVote = async (postId, optionId) => {
    if (!session) { showToast('Please login to vote', 'error'); return; }
    try {
      const response = await fetch(`/api/user/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(post => post._id === postId ? { ...post, poll: data.poll } : post));
        showToast('Vote registered');
      }
    } catch (error) { showToast('Error submitting vote', 'error'); }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-all border border-slate-700/30"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="p-2 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-all border border-slate-700/30"
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

      {/* Modern Sidebar - Desktop Nav Rail */}
      <aside className="hidden lg:flex w-[80px] flex-col items-center py-8 bg-slate-950 border-r border-slate-900 z-50">
        <div className="mb-12">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
            <img src="/favicon.ico" alt="WorkSpera" className="w-7 h-7 object-contain drop-shadow-md" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-8">
          {[
            { icon: <FiMessageSquare size={22} />, path: '/messages', label: 'Chat' },
            { icon: <FiUserPlus size={22} />, path: '/messages', label: 'Network' },
            { icon: <FiBookOpen size={22} />, path: '/feeds', label: 'Feed' },
            { icon: <FiBriefcase size={22} />, path: '/jobs', label: 'Jobs', active: true },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => router.push(item.path)}
              className={`group relative p-3 rounded-2xl transition-all ${item.active ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
            >
              {item.icon}
              <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </span>
              {item.active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />}
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-6 mt-auto">
          <button onClick={() => setShowNotifications(true)} className="relative p-3 text-slate-500 hover:text-indigo-400 transition-colors">
            <FiBell size={22} />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-4 ring-slate-950" />}
          </button>
          <button onClick={() => router.push('/profile')} className="p-0.5 rounded-xl border border-slate-800 hover:border-indigo-500 transition-colors">
            <img src={session?.user?.image || '/default-avatar.png'} className="w-9 h-9 rounded-[25px] object-cover" alt="" />
          </button>
          <button onClick={handleLogout} className="p-3 text-slate-600 hover:text-rose-400 transition-colors">
            <FiLogOut size={22} />
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar - Rail Style matching Feed page */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="lg:hidden fixed top-0 left-0 h-full w-20 flex flex-col items-center py-6 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-[70] shadow-2xl"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
          <img src="/favicon.ico" alt="WorkSpera" className="w-7 h-7 object-contain drop-shadow-md" />
        </div>

        <div className="flex flex-col gap-3 flex-1 mt-10">
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
            onClick={() => { router.push('/feeds'); setSidebarOpen(false); }}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105"
          >
            <FiBookOpen className="w-6 h-6" />
          </button>

          <button
            className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105"
          >
            <FiBriefcase className="w-6 h-6" />
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
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="p-3.5 rounded-2xl text-rose-500/80 hover:bg-rose-500/10 hover:text-rose-400 transition-all transform hover:scale-105"
          >
            <FiLogOut className="w-6 h-6" />
          </button>
        </div>
      </motion.div>

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        {/* Top Header Blur Effect */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

        <AnimatePresence>
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </AnimatePresence>

        {selectedPost && (
          <CommentsModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onAddComment={() => handleAddComment(selectedPost._id)}
            newComment={newComments[selectedPost._id] || ''}
            setNewComment={(v) => setNewComments(prev => ({ ...prev, [selectedPost._id]: v }))}
            session={session}
            onAddReply={handleAddReply}
            replyTexts={replyTexts}
            setReplyTexts={setReplyTexts}
            setReportData={setReportData}
          />
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar pt-12 mt-16 md:mt-0 pb-24 px-4 md:px-8">
          <div className="max-w-2xl mx-auto">

            {/* AI Search Header Section */}
            <header className="mb-12 relative">
              <div className="mb-8">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
                  Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 italic">Edge.</span>
                </h1>
                <p className="text-slate-400 font-medium">Browse AI-curated opportunities & service requests.</p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[24px] blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                <form onSubmit={handleSearch} className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-[20px] p-1.5 shadow-2xl">
                  <div className="pl-4 flex items-center text-indigo-400">
                    <FiSearch size={20} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="𝐴𝑠𝑘 𝐴𝐼 𝑡𝑜 𝑓𝑖𝑛𝑑 𝑦𝑜𝑢𝑟 𝑝𝑒𝑟𝑓𝑒𝑐𝑡 𝑗𝑜𝑏 𝑜𝑟 𝑠𝑘𝑖𝑙𝑙𝑠'..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 px-4 py-3 font-medium"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 md:px-6 rounded-[14px] font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center min-w-[48px]"
                  >
                    <span className="hidden sm:inline">Explore</span>
                    <FiSearch className="sm:hidden text-lg" />
                  </button>
                </form>
              </div>
            </header>

            {/* Feed Section */}
            <div className="space-y-8">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 animate-pulse">
                    <div className="flex gap-4 mb-4">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-800 rounded w-1/3" />
                        <div className="h-3 bg-slate-800 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-48 bg-slate-800 rounded-2xl w-full" />
                  </div>
                ))
              ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/20 rounded-[32px] border border-dashed border-slate-800">
                  <p className="text-slate-500 font-medium">No results found for your search.</p>
                </div>
              ) : (
                posts.map((post, index) => (
                  <motion.article
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 rounded-[32px] overflow-hidden hover:border-slate-700/80 transition-all duration-300 shadow-xl"
                  >
                    {/* Header */}
                    <div className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Link href={`/profile/${post.user._id}`} className="relative">
                          <img
                            src={post.user.profileImage || '/default-avatar.png'}
                            className="w-12 h-12 rounded-[28px] object-cover ring-2 ring-slate-800"
                            alt=""
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-slate-900 shadow-sm" />
                        </Link>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/profile/${post.user._id}`} className="font-bold text-white hover:text-indigo-400 transition-colors">
                              {post.user.name}
                            </Link>
                          </div>
                          <p className="text-xs text-slate-500 font-bold tracking-tight">
                            @{post.user.username} • {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(post.type === 'job' || post.isServiceRequest === true) && (
                          <button
                            onClick={async () => {
                              const res = await fetch(`/api/user/posts/${post._id}/connect`, { method: "POST" });
                              res.ok ? showToast("Request Sent") : showToast("Already requested", "error");
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-tight transition-all active:scale-95 border border-indigo-500/20"
                          >
                            <FiUserPlus size={14} /> <span className="hidden sm:inline">Connect</span>
                          </button>
                        )}
                        <button
                          onClick={() => setReportData({ type: "Post", id: post._id })}
                          className="p-2.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <FaExclamationTriangle size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-2">
                      {post.caption && <p className="text-slate-300 text-[15px] leading-relaxed mb-5 whitespace-pre-wrap">{post.caption}</p>}

                      {/* Media Grid */}
                      {post.image?.length > 0 && (
                        <div className={`grid gap-2 rounded-2xl overflow-hidden border border-slate-800/50 ${post.image.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {post.image.map((img, i) => (
                            <img key={i} src={img} className="w-full h-72 object-cover hover:scale-105 transition-transform duration-700" alt="" />
                          ))}
                        </div>
                      )}

                      {/* Poll UI */}
                      {post.poll?.options?.length > 0 && (
                        <div className="mt-4 p-6 bg-slate-800/30 rounded-3xl border border-slate-700/30">
                          {post.poll.question && <h4 className="font-bold text-white mb-4">{post.poll.question}</h4>}
                          <div className="space-y-3">
                            {post.poll.options.map((opt) => (
                              <button
                                key={opt._id}
                                disabled={!!post.poll.userVotedOptionId}
                                onClick={() => handleVote(post._id, opt._id)}
                                className="relative w-full text-left p-3.5 rounded-2xl border border-slate-700/50 hover:bg-slate-700/30 transition-all group overflow-hidden"
                              >
                                {post.poll.userVotedOptionId && (
                                  <div
                                    className={`absolute inset-0 opacity-20 transition-all duration-1000 ${post.poll.userVotedOptionId === opt._id ? 'bg-indigo-500' : 'bg-slate-500'}`}
                                    style={{ width: `${opt.percentage}%` }}
                                  />
                                )}
                                <div className="relative flex justify-between items-center z-10">
                                  <span className={`text-sm font-bold ${post.poll.userVotedOptionId === opt._id ? 'text-indigo-400' : 'text-slate-300'}`}>{opt.text}</span>
                                  {post.poll.userVotedOptionId && <span className="text-xs font-black text-slate-500">{opt.percentage}%</span>}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stats & Actions */}
                    <div className="px-6 py-4 mt-2">
                      {/* LinkedIn style reaction counts */}
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                        <div
                          className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-400"
                          onClick={() => { setReactionModalLikes(post.likes || []); setShowReactionModal(true); }}
                        >
                          <div className="flex -space-x-1.5">
                            {['👍', '❤️', '👏'].map((e, i) => <span key={i} className="w-5 h-5 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-[10px]">{e}</span>)}
                          </div>
                          <span>{post.likeCount} Reactions</span>
                        </div>
                        <div onClick={() => setSelectedPost(post)} className="cursor-pointer hover:text-indigo-400">
                          {post.commentCount} Comments
                        </div>
                      </div>

                      {/* Main Action Bar */}
                      <div className="flex items-center gap-1 border-t border-slate-800/50 pt-2">
                        <div
                          className="relative flex-1"
                          onMouseEnter={() => setHoveredReactionPostId(post._id)}
                          onMouseLeave={() => setHoveredReactionPostId(null)}
                        >
                          {/* Reaction Picker Popup */}
                          <AnimatePresence>
                            {hoveredReactionPostId === post._id && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute bottom-full left-0 mb-4 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 p-2 rounded-2xl shadow-2xl flex gap-1 z-[50]"
                              >
                                {[
                                  { t: 'like', e: '👍' }, { t: 'love', e: '❤️' }, { t: 'celebrate', e: '👏' },
                                  { t: 'insightful', e: '💡' }, { t: 'support', e: '🤝' }
                                ].map((r) => (
                                  <button
                                    key={r.t}
                                    onClick={() => handleLike(post._id, r.t)}
                                    className="w-10 h-10 flex items-center justify-center text-xl hover:scale-150 hover:-translate-y-2 transition-all"
                                  >
                                    {r.e}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <button
                            onClick={() => handleLike(post._id, post.userReaction || 'like')}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${post.isLiked ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-500 hover:bg-slate-800/50'}`}
                          >
                            <span className="text-lg">{post.isLiked ? ({ like: '👍', love: '❤️', celebrate: '👏', insightful: '💡', support: '🤝' }[post.userReaction] || '👍') : <FaRegHeart />}</span>
                            <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">{post.isLiked ? post.userReaction : 'Like'}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => setSelectedPost(post)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-500 hover:bg-slate-800/50 rounded-xl transition-all"
                        >
                          <FaComment />
                          <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Discuss</span>
                        </button>

                        <button
                          onClick={() => handleSavePost(post._id)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${post.isSaved ? 'text-amber-500' : 'text-slate-500 hover:bg-slate-800/50'}`}
                        >
                          {post.isSaved ? <FaBookmark /> : <FaRegBookmark />}
                          <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Save</span>
                        </button>

                        <div className="relative flex-1">
                          <button
                            onClick={() => handleShare(post._id)}
                            className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 hover:bg-slate-800/50 rounded-xl transition-all"
                          >
                            <FaShare />
                            <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Share</span>
                          </button>

                          <AnimatePresence>
                            {shareMenuPostId === post._id && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="absolute bottom-full right-0 mb-4 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-1"
                              >
                                <button onClick={() => handleCopyLink(post._id)} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors">
                                  <FaCopy className="text-indigo-400" /> Copy Link
                                </button>
                                <button onClick={() => handleWhatsAppShare(post)} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors">
                                  <FaWhatsapp className="text-emerald-500" /> WhatsApp
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals - Kept Exactly the same */}
      <ReactionModal isOpen={showReactionModal} onClose={() => setShowReactionModal(false)} likes={reactionModalLikes} />
      <NotificationModal
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notifications={notifications}
        setNotifications={setNotifications}
        setUnreadCount={setUnreadCount}
      />
      <ReportModal isOpen={!!reportData} onClose={() => setReportData(null)} targetType={reportData?.type} targetId={reportData?.id} />
    </div>
  );
}