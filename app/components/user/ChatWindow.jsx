
'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiArrowLeft, FiMoreVertical, FiPaperclip, FiImage, FiPhone } from 'react-icons/fi';
import { useSocket } from '@/hooks/useSocket';
import VideoCallModal from '@/app/components/user/VideoCallModal';
import IncomingCallModal from '@/app/components/user/IncomingCallModal';
import { useWebRTC } from '@/hooks/useWebRTC';

export default function ChatWindow({ chatId }) {
    const router = useRouter();
    const { data: session } = useSession();
    const [chatData, setChatData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const userId = chatId;
    const { socket, isConnected } = useSocket(session?.user?.id);

    // Get WebRTC hook — media is acquired lazily (only when call starts)
    const {
        localStream,
        remoteStream,
        isCalling,
        isReceivingCall,
        isInCall,
        callUser,
        hangUp,
        acceptCall,
    } = useWebRTC(socket, userId);

    useEffect(() => {
        if (!session || !userId) return;
        fetchChatData();
    }, [userId, session]);

    useEffect(() => {
        if (socket && userId) {
            const handleReceiveMessage = (message) => {
                // Only add the message if it belongs to this conversation
                // i.e., the sender is the person we're currently chatting with
                if (message.senderId === userId) {
                    setMessages(prev => [...prev, message]);
                }
            };

            socket.on('receive-message', handleReceiveMessage);

            return () => {
                socket.off('receive-message', handleReceiveMessage);
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
            <div className="flex items-center justify-center h-full bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-700/50">
                <div className="text-center">
                    <div className="relative w-12 h-12 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
                    </div>
                    <p className="text-slate-400 font-medium">Loading chat...</p>
                </div>
            </div>
        );
    }

    if (!chatData) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-700/50">
                <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                        <FiMoreVertical className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-300 font-semibold mb-2">Chat not found</p>
                    <p className="text-slate-500 text-sm mb-6">This conversation doesn't exist or has been removed</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm lg:rounded-3xl lg:border border-slate-700/50 overflow-hidden relative">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/chat')}
                        className="lg:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                    </button>
                    <div
                        className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.push(`/profile/${chatData.user._id}`)}
                    >
                        <div className="relative">
                            <img
                                src={chatData.user.profileImage || 'https://via.placeholder.com/40'}
                                alt={chatData.user.name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700"
                            />
                            {chatData.user.isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                            )}
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-200">{chatData.user.name}</h2>
                            <p className="text-xs text-slate-400">
                                {chatData.user.isOnline ? 'Active now' :
                                    chatData.user.lastSeen ? `Last seen ${new Date(chatData.user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
                                        'Offline'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => callUser(userId)}
                        className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        disabled={isCalling || isInCall}
                        title="Start Video Call"
                    >
                        <FiPhone className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        <FiMoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-slate-900/20">
                <AnimatePresence>
                    {messages.map((message) => (
                        <motion.div
                            key={message._id || `${message.timestamp}-${message.senderId}`}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${message.senderId === session.user.id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[70%] ${message.senderId === session.user.id ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`px-4 py-3 rounded-2xl shadow-sm break-words text-sm ${message.senderId === session.user.id
                                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
                                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                                        }`}
                                >
                                    <p className="leading-relaxed">{message.content}</p>
                                </div>
                                <p className={`text-[10px] mt-1.5 px-1 ${message.senderId === session.user.id ? 'text-slate-500 text-right' : 'text-slate-500'
                                    }`}>
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50 shrink-0">
                <div className="flex items-end gap-2 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50">
                    <button className="p-2.5 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors">
                        <FiPaperclip className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors">
                        <FiImage className="w-5 h-5" />
                    </button>

                    <textarea
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        rows={1}
                        disabled={isSending || !isConnected}
                        className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-200 placeholder-slate-500 resize-none py-3 px-2 max-h-32 custom-scrollbar"
                        style={{ minHeight: '44px' }}
                    />

                    <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || !isConnected || isSending}
                        className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                    >
                        {isSending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <FiSend className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <div className="flex items-center justify-center mt-2 gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                    <p className="text-[10px] text-slate-500">
                        {isConnected ? 'Connected' : 'Connecting...'}
                    </p>
                </div>
            </div>

            {/* Call Modals */}
            {isInCall && (
                <VideoCallModal
                    localStream={localStream}
                    remoteStream={remoteStream}
                    onHangUp={hangUp}
                />
            )}

            {isReceivingCall && (
                <IncomingCallModal
                    onAccept={acceptCall}
                    onReject={hangUp}
                />
            )}
        </div>
    );
}
