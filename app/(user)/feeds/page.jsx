"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaEllipsisH, FaTimes } from 'react-icons/fa';
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
// Toast Component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`px-6 py-4 rounded-lg shadow-2xl backdrop-blur-lg border ${
        type === 'success' 
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
const CommentsModal = ({ post, onClose, onAddComment, newComment, setNewComment, session }) => {
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
              {post.comments.map((comment) => (
                <div key={comment._id} className="flex space-x-3 group animate-fade-in">
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
                    </div>
                  </div>
                </div>
              ))}
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
  const [selectedPost, setSelectedPost] = useState(null);
  const [toast, setToast] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    fetchPosts();
  }, []);

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

  const handleShare = (postId) => {
    navigator.clipboard.writeText(`${window.location.origin}/feeds/${postId}`);
    showToast('Post link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <style jsx global>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>

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
        />
      )}
      {/* 🔹 Back Navigation */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 
                   transition-colors font-medium mb-4"
      >
        <FiArrowLeft className="w-5 h-5" />
        Back to Home
      </Link>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent mb-2">
            Feeds
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl p-12 border border-gray-800">
              <p className="text-gray-400 text-lg">No posts yet. Be the first to share!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <div
                key={post._id}
                className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl shadow-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-blue-500/10 animate-fade-in group overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Post Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={post.user.profileImage || '/default-avatar.png'}
                          alt={post.user.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-800 group-hover:ring-blue-500 transition-all"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{post.user.name}</h3>
                        <p className="text-sm text-gray-500">@{post.user.username}</p>
                      </div>
                    </div>
                    <button className="text-gray-600 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                      <FaEllipsisH />
                    </button>
                  </div>

                  {/* Post Content */}
                  {post.caption && (
                    <p className="text-gray-300 mb-4 text-lg leading-relaxed">{post.caption}</p>
                  )}

                  {/* Post Images */}
                  {post.image && post.image.length > 0 && (
                    <div className={`grid gap-2 ${post.image.length > 1 ? 'grid-cols-2' : ''}`}>
                      {post.image.map((img, index) => (
                        <div key={index} className="relative overflow-hidden rounded-xl group/img">
                          <img
                            src={img}
                            alt={`Post ${post._id} - ${index + 1}`}
                            className="w-full h-64 object-cover transition-transform duration-500 group-hover/img:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="px-6 py-4 border-t border-gray-800 bg-black/30">
                  <div className="flex items-center justify-around">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all hover:scale-110 transform ${
                        post.isLiked 
                          ? 'text-red-500 bg-red-500/10' 
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
                      }`}
                    >
                      {post.isLiked ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}
                      <span className="font-semibold">{post.likeCount}</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all hover:scale-110 transform"
                    >
                      <FaComment className="text-xl" />
                      <span className="font-semibold">{post.commentCount}</span>
                    </button>
                    
                    <button
                      onClick={() => handleShare(post._id)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-400 hover:text-green-500 hover:bg-green-500/10 transition-all hover:scale-110 transform"
                    >
                      <FaShare className="text-xl" />
                      <span className="font-semibold">Share</span>
                    </button>
                  </div>

                  {/* Quick Preview of Latest Comment */}
                  {post.comments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <div className="flex space-x-2">
                        <img
                          src={post.comments[post.comments.length - 1].user.profileImage || '/default-avatar.png'}
                          alt="Commenter"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <p className="text-sm text-gray-400 flex-1 truncate">
                          <span className="text-white font-semibold">
                            {post.comments[post.comments.length - 1].user.name}
                          </span>
                          {' '}{post.comments[post.comments.length - 1].text}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="text-xs text-blue-500 hover:text-blue-400 mt-2"
                      >
                        View all {post.commentCount} comments
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}