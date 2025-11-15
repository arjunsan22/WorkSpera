// components/user/home.jsx
'use client';

import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch,FiMessageSquare, FiBookOpen,FiPlusCircle ,FiSettings, FiBell, FiLogOut, FiUserPlus, FiUsers, FiX, FiUser, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { FaWhatsapp } from "react-icons/fa";
export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFindUsers, setShowFindUsers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchChats();
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
        headers: {
          'Content-Type': 'application/json',
        },
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
  };

  const startNewChat = (userId) => {
    router.push(`/chat/${userId}`);
    setShowFindUsers(false);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-16 lg:w-20 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50 flex-col items-center py-6 gap-6">
        {/* Logo */}
<div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
  <FaWhatsapp className="w-6 h-6 text-red-500" />
</div>

        {/* Nav Icons */}
        <div className="flex-1 flex flex-col gap-4">
          <button 
            onClick={() => setShowFindUsers(false)}
            className={`p-3 rounded-xl transition-all ${!showFindUsers ? 'bg-slate-700/50 text-indigo-400' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-300'}`}
          >
            <FiMessageSquare className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowFindUsers(true)}
            className={`p-3 rounded-xl transition-all ${showFindUsers ? 'bg-slate-700/50 text-indigo-400' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-300'}`}
          >
            <FiUserPlus className="w-5 h-5" />
          </button>

           <button  onClick={() => router.push('/feeds')}
            className={`p-3 rounded-xl transition-all  text-indigo-400 `}
          >
            <FiBookOpen  className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Icons */}
        <div className="flex flex-col gap-4">
          <button       onClick={() => router.push('/profile')}

           className="p-3 rounded-xl text-slate-400 hover:bg-slate-700/30 hover:text-slate-300 transition-all">
            <FiUser className="w-5 h-5" />
          </button>
          <button 
            onClick={handleLogout}
            className="p-3 rounded-xl text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat List Panel */}
      <div className="w-full md:w-96 lg:w-[420px] bg-slate-800/40 backdrop-blur-xl border-r border-slate-700/50 flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">
              {showFindUsers ? 'Find Users' : 'Messages'}
            </h1>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                <FiBell className="w-5 h-5 text-slate-400" />
              </button>
              {showFindUsers && (
                <button
                  onClick={() => setShowFindUsers(false)}
                  className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <FiX className="w-5 h-5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            {showFindUsers ? (
              <>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
                <button 
                  onClick={() => setShowFindUsers(true)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  <FiUserPlus className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            )}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3">
          {!showFindUsers ? (
            <div className="space-y-1 pb-4">
              <AnimatePresence>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FiMessageSquare className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">No conversations yet</h3>
                    <p className="text-slate-400 text-sm mb-6">Start chatting with your friends</p>
                    <button
                      onClick={() => setShowFindUsers(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 inline-flex items-center gap-2"
                    >
                      <FiUserPlus className="w-4 h-4" />
                      Find Users
                    </button>
                  </div>
                ) : (
                  filteredChats.map((chat, index) => (
                    <motion.div
                      key={chat._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={() => handleChatClick(chat.user._id)}
                      className="group relative p-4 rounded-xl hover:bg-indigo-600/20 transition-all cursor-pointer border border-transparent hover:border-indigo-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={chat.user.profileImage || 'https://via.placeholder.com/48'}
                            alt={chat.user.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700"
                          />
                          {chat.user.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-800"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                              {chat.user.name}
                            </h3>
                            {chat.lastMessage && (
                              <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                                {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 truncate">
                            {chat.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <div className="flex-shrink-0 ml-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                              {chat.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Find Users View
            <div className="space-y-1 pb-4">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiUsers className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">No users found</h3>
                  <p className="text-slate-400 text-sm">Try searching with different keywords</p>
                </div>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => startNewChat(user._id)}
                    className="group relative p-4 rounded-xl hover:bg-indigo-600/20 transition-all cursor-pointer border border-transparent hover:border-indigo-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={user.profileImage || 'https://via.placeholder.com/48'}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700"
                        />
                        {user.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-800"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                          {user.name}
                        </h3>
                        <p className="text-sm text-slate-400 truncate">
                          @{user.username}
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                        Message
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content / Placeholder */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-900/30">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-indigo-500/20">
            <FaWhatsapp className="w-12 h-12 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-200 mb-2">Your messages are waiting</h2>
          <p className="text-slate-400">Open a chat and start connecting now.</p>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-6 py-4 safe-area-bottom"
      >
        <div className="flex justify-around items-center">
          <button 
            onClick={() => setShowFindUsers(false)}
            className={`p-3 rounded-xl transition-all ${!showFindUsers ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <FiMessageSquare className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setShowFindUsers(true)}
            className={`p-3 rounded-xl transition-all ${showFindUsers ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <FiUserPlus className="w-6 h-6" />
          </button>
                     
           <button  onClick={() => router.push('/feeds')}
            className={`p-3 rounded-xl transition-all  text-indigo-400 `}
          >
            <FiBookOpen  className="w-5 h-5" />
          </button>
          <button       onClick={() => router.push('/profile')}
 className="p-3 rounded-xl text-slate-400 hover:bg-slate-700/50 transition-all">
            <FiUser className="w-6 h-6" />
          </button>
          <button 
            onClick={handleLogout}
            className="p-3 rounded-xl text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            <FiLogOut className="w-6 h-6" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}