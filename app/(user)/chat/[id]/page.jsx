// app/chat/[id]/page.js
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiArrowLeft, FiMoreVertical, FiPaperclip, FiImage } from 'react-icons/fi';
import { useSocket } from '@/hooks/useSocket';
import VideoCallModal from '@/app/components/user/VideoCallModal';
import IncomingCallModal from '@/app/components/user/IncomingCallModal';
import { useWebRTC } from '@/hooks/useWebRTC';

export default function ChatDetail() {
  const router = useRouter();
  const params = useParams(); 
  const { data: session } = useSession();
  const [chatData, setChatData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
const [showVideoCall, setShowVideoCall] = useState(false);
  const userId = params.id;
  const { socket, isConnected } = useSocket(session?.user?.id);

// Get WebRTC hook
const {
  remoteStream,
  isCalling,
  isReceivingCall,
  isInCall, 
  callUser,
  hangUp,
  acceptCall,
} = useWebRTC(socket, localStream, userId);

// Get user media on mount (only once)
useEffect(() => {
  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
    } catch (err) {
      console.error("Camera/mic access denied", err);
      alert("Camera and microphone access required for video calls.");
    }
  };

  getMedia();

  return () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  };
}, []);

  useEffect(() => {
    if (!session || !userId) return;
    fetchChatData();
  }, [userId, session]);

  useEffect(() => {
    if (socket && userId) {
      socket.on('receive-message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        socket.off('receive-message');
      };
    }
  }, [socket, userId]);

  const fetchChatData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/user/chats/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat data');
      }
      const data = await response.json();
      setChatData(data.chat);
      setMessages(data.chat.messages || []);
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || isSending) return;

    setIsSending(true);

    const messageData = {
      senderId: session.user.id,
      receiverId: userId,
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    try {
      const localMessage = {
        ...messageData,
        _id: `local-${Date.now()}`,
        isLocal: true
      };
      
      setMessages(prev => [...prev, localMessage]);
      socket.emit('send-message', messageData);
      setNewMessage('');
      inputRef.current?.focus();

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg._id !== localMessage._id));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chatData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FiMoreVertical className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold mb-2">Chat not found</p>
          <p className="text-gray-500 text-sm mb-6">This conversation doesn't exist or has been removed</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3 shadow-sm"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/')}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            
            <div className="relative">
              <img
                src={chatData.user.profileImage || 'https://via.placeholder.com/40'}
                alt={chatData.user.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-md"
              />
              {chatData.user.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              )}
            </div>
            
            <div>
              <h2 className="font-semibold text-gray-900">{chatData.user.name}</h2>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${chatData.user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <p className="text-xs text-gray-500">
                  {chatData.user.isOnline ? 'Active now' : 
                   chatData.user.lastSeen ? `Last seen ${new Date(chatData.user.lastSeen).toLocaleString()}` : 
                   'Offline'}
                </p>
              </div>
            </div>
          </div>
          

          {/* In header, after FiMoreVertical button */}
<button 
  onClick={() => callUser(userId)}
  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
  disabled={isCalling || isInCall} // ✅ disable if already in call
>
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
</button>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-6xl w-full mx-auto">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message._id || `${message.timestamp}-${message.senderId}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex mb-4 ${message.senderId === session.user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] sm:max-w-md lg:max-w-lg ${message.senderId === session.user.id ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                    message.senderId === session.user.id
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                  }`}
                >
                  <p className="text-sm leading-relaxed break-words">{message.content}</p>
                </div>
                <p className={`text-xs mt-1.5 px-2 ${
                  message.senderId === session.user.id ? 'text-gray-500 text-right' : 'text-gray-400'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl border-t border-gray-200/50 px-4 py-4 shadow-lg"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end gap-2">
            <button className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors mb-1">
              <FiPaperclip className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors mb-1">
              <FiImage className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                rows="1"
                disabled={isSending || !isConnected}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 transition-all"
                style={{ minHeight: '44px' }}
              />
            </div>
            
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected || isSending}
              className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md hover:shadow-lg mb-1"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <FiSend className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-center mt-2 gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
            <p className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        </div>
      </motion.div>
      {/* At the very end, before closing </div> */}
{isInCall && (
  <VideoCallModal
    localStream={localStream}
    remoteStream={remoteStream}
    onHangUp={() => {
      hangUp();
    }}
  />
)}

{isReceivingCall && (
  <IncomingCallModal
onAccept={() => {
  acceptCall();
}}
    onReject={() => {
      hangUp();
    }}
  />
)}
    </div>
  );
}