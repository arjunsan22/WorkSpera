// app/user/profile/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit3, FiRefreshCw, FiImage, FiArrowLeft, FiUser, FiX, FiCamera, FiTrash2, FiPlus, FiHeart, FiMessageCircle, FiCalendar, FiGrid, FiBookOpen, FiLink, FiBriefcase, FiMenu, FiMessageSquare, FiLogOut, FiBell, FiUserPlus, FiBookmark, FiUploadCloud, FiFileText, FiCpu, FiCheck, FiDownload, FiZap, FiLoader } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Link from 'next/link';
import StoryUploader from "@/app/components/stories/StoryUploader";
import MyStoriesManager from "@/app/components/stories/MyStoriesManager";
import ChatBot from "@/app/components/user/ChatBot";
import ReactionModal from "@/app/components/user/ReactionModal";
import Swal from 'sweetalert2';

export default function ProfilePage() {
  const router = useRouter();
  // Story States
  const [showStoryUploader, setShowStoryUploader] = useState(false);
  const [showStoryManager, setShowStoryManager] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isEditPostsModalOpen, setIsEditPostsModalOpen] = useState(false);
  const [tempUser, setTempUser] = useState({});
  const [tempPost, setTempPost] = useState({ caption: '', images: [], type: 'feed' }); // Store temporary image URLs or file objects
  const [selectedPostForEdit, setSelectedPostForEdit] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [profileTab, setProfileTab] = useState('posts'); // 'posts' or 'saved'
  const [savedPosts, setSavedPosts] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [showReactionModal, setShowReactionModal] = useState(false);
  const [reactionModalLikes, setReactionModalLikes] = useState([]);

  // Resume & AI parsing states
  const [isResumeUploading, setIsResumeUploading] = useState(false);
  const [isAIParsing, setIsAIParsing] = useState(false);
  const [aiParsedData, setAiParsedData] = useState(null);
  const [resumeUploadProgress, setResumeUploadProgress] = useState('');
  
  // Poll creation states
  const [isPollEnabled, setIsPollEnabled] = useState(false);
  const [pollData, setPollData] = useState({ question: '', options: [{ text: '' }, { text: '' }] });

  // Custom Toast helper
  const showToast = (message, type = 'error') => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      icon: type,
      title: message,
      background: '#1e293b',
      color: '#fff',
      customClass: { popup: 'rounded-xl border border-slate-700/50' }
    });
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileData();
    }
  }, [session]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/user/notifications');
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications || []);
        const unread = data.notifications?.filter((n) => !n.read).length || 0;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (!session?.user?.id) {
      signOut({ callbackUrl: '/login' });
      return;
    }
    const userId = session.user.id;
    try {
      await fetch('/api/user/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isOnline: false }),
      });
    } catch (dbError) {
      console.error('Error calling update-status API on logout:', dbError);
    } finally {
      await signOut({ callbackUrl: '/login' });
    }
  };

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
      console.log("User Data Fetched (Client):", JSON.stringify(data.user, null, 2)); // 🔍 FULL DEBUG
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!user?._id) return;
    setLoadingFollowers(true);
    try {
      const res = await fetch(`/api/user/${user._id}/followers`);
      const data = await res.json();
      if (res.ok) {
        setFollowersList(data.followers || []);
      }
    } catch (err) {
      console.error('Error fetching followers:', err);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    if (!user?._id) return;
    setLoadingFollowing(true);
    try {
      const res = await fetch(`/api/user/${user._id}/following`);
      const data = await res.json();
      if (res.ok) {
        setFollowingList(data.following || []);
      }
    } catch (err) {
      console.error('Error fetching following:', err);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const openEditProfileModal = () => {
    if (user) {
      setTempUser({
        name: user.name,
        username: user.username,
        bio: user.bio,
        profileImage: user.profileImage,
        profile: user.profile || "",
        skills: user.skills || [],
        education: user.education?.map(edu => ({
          ...edu,
          startDate: edu.startDate || '',
          endDate: edu.endDate || '',
          startYear: undefined,
          endYear: undefined
        })) || [],
        links: user.links || [],
        resume: user.resume || '',
        resumeName: user.resumeName || '',
      });
      setAiParsedData(null);
      setIsEditProfileModalOpen(true);
    }
  };

  // Resume upload handler
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      showToast('Only PDF, DOC, and DOCX files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB.');
      return;
    }

    setIsResumeUploading(true);
    setResumeUploadProgress('Uploading resume...');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData,
      });

      const responseText = await res.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error('Server returned invalid response');
      }

      if (!res.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setTempUser(prev => ({
        ...prev,
        resume: result.url,
        resumeName: result.originalName,
      }));
      setResumeUploadProgress('Resume uploaded successfully!');
      setAiParsedData(null); // Reset any previous AI data
    } catch (error) {
      console.error('Resume upload error:', error);
      setResumeUploadProgress('');
      showToast(`Resume upload failed: ${error.message}`);
    } finally {
      setIsResumeUploading(false);
    }
  };

  // Remove resume
  const handleRemoveResume = () => {
    setTempUser(prev => ({ ...prev, resume: '', resumeName: '' }));
    setAiParsedData(null);
    setResumeUploadProgress('');
  };

  // AI Parse resume
  const handleAIParse = async () => {
    if (!tempUser.resume) {
      showToast('Please upload a resume first.');
      return;
    }

    setIsAIParsing(true);
    setAiParsedData(null);

    try {
      const res = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeUrl: tempUser.resume }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse resume');
      }

      setAiParsedData(data.data);
    } catch (error) {
      console.error('AI parse error:', error);
      showToast(`AI parsing failed: ${error.message}`);
    } finally {
      setIsAIParsing(false);
    }
  };

  // Apply AI parsed data to form
  const applyAIData = (fieldsToApply = 'all') => {
    if (!aiParsedData) return;

    setTempUser(prev => {
      const updates = { ...prev };

      if (fieldsToApply === 'all' || fieldsToApply === 'skills') {
        updates.skills = aiParsedData.skills;
      }
      if (fieldsToApply === 'all' || fieldsToApply === 'bio') {
        updates.bio = aiParsedData.bio;
      }
      if (fieldsToApply === 'all' || fieldsToApply === 'profile') {
        updates.profile = aiParsedData.profile;
      }
      if (fieldsToApply === 'all' || fieldsToApply === 'education') {
        updates.education = aiParsedData.education;
      }
      if (fieldsToApply === 'all' || fieldsToApply === 'links') {
        updates.links = aiParsedData.links;
      }

      return updates;
    });

    if (fieldsToApply === 'all') {
      setAiParsedData(null); // Clear after full apply
    }
  };

  // Download resume as proper PDF
  const handleDownloadResume = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      // Force PDF mime type
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      showToast('Failed to download resume. Please try again.');
    }
  };

  // Helper functions for dynamic fields
  const handleAddEducation = () => {
    setTempUser(prev => ({
      ...prev,
      education: [...(prev.education || []), { institution: '', degree: '', startDate: '', endDate: '' }]
    }));
  };

  const handleRemoveEducation = (index) => {
    setTempUser(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleEducationChange = (index, field, value) => {
    const newEducation = [...(tempUser.education || [])];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setTempUser(prev => ({ ...prev, education: newEducation }));
  };

  const handleAddLink = () => {
    setTempUser(prev => ({
      ...prev,
      links: [...(prev.links || []), { label: '', url: '' }]
    }));
  };

  const handleRemoveLink = (index) => {
    setTempUser(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const handleLinkChange = (index, field, value) => {
    const newLinks = [...(tempUser.links || [])];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setTempUser(prev => ({ ...prev, links: newLinks }));
  };

  const handleSkillsChange = (e) => {
    // Comma separated string to array
    const value = e.target.value;
    const skillsArray = value.split(',').map(s => s.trim()).filter(s => s);
    setTempUser(prev => ({ ...prev, skills: skillsArray }));
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
    setTempPost({ caption: '', images: [], type: 'feed' });
    setSelectedPostForEdit(null);
    setIsPollEnabled(false);
    setPollData({ question: '', options: [{ text: '' }, { text: '' }] });
  };
  //handle follow modal
  const handleFollowInModal = async (targetUserId, isCurrentlyFollowing, listType) => {
    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        // Refresh the list
        if (listType === 'followers') {
          fetchFollowers();
        } else {
          fetchFollowing();
        }
      } else {
        const data = await res.json();
        showToast(data.message || 'Action failed');
      }
    } catch (err) {
      showToast('Network error');
    }
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
      const data = await response.json();
      setUser(data.user);
      closeEditProfileModal();
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile');
    }
  };

  const handleAddPost = async () => {
    const validPollOptions = pollData.options.filter(o => o.text.trim());
    const hasPoll = isPollEnabled && pollData.question.trim() && validPollOptions.length >= 2;

    if (!tempPost.caption.trim() && tempPost.images.length === 0 && !hasPoll) {
      showToast('Please add a caption, at least one image, or a valid poll (question + 2 options).');
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
      const postPayload = {
        caption: tempPost.caption,
        userId: session.user.id,
        images: uploadedImageUrls,
        type: tempPost.type,
      };

      if (hasPoll) {
        postPayload.poll = {
          question: pollData.question.trim(),
          options: validPollOptions.map(o => ({ text: o.text.trim() }))
        };
      }

      const postResponse = await fetch('/api/user/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload),
      });

      if (!postResponse.ok) {
        let errorMsg = 'Failed to create post';
        try {
          const errorData = await postResponse.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const result = await postResponse.json();
      setPosts(prev => [result.post, ...prev]);
      closeEditPostsModal();
    } catch (error) {
      console.error('Error adding post:', error);
      showToast(error.message || 'Failed to add post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdatePost = async (postId) => {
    if (!selectedPostForEdit.caption.trim() && selectedPostForEdit.images.length === 0) {
      showToast('Please add a caption or at least one image.');
      return;
    }

    setIsUploading(true);

    try {
      // Process images: strings are existing URLs, Files need uploading
      const finalImageUrls = [];
      const imageList = selectedPostForEdit.images;

      for (const img of imageList) {
        if (typeof img === 'string') {
          // Keep existing URL
          finalImageUrls.push(img);
        } else if (img instanceof File) {
          // Upload new file
          const formData = new FormData();
          formData.append('image', img);

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            const result = await uploadResponse.json();
            finalImageUrls.push(result.url);
          } else {
            console.error('Failed to upload an image, skipping.');
          }
        }
      }

      const response = await fetch(`/api/user/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: selectedPostForEdit.caption,
          images: finalImageUrls,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }
      const data = await response.json();
      const updatedPost = data.post; // Response returns { post: ... }

      setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
      closeEditPostsModal();
    } catch (error) {
      console.error('Error updating post:', error);
      showToast('Failed to update post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    const result = await Swal.fire({
      title: 'Delete this post?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Yes, delete it',
      background: '#1e293b',
      color: '#fff',
      customClass: {
        popup: 'rounded-2xl border border-slate-700/50',
      }
    });

    if (!result.isConfirmed) return;

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

      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        icon: 'success',
        title: 'Post deleted successfully',
        background: '#1e293b',
        color: '#fff',
        customClass: {
          popup: 'rounded-xl border border-slate-700/50',
        }
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        icon: 'error',
        title: 'Failed to delete post',
        background: '#1e293b',
        color: '#fff',
        customClass: {
          popup: 'rounded-xl border border-slate-700/50',
        }
      });
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

  // ✅ Function to upload image and get URL
  const uploadImageAndGetUrl = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Read response as text first (in case Vercel returns HTML error page)
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        // Server returned HTML instead of JSON (Vercel crash)
        console.error('Server returned non-JSON response:', responseText.substring(0, 200));
        throw new Error(`Server return invalid JSON response. Status Code ${response.status}. ${parseError.message}`);
      }

      if (!response.ok) {
        console.error('Server upload error:', result);
        throw new Error(result.message || result.error || 'Upload failed');
      }

      return result.url;
    } catch (error) {
      console.error('Image upload error:', error);
      showToast(`Image upload failed: ${error.message}`);
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

  const handleAddComment = async () => {
    if (!newComment.trim() || !session?.user?.id) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/user/posts/${selectedPost._id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          text: newComment.trim(),
        }),
      });

      if (res.ok) {
        // Optimistically update UI
        const updatedPost = {
          ...selectedPost,
          comments: [
            ...(selectedPost.comments || []),
            {
              _id: Date.now().toString(), // temporary ID
              user: {
                _id: session.user.id,
                name: session.user.name,
                username: session.user.username,
                profileImage: session.user.image,
              },
              text: newComment.trim(),
              createdAt: new Date().toISOString(),
            },
          ],
        };
        setSelectedPost(updatedPost);

        // Also update the posts list in the background if needed
        setNewComment('');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Comment error:', err);
      showToast('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchSavedPosts = async () => {
    setLoadingSaved(true);
    try {
      const res = await fetch('/api/user/saved-posts');
      if (res.ok) {
        const data = await res.json();
        setSavedPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Error fetching saved posts:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleUnsavePost = async (postId) => {
    try {
      const res = await fetch(`/api/user/posts/${postId}/save`, {
        method: 'POST',
      });
      if (res.ok) {
        setSavedPosts(prev => prev.filter(p => p._id !== postId));
      }
    } catch (err) {
      console.error('Error unsaving post:', err);
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 overflow-hidden">
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 flex items-center justify-center">
              <img src="/favicon.ico" alt="WorkSpera" className="w-5 h-5 object-contain drop-shadow-sm" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              WorkSpera
            </span>
          </div>
          <button
            onClick={() => router.push('/feeds')}
            className="p-2 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-all"
          >
            <FiBookOpen className="w-5 h-5" />
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

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-20 flex-col items-center py-6 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
          <img src="/favicon.ico" alt="WorkSpera" className="w-7 h-7 object-contain drop-shadow-md" />
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
            onClick={() => router.push('/feeds')}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105"
          >
            <FiBookOpen className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105"
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
          <img src="/favicon.ico" alt="WorkSpera" className="w-7 h-7 object-contain drop-shadow-md" />
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
            onClick={() => { router.push('/feeds'); setSidebarOpen(false); }}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105"
          >
            <FiBookOpen className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105"
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
      <div className="flex-1 overflow-y-auto mt-16 lg:mt-0">
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
          {/* Profile Header */}
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
                      src={user.profileImage || 'https://via.placeholder.com/150'}
                      alt={user.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  </div>
                </div>
                <button
                  onClick={openEditProfileModal}
                  className="absolute bottom-2 right-2 bg-indigo-600 text-white rounded-full p-2.5 hover:bg-indigo-500 transition-all shadow-xl border-2 border-slate-900 active:scale-95"
                >
                  <FiCamera className="w-5 h-5" />
                </button>
              </motion.div>

              {/* --- INFO SECTION --- */}
              <div className="flex-1 flex flex-col items-center md:items-start w-full">

                {/* Top Row: Username & Primary Actions */}
                <div className="flex flex-col md:flex-row items-center gap-4 mb-6 w-full">
                  <h2 className="text-2xl md:text-3xl font-light text-white tracking-tight">
                    @{user.username}
                  </h2>

                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={openEditProfileModal}
                      className="px-5 py-1.5 bg-slate-100 hover:bg-white text-slate-900 text-sm font-semibold rounded-lg transition-all active:scale-95"
                    >
                      Edit Profile
                    </button>


                  </div>
                </div>

                {/* Middle Row: Stats */}
                <div className="flex items-center justify-around md:justify-start gap-8 md:gap-10 mb-6 w-full md:w-auto py-4 md:py-0 border-y border-slate-800/50 md:border-none">
                  <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
                    <span className="text-lg font-bold text-white">{posts.length}</span>
                    <span className="text-slate-400 text-sm md:text-base">posts</span>
                  </div>

                  <button
                    onClick={() => { fetchFollowers(); setShowFollowersModal(true); }}
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 group"
                  >
                    <span className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {user.followers?.length || 0}
                    </span>
                    <span className="text-slate-400 text-sm md:text-base">followers</span>
                  </button>

                  <button
                    onClick={() => { fetchFollowing(); setShowFollowingModal(true); }}
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 group"
                  >
                    <span className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {user.following?.length || 0}
                    </span>
                    <span className="text-slate-400 text-sm md:text-base">following</span>
                  </button>
                </div>

                {/* Bottom Row: Name & Bio */}
                <div className="text-center md:text-left mb-8">
                  <h1 className="text-lg font-bold text-white mb-1">{user.name}</h1>
                  <p className="text-slate-300 leading-relaxed max-w-lg whitespace-pre-wrap">
                    {user.bio || 'Digital creator & professional'}
                  </p>
                </div>

                {/* Management Row: Action Buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full">
                  <button
                    onClick={openEditPostsModal}
                    className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 active:scale-95"
                  >
                    <FiPlus className="w-5 h-5" />
                    Manage Posts
                  </button>

                  <button
                    onClick={() => setShowStoryUploader(true)}
                    className="flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:opacity-90 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 active:scale-95"
                  >
                    <FiPlus className="w-5 h-5" />
                    Add Story
                  </button>

                  <button
                    onClick={() => setShowStoryManager(true)}
                    className="px-6 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-white rounded-xl transition-all font-medium border border-slate-700 flex items-center justify-center gap-2 active:scale-95"
                  >
                    Stories
                  </button>
                </div>

              </div>
            </div>
          </motion.div>

          {/* Professional Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6 md:p-8 mb-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <FiBriefcase className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Professional Profile</h2>
            </div>

            <div className="space-y-8">
              {/* Resume */}
              {user.resume && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Resume</h3>
                  <button
                    onClick={() => handleDownloadResume(user.resume, user.resumeName)}
                    className="inline-flex items-center gap-3 px-4 py-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-all group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <FiFileText className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-slate-200 text-sm font-medium group-hover:text-indigo-400 transition-colors">
                        {user.resumeName || 'Resume'}
                      </p>
                      <p className="text-slate-500 text-xs">Click to download</p>
                    </div>
                    <FiDownload className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors ml-2" />
                  </button>
                </div>
              )}

              {/* Summary */}
              {user.profile && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">About</h3>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{user.profile}</p>
                </div>
              )}

              {/* Skills */}
              {user.skills && user.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {user.education && user.education.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Education</h3>
                  <div className="space-y-4">
                    {user.education.map((edu, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <FiBookOpen className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{edu.institution}</h4>
                          <p className="text-slate-400 text-sm">{edu.degree}</p>
                          <p className="text-slate-500 text-xs mt-1">
                            {edu.startDate && !isNaN(new Date(edu.startDate)) ? new Date(edu.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : ''}
                            {' - '}
                            {edu.currentlyStudying ? 'Present' : (edu.endDate && !isNaN(new Date(edu.endDate)) ? new Date(edu.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {user.links && user.links.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Links</h3>
                  <div className="flex flex-wrap gap-4">
                    {user.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <FiLink className="w-4 h-4" />
                        <span className="underline decoration-indigo-500/30">{link.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Posts Grid Header - Instagram-style Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="border-t border-slate-800/50 mb-4"
          >
            <div className="flex items-center justify-center gap-12">
              <button
                onClick={() => setProfileTab('posts')}
                className={`flex items-center gap-2 py-4 px-2 border-t-2 transition-all text-sm font-semibold tracking-wider uppercase ${profileTab === 'posts'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
              >
                <FiGrid className="w-4 h-4" />
                Posts
              </button>
              <button
                onClick={() => {
                  setProfileTab('saved');
                  if (savedPosts.length === 0) fetchSavedPosts();
                }}
                className={`flex items-center gap-2 py-4 px-2 border-t-2 transition-all text-sm font-semibold tracking-wider uppercase ${profileTab === 'saved'
                  ? 'border-white text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
              >
                <FiBookmark className="w-4 h-4" />
                Saved
              </button>
            </div>
          </motion.div>

          {/* Posts Grid */}
          {profileTab === 'posts' && (
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
                        <p className="text-slate-200 text-sm mb-3 line-clamp-2">{post.caption || post.poll?.question || 'Untitled'}</p>

                        <div className="flex items-center justify-between text-slate-400 text-sm">
                          <div className="flex items-center gap-4">
                            <span 
                              className="flex items-center gap-1 cursor-pointer hover:text-indigo-400 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReactionModalLikes(post.likes || []);
                                setShowReactionModal(true);
                              }}
                            >
                              <FiHeart className="w-4 h-4" />
                              {post.likes?.length || 0}
                            </span>
                            <span
                              className="flex items-center gap-1 cursor-pointer hover:text-indigo-400 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPost(post);
                                setCommentModalOpen(true);
                              }}
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
          )}

          {/* Saved Posts Grid */}
          {profileTab === 'saved' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {loadingSaved ? (
                <div className="flex items-center justify-center py-16">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
                  </div>
                </div>
              ) : savedPosts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full flex flex-col items-center justify-center py-16 px-6 bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl"
                >
                  <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mb-4">
                    <FiBookmark className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-200 mb-2">No saved posts</h3>
                  <p className="text-slate-400 text-center">Posts you save will appear here</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedPosts.map((post, index) => (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all shadow-lg hover:shadow-amber-500/10"
                    >
                      {post.image && post.image.length > 0 && (
                        <div className="relative aspect-square overflow-hidden bg-slate-900">
                          <img
                            src={post.image[0]}
                            alt={`Saved post ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {post.image.length > 1 && (
                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                              +{post.image.length - 1}
                            </div>
                          )}
                          {/* Unsave overlay button */}
                          <button
                            onClick={() => handleUnsavePost(post._id)}
                            className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-amber-400 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                            title="Unsave post"
                          >
                            <FiBookmark className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      )}

                      <div className="p-4">
                        {/* Post author */}
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={post.user?.profileImage || '/default-avatar.png'}
                            alt={post.user?.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-slate-300 text-xs font-semibold">{post.user?.name}</span>
                        </div>
                        <p className="text-slate-200 text-sm mb-3 line-clamp-2">{post.caption || post.poll?.question || 'Untitled'}</p>

                        <div className="flex items-center justify-between text-slate-400 text-sm">
                          <div className="flex items-center gap-4">
                            <span 
                              className="flex items-center gap-1 cursor-pointer hover:text-indigo-400 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReactionModalLikes(post.likes || []);
                                setShowReactionModal(true);
                              }}
                            >
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
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Edit Profile Modal */}
        {showStoryUploader && (
          <StoryUploader
            onClose={() => setShowStoryUploader(false)}
            onUploadSuccess={() => {
              // Optional: maybe refresh something
            }}
          />
        )}

        {showStoryManager && (
          <MyStoriesManager onClose={() => setShowStoryManager(false)} />
        )}

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
                className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar"
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

                  {/* Resume Upload Section */}
                  <div className="pt-4 border-t border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <FiFileText className="w-5 h-5 text-indigo-400" />
                      Resume & AI Profile Builder
                    </h3>

                    {/* Current Resume Display */}
                    {tempUser.resume ? (
                      <div className="mb-4 p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                              <FiFileText className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                              <p className="text-slate-200 text-sm font-medium">{tempUser.resumeName || 'Resume'}</p>
                              <p className="text-green-400 text-xs flex items-center gap-1">
                                <FiCheck className="w-3 h-3" /> Uploaded
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadResume(tempUser.resume, tempUser.resumeName)}
                              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg transition-all"
                              title="Download resume"
                            >
                              <FiDownload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleRemoveResume}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Remove resume"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* AI Parse Button */}
                        <button
                          onClick={handleAIParse}
                          disabled={isAIParsing}
                          className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 font-medium"
                        >
                          {isAIParsing ? (
                            <>
                              <FiRefreshCw className="w-4 h-4 animate-spin" />
                              Parsing with AI...
                            </>
                          ) : (
                            <>
                              <FiCpu className="w-4 h-4" />
                              🤖 Parse Resume with AI
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Upload Area */
                      <div className="mb-4">
                        <label className="flex flex-col items-center justify-center p-6 bg-slate-700/20 hover:bg-slate-700/40 border-2 border-dashed border-slate-600/50 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all group">
                          {isResumeUploading ? (
                            <>
                              <FiRefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                              <p className="text-slate-300 text-sm">{resumeUploadProgress || 'Uploading...'}</p>
                            </>
                          ) : (
                            <>
                              <FiUploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 mb-2 transition-colors" />
                              <p className="text-slate-300 text-sm font-medium">Upload Resume</p>
                              <p className="text-slate-500 text-xs mt-1">PDF, DOC, DOCX (max 5MB)</p>
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleResumeUpload}
                            disabled={isResumeUploading}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {/* AI Parsed Data Preview */}
                    {aiParsedData && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl border border-purple-500/30"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-white font-semibold flex items-center gap-2">
                            <FiZap className="w-4 h-4 text-yellow-400" />
                            AI Extracted Data
                          </h4>
                          <button
                            onClick={() => applyAIData('all')}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition-all flex items-center gap-1 font-medium"
                          >
                            <FiCheck className="w-3 h-3" />
                            Apply All
                          </button>
                        </div>

                        <div className="space-y-3">
                          {/* Bio Preview */}
                          {aiParsedData.bio && (
                            <div className="p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-slate-400 uppercase">Bio</span>
                                <button onClick={() => applyAIData('bio')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                  <FiCheck className="w-3 h-3" /> Apply
                                </button>
                              </div>
                              <p className="text-slate-300 text-sm">{aiParsedData.bio}</p>
                            </div>
                          )}

                          {/* Profile/Summary Preview */}
                          {aiParsedData.profile && (
                            <div className="p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-slate-400 uppercase">Professional Summary</span>
                                <button onClick={() => applyAIData('profile')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                  <FiCheck className="w-3 h-3" /> Apply
                                </button>
                              </div>
                              <p className="text-slate-300 text-sm">{aiParsedData.profile}</p>
                            </div>
                          )}

                          {/* Skills Preview */}
                          {aiParsedData.skills?.length > 0 && (
                            <div className="p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-400 uppercase">Skills ({aiParsedData.skills.length})</span>
                                <button onClick={() => applyAIData('skills')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                  <FiCheck className="w-3 h-3" /> Apply
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {aiParsedData.skills.map((skill, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Education Preview */}
                          {aiParsedData.education?.length > 0 && (
                            <div className="p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-400 uppercase">Education ({aiParsedData.education.length})</span>
                                <button onClick={() => applyAIData('education')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                  <FiCheck className="w-3 h-3" /> Apply
                                </button>
                              </div>
                              {aiParsedData.education.map((edu, idx) => (
                                <div key={idx} className="text-sm mb-2 last:mb-0">
                                  <p className="text-slate-200 font-medium">{edu.institution}</p>
                                  <p className="text-slate-400 text-xs">{edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ''}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Links Preview */}
                          {aiParsedData.links?.length > 0 && (
                            <div className="p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-400 uppercase">Links ({aiParsedData.links.length})</span>
                                <button onClick={() => applyAIData('links')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                  <FiCheck className="w-3 h-3" /> Apply
                                </button>
                              </div>
                              {aiParsedData.links.map((link, idx) => (
                                <div key={idx} className="text-sm mb-1 last:mb-0">
                                  <span className="text-indigo-400">{link.label}:</span>{' '}
                                  <span className="text-slate-400 text-xs break-all">{link.url}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Professional Fields */}
                  <div className="pt-4 border-t border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-4">Professional Profile</h3>

                    {/* Summary */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-300 mb-1">Professional Summary</label>
                      <textarea
                        value={tempUser.profile || ''}
                        onChange={(e) => handleInputChange(e, 'profile')}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500 resize-none"
                        placeholder="Summarize your professional experience..."
                        rows="4"
                      />
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-300 mb-1">Skills (Comma separated)</label>
                      <input
                        type="text"
                        defaultValue={tempUser.skills?.join(', ') || ''}
                        onBlur={handleSkillsChange}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500"
                        placeholder="e.g. React, Node.js, Design"
                      />
                    </div>

                    {/* Education */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-slate-300">Education</label>
                        <button onClick={handleAddEducation} type="button" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          <FiPlus /> Add
                        </button>
                      </div>
                      <div className="space-y-3">
                        {tempUser.education?.map((edu, idx) => (
                          <div key={idx} className="p-3 bg-slate-700/30 rounded-xl border border-slate-700/50 relative group">
                            <button
                              onClick={() => handleRemoveEducation(idx)}
                              className="absolute top-2 right-2  text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                              <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) => handleEducationChange(idx, 'institution', e.target.value)}
                                placeholder="Institution"
                                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white"
                              />
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => handleEducationChange(idx, 'degree', e.target.value)}
                                placeholder="Degree"
                                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="date"
                                value={edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => handleEducationChange(idx, 'startDate', e.target.value)}
                                placeholder="Start Date"
                                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white"
                              />
                              <div className="flex flex-col">
                                <input
                                  type="date"
                                  value={edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : ''}
                                  onChange={(e) => handleEducationChange(idx, 'endDate', e.target.value)}
                                  placeholder="End Date"
                                  className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white disabled:opacity-50"
                                  disabled={edu.currentlyStudying}
                                />
                                <label className="flex items-center gap-2 mt-2 text-xs text-slate-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={edu.currentlyStudying || false}
                                    onChange={(e) => {
                                      handleEducationChange(idx, 'currentlyStudying', e.target.checked);
                                      if (e.target.checked) handleEducationChange(idx, 'endDate', '');
                                    }}
                                    className="rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-0 w-3 h-3"
                                  />
                                  Currently studying
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-slate-300">Links</label>
                        <button onClick={handleAddLink} type="button" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          <FiPlus /> Add
                        </button>
                      </div>
                      <div className="space-y-3">
                        {tempUser.links?.map((link, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => handleLinkChange(idx, 'label', e.target.value)}
                              placeholder="Label (e.g. Portfolio)"
                              className="w-1/3 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white"
                            />
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                              placeholder="URL"
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white"
                            />
                            <button
                              onClick={() => handleRemoveLink(idx)}
                              className="text-slate-500 hover:text-red-400"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">Post Type</label>
                    <select
                      value={tempPost.type || 'feed'}
                      onChange={(e) => setTempPost({ ...tempPost, type: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                    >
                      <option value="feed">Normal Feed</option>
                      <option value="job">Job Post / Service Request</option>
                    </select>
                  </div>

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

                  {/* Poll Creation Toggle & Form */}
                  <div className="mb-4">
                    <button
                      onClick={() => setIsPollEnabled(!isPollEnabled)}
                      className="text-sm flex items-center gap-2 text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                    >
                      <span>{isPollEnabled ? '− Remove Poll' : '+ Add Poll'}</span>
                    </button>

                    {isPollEnabled && (
                      <div className="mt-3 p-4 bg-slate-800/50 rounded-xl border border-slate-600/50">
                        <input
                          type="text"
                          placeholder="Your question..."
                          value={pollData.question}
                          onChange={(e) => setPollData({ ...pollData, question: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-3"
                        />
                        <div className="space-y-2 mb-3">
                          {pollData.options.map((opt, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder={`Option ${idx + 1}`}
                                  value={opt.text}
                                  onChange={(e) => {
                                    const newOptions = [...pollData.options];
                                    newOptions[idx].text = e.target.value;
                                    setPollData({ ...pollData, options: newOptions });
                                  }}
                                  className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                                {idx >= 2 && (
                                  <button
                                    onClick={() => {
                                      const newOptions = pollData.options.filter((_, i) => i !== idx);
                                      setPollData({ ...pollData, options: newOptions });
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-400 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                                  >
                                    <FiX className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {pollData.options.length < 5 && (
                          <button
                            onClick={() => setPollData({ ...pollData, options: [...pollData.options, { text: '' }] })}
                            className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors"
                          >
                            + Add Option
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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

                    {/* Add Images Button for Edit Mode */}
                    <div className="mb-3">
                      <label className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2">
                        <FiImage className="w-4 h-4" />
                        Add Images
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const newFiles = Array.from(files);
                              setSelectedPostForEdit(prev => ({
                                ...prev,
                                images: [...(prev.images || []), ...newFiles]
                              }));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {selectedPostForEdit.images && selectedPostForEdit.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedPostForEdit.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img src={getPreviewUrl(img)} alt={`Preview ${idx}`} className="w-20 h-20 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => removeImageFromEdit(idx)}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-100 transition-opacity" // Changed opacity-0 group-hover:opacity-100 to explicitly visible or handle correctly
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
                        disabled={isUploading}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                      >
                        {isUploading && <FiLoader className="animate-spin w-4 h-4" />}
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
                              <p className="text-slate-200 truncate">{post.caption || post.poll?.question || 'No caption'}</p>
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
        {/* Followers Modal */}
        <AnimatePresence>
          {showFollowersModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowFollowersModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Followers</h2>
                  <button
                    onClick={() => setShowFollowersModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                {loadingFollowers ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : followersList.length === 0 ? (
                  <p className="text-slate-400 text-center py-6">No followers yet.</p>
                ) : (
                  <div className="space-y-3">
                    {followersList.map((follower) => (
                      <div key={follower._id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => {
                            setShowFollowersModal(false);
                            router.push(`/profile/${follower._id}`);
                          }}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                            {follower.profileImage ? (
                              <img
                                src={follower.profileImage}
                                alt={follower.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500">
                                <FiUser className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-slate-200 group-hover:text-indigo-400 transition-colors">{follower.name}</p>
                            <p className="text-slate-400 text-sm">@{follower.username}</p>
                          </div>
                        </div>
                        {session?.user?.id !== follower._id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowInModal(follower._id, follower.isFollowing, 'followers');
                            }}
                            className={`text-xs px-3 py-1.5 rounded-lg ${follower.isFollowing
                              ? 'bg-gray-600 text-white'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500'
                              }`}
                          >
                            {follower.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Following Modal */}
        <AnimatePresence>
          {showFollowingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowFollowingModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Following</h2>
                  <button
                    onClick={() => setShowFollowingModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                {loadingFollowing ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : followingList.length === 0 ? (
                  <p className="text-slate-400 text-center py-6">Not following anyone.</p>
                ) : (
                  <div className="space-y-3">
                    {followingList.map((following) => (
                      <div key={following._id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => {
                            setShowFollowingModal(false);
                            router.push(`/profile/${following._id}`);
                          }}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                            {following.profileImage ? (
                              <img
                                src={following.profileImage}
                                alt={following.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500">
                                <FiUser className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-slate-200 group-hover:text-indigo-400 transition-colors">{following.name}</p>
                            <p className="text-slate-400 text-sm">@{following.username}</p>
                          </div>
                        </div>
                        {session?.user?.id !== following._id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowInModal(following._id, following.isFollowing, 'following');
                            }}
                            className={`text-xs px-3 py-1.5 rounded-lg ${following.isFollowing
                              ? 'bg-gray-600 text-white'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500'
                              }`}
                          >
                            {following.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Comment Modal */}
        <AnimatePresence>
          {commentModalOpen && selectedPost && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCommentModalOpen(false)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <FiMessageCircle className="w-5 h-5 text-indigo-400" />
                    Comments ({selectedPost.comments?.length || 0})
                  </h2>
                  <button
                    onClick={() => setCommentModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-700/50 hover:text-slate-300"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {/* Comments List */}
                <div className="max-h-80 overflow-y-auto custom-scrollbar p-4">
                  {selectedPost.comments?.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No comments yet.</p>
                  ) : (
                    selectedPost.comments.map((comment, idx) => (
                      <motion.div
                        key={comment._id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex gap-3 mb-4 last:mb-0"
                      >
                        {comment.user?.profileImage ? (
                          <img
                            src={comment.user.profileImage}
                            alt={comment.user.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                            {comment.user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold text-slate-200">
                              {comment.user?.name || 'Anonymous'}
                            </span>{' '}
                            <span className="text-slate-400">{comment.text}</span>
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {new Date(comment.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Add Comment Input */}
                <div className="p-4 border-t border-slate-700/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isSubmitting && newComment.trim()) {
                          handleAddComment();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isSubmitting}
                      className={`px-4 rounded-xl font-medium transition-colors ${newComment.trim() && !isSubmitting
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                      {isSubmitting ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : 'Post'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>


      </div>

      {/* AI Chatbot */}
      <ChatBot />
      <ReactionModal 
        isOpen={showReactionModal} 
        onClose={() => setShowReactionModal(false)} 
        likes={reactionModalLikes} 
      />
    </div>
  );
}