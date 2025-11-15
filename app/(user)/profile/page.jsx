// app/user/profile/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit3, FiImage,FiArrowLeft , FiUser, FiX, FiCamera, FiTrash2, FiPlus, FiLoader, FiHeart, FiMessageCircle, FiCalendar, FiGrid } from 'react-icons/fi';
import Link from 'next/link';
export default function ProfilePage() {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isEditPostsModalOpen, setIsEditPostsModalOpen] = useState(false);
  const [tempUser, setTempUser] = useState({});
  const [tempPost, setTempPost] = useState({ caption: '', images: [] }); // Store temporary image URLs or file objects
  const [selectedPostForEdit, setSelectedPostForEdit] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileData();
    }
  }, [session]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/profile/${session.user.id}`);
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

  const openEditProfileModal = () => {
    if (user) {
      setTempUser({ name: user.name, username: user.username, bio: user.bio, profileImage: user.profileImage });
      setIsEditProfileModalOpen(true);
    }
  };

  const openEditPostsModal = () => {
    setIsEditPostsModalOpen(true);
  };

  const closeEditProfileModal = () => {
    setIsEditProfileModalOpen(false);
    setTempUser({});
  };

  const closeEditPostsModal = () => {
    setIsEditPostsModalOpen(false);
    setTempPost({ caption: '', images: [] });
    setSelectedPostForEdit(null);
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await fetch(`/api/user/profile/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempUser),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      const updatedUser = await response.json();
      setUser(updatedUser);
      closeEditProfileModal();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAddPost = async () => {
  if (!tempPost.caption.trim() && tempPost.images.length === 0) {
    alert('Please add a caption or at least one image.');
    return;
  }

  setIsUploading(true);

  try {
    // First, upload images to get URLs
    const uploadedImageUrls = [];
    
    for (const img of tempPost.images) {
      if (img instanceof File) {
        const formData = new FormData();
        formData.append('image', img);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          uploadedImageUrls.push(result.url);
        } else {
          throw new Error('Image upload failed');
        }
      }
    }

    // Then create the post with the image URLs
    const postResponse = await fetch('/api/user/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caption: tempPost.caption,
        userId: session.user.id,
        images: uploadedImageUrls,
      }),
    });

    if (!postResponse.ok) {
      throw new Error('Failed to create post');
    }

    const result = await postResponse.json();
    setPosts(prev => [result.post, ...prev]);
    closeEditPostsModal();
  } catch (error) {
    console.error('Error adding post:', error);
  } finally {
    setIsUploading(false);
  }
};

  const handleUpdatePost = async (postId) => {
    if (!selectedPostForEdit.caption.trim() && selectedPostForEdit.images.length === 0) {
      alert('Please add a caption or at least one image.');
      return;
    }
    try {
      // For updates, you might need a different approach depending on whether you're replacing images
      // For simplicity, let's assume updates only modify text and don't change images
      const response = await fetch(`/api/user/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: selectedPostForEdit.caption,
          // images: selectedPostForEdit.images, // Only if you want to update images too
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update post');
      }
      const updatedPost = await response.json();
      setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
      closeEditPostsModal();
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/user/posts/${postId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      setPosts(prev => prev.filter(p => p._id !== postId));
      if (selectedPostForEdit && selectedPostForEdit._id === postId) {
        setSelectedPostForEdit(null);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const openEditPostForm = (post) => {
    setSelectedPostForEdit({ ...post, images: post.image || [] });
  };

  const handleInputChange = (e, field, isPost = false) => {
    const value = e.target.value;
    if (isPost) {
      setSelectedPostForEdit(prev => ({ ...prev, [field]: value }));
    } else {
      setTempUser(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCaptionChange = (e) => {
    setTempPost(prev => ({ ...prev, caption: e.target.value }));
  };

  const handleEditCaptionChange = (e) => {
    if (selectedPostForEdit) {
      setSelectedPostForEdit(prev => ({ ...prev, caption: e.target.value }));
    }
  };

  // ✅ NEW: Function to upload image and get URL
  const uploadImageAndGetUrl = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', { // You need to create this endpoint
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result.url; // e.g., '/uploads/filename.jpg'
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  // ✅ NEW: Function to handle file input and store in state as File objects
  const handleImageUpload = async (e, isPost = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // For posts, we store the File objects directly in state to be uploaded later
      if (isPost) {
        const newFiles = Array.from(files);
        setTempPost(prev => ({ ...prev, images: [...prev.images, ...newFiles] }));
      } else {
        // For profile image, we only allow one file
        const file = files[0];
        // Here you would typically upload immediately and update the profile image URL
        const url = await uploadImageAndGetUrl(file);
        if (url) {
          setTempUser(prev => ({ ...prev, profileImage: url }));
        }
      }
    } catch (error) {
      console.error('Error handling image upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index, isPost = false) => {
    if (isPost) {
      setTempPost(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    } else {
      setTempUser(prev => ({ ...prev, profileImage: '' }));
    }
  };

  const removeImageFromEdit = (index) => {
    if (selectedPostForEdit) {
      setSelectedPostForEdit(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    }
  };

  // ✅ NEW: Function to get image preview URL for File objects (for display in UI)
  const getPreviewUrl = (image) => {
    if (typeof image === 'string') {
      // It's already a URL string
      return image;
    } else if (image instanceof File) {
      // It's a File object, create a preview URL
      return URL.createObjectURL(image);
    }
    return null;
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
        Back to Home
      </Link>
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 md:p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full ring-4 ring-indigo-500/30 overflow-hidden">
                <img
                  src={user.profileImage || 'https://via.placeholder.com/128'}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={openEditProfileModal}
                className="absolute bottom-2 right-2 bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-500 transition-all shadow-lg opacity-0 group-hover:opacity-100"
              >
                <FiCamera className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                <button
                  onClick={openEditProfileModal}
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 rounded-xl transition-colors border border-slate-600/50 inline-flex items-center justify-center gap-2"
                >
                  <FiEdit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
              <p className="text-slate-400 mb-3">@{user.username}</p>
              <p className="text-slate-300 mb-4 max-w-2xl">{user.bio || 'No bio yet.'}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{posts.length}</p>
                  <p className="text-slate-400 text-sm">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{user.followers?.length || 0}</p>
                  <p className="text-slate-400 text-sm">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{user.following?.length || 0}</p>
                  <p className="text-slate-400 text-sm">Following</p>
                </div>
              </div>

              <button
                onClick={openEditPostsModal}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2 font-medium"
              >
                <FiPlus className="w-5 h-5" />
                Manage Posts
              </button>

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
                <p className="text-slate-400 text-center mb-6">Share your first moment with your followers</p>
                <button
                  onClick={openEditPostsModal}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2"
                >
                  <FiPlus className="w-5 h-5" />
                  Create Post
                </button>
              </motion.div>
            ) : (
              posts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
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
                        <span className="flex items-center gap-1">
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

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditProfileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeEditProfileModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                <button onClick={closeEditProfileModal} className="text-slate-400 hover:text-white transition-colors">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    {tempUser.profileImage ? (
                      <img
                        src={tempUser.profileImage}
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500/30"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-dashed border-slate-600 flex items-center justify-center">
                        <FiUser className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                    <label className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2">
                      <FiImage className="w-4 h-4" />
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {tempUser.profileImage && (
                    <button
                      type="button"
                      onClick={() => removeImage(0, false)}
                      className="mt-2 text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                    >
                      <FiTrash2 className="w-3 h-3" />
                      Remove Image
                    </button>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={tempUser.name || ''}
                    onChange={(e) => handleInputChange(e, 'name')}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={tempUser.username || ''}
                    onChange={(e) => handleInputChange(e, 'username')}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                  <textarea
                    value={tempUser.bio || ''}
                    onChange={(e) => handleInputChange(e, 'bio')}
                    rows="3"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeEditProfileModal}
                  className="px-5 py-2.5 text-slate-300 hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileUpdate}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Posts Modal */}
      <AnimatePresence>
        {isEditPostsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeEditPostsModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-800 pb-4 border-b border-slate-700/50">
                <h2 className="text-2xl font-bold text-white">Manage Posts</h2>
                <button onClick={closeEditPostsModal} className="text-slate-400 hover:text-white transition-colors">
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Add New Post Form */}
              <div className="mb-6 p-5 bg-slate-700/30 border border-slate-600/50 rounded-xl">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <FiPlus className="w-5 h-5 text-indigo-400" />
                  Add New Post
                </h3>
                <textarea
                  value={tempPost.caption}
                  onChange={handleCaptionChange}
                  placeholder="Write a caption..."
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none mb-3"
                />
                <div className="mb-3">
                  <label className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2">
                    <FiImage className="w-4 h-4" />
                    Add Images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>
                {tempPost.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tempPost.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={getPreviewUrl(img)} alt={`Preview ${idx}`} className="w-20 h-20 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx, true)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleAddPost}
                  disabled={isUploading}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg inline-flex items-center gap-2"
                >
                  {isUploading ? <FiLoader className="animate-spin w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                  Add Post
                </button>
              </div>

              {/* Edit Existing Post Form */}
              {selectedPostForEdit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-5 bg-indigo-900/20 border border-indigo-500/30 rounded-xl"
                >
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <FiEdit3 className="w-5 h-5 text-indigo-400" />
                    Edit Post
                  </h3>
                  <textarea
                    value={selectedPostForEdit.caption}
                    onChange={handleEditCaptionChange}
                    placeholder="Write a caption..."
                    rows="3"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none mb-3"
                  />
                  {selectedPostForEdit.images && selectedPostForEdit.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedPostForEdit.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt={`Preview ${idx}`} className="w-20 h-20 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeImageFromEdit(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUpdatePost(selectedPostForEdit._id)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg"
                    >
                      Update Post
                    </button>
                    <button
                      onClick={() => handleDeletePost(selectedPostForEdit._id)}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-lg inline-flex items-center gap-2"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedPostForEdit(null)}
                      className="px-5 py-2.5 text-slate-300 hover:bg-slate-700/50 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )} 

              {/* Existing Posts List */}
              <div>
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <FiGrid className="w-5 h-5 text-indigo-400" />
                  Your Posts ({posts.length})
                </h3>
                {posts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FiImage className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-400">No posts to manage.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {posts.map((post) => (
                      <motion.div
                        key={post._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between items-center p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-all border border-slate-600/30"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {post.image && post.image.length > 0 && (
                            <img 
                              src={post.image[0]} 
                              alt="Post thumbnail" 
                              className="w-12 h-12 object-cover rounded-lg flex-shrink-0" 
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-200 truncate">{post.caption || 'No caption'}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => openEditPostForm(post)}
                            className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors"
                          >
                            <FiEdit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}