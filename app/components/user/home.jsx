'use client';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiMessageSquare, FiBookOpen, FiPlusCircle,
  FiSettings, FiBell, FiLogOut, FiUserPlus, FiUsers,
  FiX, FiUser, FiTrash2, FiRefreshCw, FiMenu, FiCheck
} from 'react-icons/fi';
import { FaWhatsapp } from "react-icons/fa";
import ChatWindow from "./ChatWindow";
import { useSocket } from '@/hooks/useSocket';

export default function Home({ selectedChatId }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFindUsers, setShowFindUsers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState(null);

  // Socket connection for real-time chat list updates
  const { socket, isConnected: socketConnected } = useSocket(session?.user?.id);

  useEffect(() => {
    fetchChats();
  }, []);

  // Listen for incoming messages to update chat list in real-time
  useEffect(() => {
    if (!socket || !session?.user?.id) return;

    const handleNewMessage = (message) => {
      const otherUserId = message.senderId?.toString?.() || message.senderId;

      // Don't process messages sent by ourselves (those are handled by ChatWindow)
      if (otherUserId === session.user.id) return;

      setChats(prevChats => {
        const existingChatIndex = prevChats.findIndex(
          chat => chat.user._id === otherUserId
        );

        let updatedChats;

        if (existingChatIndex !== -1) {
          // Chat exists — update it and move to top
          const existingChat = prevChats[existingChatIndex];
          const updatedChat = {
            ...existingChat,
            lastMessage: {
              content: message.content,
              timestamp: message.timestamp || new Date().toISOString(),
              isRead: false,
            },
            // Only increment unread if this chat is NOT currently open
            unreadCount: selectedChatId === otherUserId
              ? existingChat.unreadCount
              : (existingChat.unreadCount || 0) + 1,
          };

          updatedChats = [
            updatedChat,
            ...prevChats.filter((_, i) => i !== existingChatIndex),
          ];
        } else {
          // New chat from a user not in the list — add at top
          // We'll fetch that user's info to display properly
          fetchChats();
          return prevChats;
        }

        return updatedChats;
      });

      // Show toast notification if the message is NOT from the currently open chat
      if (selectedChatId !== otherUserId) {
        // Find the sender name from existing chats
        setChats(prev => {
          const senderChat = prev.find(c => c.user._id === otherUserId);
          const senderName = senderChat?.user?.name || 'Someone';
          const senderImage = senderChat?.user?.profileImage || null;
          showToast(senderName, message.content, senderImage, otherUserId);
          return prev; // don't modify
        });
      }
    };

    socket.on('receive-message', handleNewMessage);

    // Also handle messages sent by us to update chat list
    const handleSentMessage = (message) => {
      const otherUserId = message.receiverId?.toString?.() || message.receiverId;
      if (!otherUserId) return;

      setChats(prevChats => {
        const existingChatIndex = prevChats.findIndex(
          chat => chat.user._id === otherUserId
        );

        if (existingChatIndex !== -1) {
          const existingChat = prevChats[existingChatIndex];
          const updatedChat = {
            ...existingChat,
            lastMessage: {
              content: message.content,
              timestamp: message.timestamp || new Date().toISOString(),
              isRead: true,
            },
          };
          return [
            updatedChat,
            ...prevChats.filter((_, i) => i !== existingChatIndex),
          ];
        } else {
          // New conversation — refetch to get proper user info
          fetchChats();
          return prevChats;
        }
      });
    };

    socket.on('message-sent-full', handleSentMessage);

    return () => {
      socket.off('receive-message', handleNewMessage);
      socket.off('message-sent-full', handleSentMessage);
    };
  }, [socket, session?.user?.id, selectedChatId]);

  // Toast notification helper
  const showToast = useCallback((senderName, content, senderImage, senderId) => {
    const id = Date.now();
    setToast({ id, senderName, content, senderImage, senderId });
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/user/chats');
      const data = await response.json();
      setChats(data.chats || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    if (!showFindUsers) return;
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/user/peoples');
      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, [showFindUsers]);

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

  const filteredChats = chats.filter(chat =>
    chat.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.username.toLowerCase().includes(searchUsers.toLowerCase())
  ).filter(user => user._id !== session?.user?.id);

  const handleChatClick = (userId) => {
    router.push(`/chat/${userId}`);
    setSidebarOpen(false);
  };

  const startNewChat = (userId) => {
    router.push(`/chat/${userId}`);
    setShowFindUsers(false);
    setSidebarOpen(false);
  };

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

      {/* Sidebar */}
      <div className="hidden lg:flex w-20 flex-col items-center py-6 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50">
        {/* Logo */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
          <FaWhatsapp className="w-7 h-7 text-white" />
        </div>

        {/* Nav Icons */}
        <div className="flex flex-col gap-3 flex-1">
          <button
            onClick={() => setShowFindUsers(false)}
            className={`p-3.5 rounded-2xl transition-all transform hover:scale-105 ${!showFindUsers
              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
              }`}
          >
            <FiMessageSquare className="w-6 h-6" />
          </button>

          <button
            onClick={() => setShowFindUsers(true)}
            className={`p-3.5 rounded-2xl transition-all transform hover:scale-105 ${showFindUsers
              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
              }`}
          >
            <FiUserPlus className="w-6 h-6" />
          </button>

          <button
            onClick={() => router.push('/')}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105"
          >
            <FiBookOpen className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Icons */}
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
        {/* Logo */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
          <FaWhatsapp className="w-7 h-7 text-white" />
        </div>

        {/* Nav Icons */}
        <div className="flex flex-col gap-3 flex-1 mt-20 lg:mt-0">
          <button
            onClick={() => {
              setShowFindUsers(false);
              setSidebarOpen(false);
            }}
            className={`p-3.5 rounded-2xl transition-all transform hover:scale-105 ${!showFindUsers
              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
              }`}
          >
            <FiMessageSquare className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              setShowFindUsers(true);
              setSidebarOpen(false);
            }}
            className={`p-3.5 rounded-2xl transition-all transform hover:scale-105 ${showFindUsers
              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
              }`}
          >
            <FiUserPlus className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              router.push('/');
              setSidebarOpen(false);
            }}
            className="p-3.5 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all transform hover:scale-105"
          >
            <FiBookOpen className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Icons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              router.push('/profile');
              setSidebarOpen(false);
            }}
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
      </motion.div>

      {/* Chat List Panel */}
      <div className={`${selectedChatId ? 'hidden lg:flex' : 'flex'} ${showFindUsers && !selectedChatId ? 'w-full' : 'w-full lg:w-96'} flex-col bg-slate-900/30 backdrop-blur-xl ${showFindUsers && !selectedChatId ? '' : 'border-r border-slate-700/50'} mt-16 lg:mt-0`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            {showFindUsers ? (
              <>
                <FiUserPlus className="w-6 h-6 text-indigo-400" />
                Build Network
              </>
            ) : (
              <>
                <FiMessageSquare className="w-6 h-6 text-indigo-400" />
                Messages
              </>
            )}
          </h1>
          {showFindUsers && (
            <button
              onClick={() => setShowFindUsers(false)}
              className="p-2 rounded-xl hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-slate-300"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            {showFindUsers ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>
            ) : (
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            )}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {!showFindUsers ? (
            <div className="p-4 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                    <FiMessageSquare className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">No conversations yet</h3>
                  <p className="text-slate-500 mb-6">Start chatting with your friends</p>
                  <button
                    onClick={() => setShowFindUsers(true)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2 transform hover:scale-105"
                  >
                    <FiUserPlus className="w-5 h-5" />
                    Find Users
                  </button>
                </div>
              ) : (
                filteredChats.map((chat, index) => (
                  <motion.div
                    key={chat.user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleChatClick(chat.user._id)}
                    className={`group relative p-4 rounded-2xl transition-all cursor-pointer border ${selectedChatId === chat.user._id
                      ? 'bg-slate-800/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'border-transparent hover:bg-gradient-to-r hover:from-indigo-600/10 hover:to-purple-600/10 hover:border-indigo-500/30'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        {/* Profile Image or Fallback Initials */}
                        {chat.user.profileImage ? (
                          <div className="w-14 h-14 rounded-4xl bg-slate-200 flex items-center justify-center overflow-hidden shadow-lg">
                            <img
                              src={chat.user.profileImage}
                              alt={chat.user.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                e.target.style.display = 'none';
                                // We'll handle fallback via conditional rendering instead
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {chat.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {chat.user.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-lg" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-slate-200 truncate">{chat.user.name}</h3>
                          {chat.lastMessage && (
                            <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                              {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 truncate">
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="p-4">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                    <FiUsers className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">No users found</h3>
                  <p className="text-slate-500">Try searching with different keywords</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredUsers.map((user, index) => (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      onClick={() => router.push(`/profile/${user._id}`)}
                      className="group relative bg-slate-800/40 hover:bg-slate-800/70 rounded-xl border border-slate-700/40 hover:border-slate-600/60 transition-all duration-200 cursor-pointer overflow-hidden"
                    >
                      {/* Card Content */}
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Profile Image */}
                          <div className="relative flex-shrink-0">
                            {user.profileImage ? (
                              <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden ring-2 ring-slate-600/50 group-hover:ring-indigo-500/30 transition-all">
                                <img
                                  src={user.profileImage}
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-base ring-2 ring-slate-600/50 group-hover:ring-indigo-500/30 transition-all">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {user.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-800" />
                            )}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-100 truncate text-sm group-hover:text-white transition-colors">
                              {user.name}
                            </h3>
                            <p className="text-xs text-slate-500 mb-1.5">@{user.username}</p>

                            {/* Professional Summary */}
                            {user.profile && (
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                {user.profile}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Follow Button */}
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const res = await fetch('/api/user/follow', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ targetUserId: user._id }),
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  await fetchAllUsers();
                                } else {
                                  alert(data.message || 'Action failed');
                                }
                              } catch (err) {
                                alert('Network error');
                              }
                            }}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 flex items-center gap-1.5 ${user.isFollowing
                              ? 'bg-slate-700/60 text-slate-300 border border-slate-600/50 hover:bg-slate-600/60 hover:text-white'
                              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30'
                              }`}
                          >
                            {user.isFollowing ? (
                              <>
                                <FiCheck className="w-3.5 h-3.5" />
                                Following
                              </>
                            ) : (
                              <>
                                <FiUserPlus className="w-3.5 h-3.5" />
                                Follow
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content — hidden when Find Users is active */}
      {!showFindUsers && (
        <div
          className={`flex-1 overflow-hidden relative bg-slate-900/40 backdrop-blur-md mt-16 lg:mt-0 ${selectedChatId ? 'flex' : 'hidden lg:flex'
            }`}
        >
          {selectedChatId ? (
            <div className="w-full h-full p-0 lg:p-4">
              <ChatWindow chatId={selectedChatId} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                  <FiMessageSquare className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-200 mb-3">Your messages are waiting</h2>
                <p className="text-slate-400 text-lg">Open a chat and start connecting now.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast Notification for new messages */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -40, x: '-50%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={() => {
              router.push(`/chat/${toast.senderId}`);
              setToast(null);
            }}
            className="fixed top-6 left-1/2 z-[100] cursor-pointer w-[90%] max-w-sm"
          >
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 shadow-2xl shadow-indigo-500/10 flex items-center gap-3">
              {toast.senderImage ? (
                <img
                  src={toast.senderImage}
                  alt={toast.senderName}
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500/40 flex-shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {toast.senderName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{toast.senderName}</p>
                <p className="text-xs text-slate-400 truncate">{toast.content}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToast(null);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors flex-shrink-0"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
      `}</style>
      {/* Notification Modal */}
      <AnimatePresence>
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
        )}
      </AnimatePresence>
    </div>
  );
}