
'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiArrowLeft, FiMoreVertical, FiPaperclip, FiImage, FiPhone, FiPhoneOff, FiX, FiZoomIn } from 'react-icons/fi';
import { useSocket } from '@/hooks/useSocket';
import VideoCallModal from '@/app/components/user/VideoCallModal';
import IncomingCallModal from '@/app/components/user/IncomingCallModal';
import { useWebRTC } from '@/hooks/useWebRTC';

// ─── Tick Component (WhatsApp-style) ───────────────────────────
function MessageTicks({ status }) {
    if (status === 'seen') {
        // Double tick — blue (seen)
        return (
            <span className="inline-flex items-center ml-1" title="Seen">
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 6L4.5 9.5L12 2" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 6L9.5 9.5L17 2" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
        );
    }
    if (status === 'delivered') {
        // Double tick — gray (delivered but not read)
        return (
            <span className="inline-flex items-center ml-1" title="Delivered">
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 6L4.5 9.5L12 2" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 6L9.5 9.5L17 2" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
        );
    }
    // Single tick — gray (sent)
    return (
        <span className="inline-flex items-center ml-1" title="Sent">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 6L4.5 9.5L11 2" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    );
}

// ─── Image Lightbox Modal ──────────────────────────────────────
function ImageLightbox({ src, onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center cursor-zoom-out"
        >
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
                <FiX className="w-6 h-6" />
            </button>
            <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                src={src}
                alt="Full size"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
        </motion.div>
    );
}

export default function ChatWindow({ chatId }) {
    const router = useRouter();
    const { data: session } = useSession();
    const [chatData, setChatData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState(null); // { file, url }
    const [lightboxImage, setLightboxImage] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const userId = chatId;
    const { socket, isConnected } = useSocket(session?.user?.id);

    // Get WebRTC hook — media is acquired lazily (only when call starts)
    const {
        localStream,
        remoteStream,
        isCalling,
        isReceivingCall,
        isInCall,
        callerInfo,
        callUser,
        hangUp,
        acceptCall,
        rejectCall,
    } = useWebRTC(socket, userId);

    useEffect(() => {
        if (!session || !userId) return;
        fetchChatData();
    }, [userId, session]);

    // Emit "messages-seen" when chat is opened or new messages come in
    useEffect(() => {
        if (socket && userId && session?.user?.id) {
            socket.emit('messages-seen', {
                readerId: session.user.id,
                senderId: userId,
            });
        }
    }, [socket, userId, session?.user?.id, messages.length]);

    // Listen for real-time read receipt updates (when the OTHER user reads our messages)
    useEffect(() => {
        if (!socket || !userId) return;

        const handleReadUpdate = (data) => {
            // data: { readerId, status }
            if (data.readerId === userId && data.status === 'seen') {
                setMessages(prev =>
                    prev.map(msg => {
                        const msgSenderId = msg.senderId?.toString?.() || msg.senderId;
                        if (msgSenderId === session?.user?.id && msg.status !== 'seen') {
                            return { ...msg, status: 'seen' };
                        }
                        return msg;
                    })
                );
            }
        };

        socket.on('messages-read-update', handleReadUpdate);
        return () => socket.off('messages-read-update', handleReadUpdate);
    }, [socket, userId, session?.user?.id]);

    useEffect(() => {
        if (socket && userId) {
            const handleReceiveMessage = (message) => {
                // Only add the message if it belongs to this conversation
                const msgSenderId = message.senderId?.toString?.() || message.senderId;
                if (msgSenderId === userId) {
                    setMessages(prev => [...prev, message]);

                    // Immediately tell sender we've seen it (we're in the chat right now)
                    socket.emit('messages-seen', {
                        readerId: session.user.id,
                        senderId: userId,
                    });
                }
            };

            // Listen for message-sent to update local message status
            const handleMessageSent = (data) => {
                // data: { status, messageId }
                setMessages(prev =>
                    prev.map(msg => {
                        if (msg.isLocal) {
                            return { ...msg, _id: data.messageId, status: data.status, isLocal: false };
                        }
                        return msg;
                    })
                );
            };

            socket.on('receive-message', handleReceiveMessage);
            socket.on('message-sent', handleMessageSent);

            return () => {
                socket.off('receive-message', handleReceiveMessage);
                socket.off('message-sent', handleMessageSent);
            };
        }
    }, [socket, userId, session?.user?.id]);

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

    // ─── Image Upload Handler ──────────────────────────────────
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Only JPEG, PNG, GIF, and WebP images are allowed.');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB.');
            return;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setImagePreview({ file, url: previewUrl });

        // Reset file input so the same file can be selected again
        e.target.value = '';
    };

    const cancelImagePreview = () => {
        if (imagePreview?.url) {
            URL.revokeObjectURL(imagePreview.url);
        }
        setImagePreview(null);
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload/chat-image', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Upload failed');
        }

        const data = await response.json();
        return data.url;
    };

    // ─── Send Message (text and/or image) ──────────────────────
    const sendMessage = async () => {
        const hasText = newMessage.trim().length > 0;
        const hasImage = !!imagePreview;

        if ((!hasText && !hasImage) || !socket || isSending) return;

        setIsSending(true);

        try {
            let uploadedImageUrl = null;

            // Upload image first if present
            if (hasImage) {
                setIsUploadingImage(true);
                try {
                    uploadedImageUrl = await uploadImage(imagePreview.file);
                } catch (uploadErr) {
                    console.error('Image upload failed:', uploadErr);
                    alert('Failed to upload image. Please try again.');
                    setIsUploadingImage(false);
                    setIsSending(false);
                    return;
                }
                setIsUploadingImage(false);
            }

            const messageData = {
                senderId: session.user.id,
                receiverId: userId,
                content: newMessage.trim() || '',
                imageUrl: uploadedImageUrl,
                timestamp: new Date().toISOString()
            };

            const localMessage = {
                ...messageData,
                _id: `local-${Date.now()}`,
                isLocal: true,
                status: 'sent',
            };

            setMessages(prev => [...prev, localMessage]);
            socket.emit('send-message', messageData);
            setNewMessage('');
            cancelImagePreview();
            inputRef.current?.focus();

        } catch (error) {
            console.error('Error sending message:', error);
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
                        onClick={() => callUser(userId, session?.user?.name, session?.user?.image)}
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
                    {messages.map((message) => {
                        const isMine = (message.senderId?.toString?.() || message.senderId) === session.user.id;
                        return (
                            <motion.div
                                key={message._id || `${message.timestamp}-${message.senderId}`}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`rounded-2xl shadow-sm break-words text-sm overflow-hidden ${isMine
                                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
                                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                                            } ${message.imageUrl && !message.content ? '' : 'px-4 py-3'}`}
                                    >
                                        {/* Image */}
                                        {message.imageUrl && (
                                            <div
                                                className={`relative group cursor-pointer ${message.content ? 'mb-2' : ''} ${message.imageUrl && !message.content ? 'p-1' : ''}`}
                                                onClick={() => setLightboxImage(message.imageUrl)}
                                            >
                                                <img
                                                    src={message.imageUrl}
                                                    alt="Shared image"
                                                    className="max-w-full rounded-xl max-h-72 object-cover"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center">
                                                    <FiZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Text content */}
                                        {message.content && (
                                            <p className={`leading-relaxed ${message.imageUrl ? 'px-4 py-2' : ''}`}>{message.content}</p>
                                        )}
                                    </div>

                                    {/* Timestamp + Ticks */}
                                    <div className={`flex items-center gap-0.5 mt-1.5 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <span className="text-[10px] text-slate-500">
                                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMine && (
                                            <MessageTicks status={message.status || (message.isRead ? 'seen' : 'sent')} />
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Image Preview Strip */}
            <AnimatePresence>
                {imagePreview && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-900/80 border-t border-slate-700/50 px-4 py-3 overflow-hidden"
                    >
                        <div className="relative inline-block">
                            <img
                                src={imagePreview.url}
                                alt="Preview"
                                className="h-24 w-auto rounded-xl object-cover border border-slate-600/50"
                            />
                            <button
                                onClick={cancelImagePreview}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-colors shadow-lg"
                            >
                                <FiX className="w-3.5 h-3.5" />
                            </button>
                            {isUploadingImage && (
                                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50 shrink-0">
                <div className="flex items-end gap-2 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50">
                    <button className="p-2.5 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors">
                        <FiPaperclip className="w-5 h-5" />
                    </button>

                    {/* Image picker button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"
                        disabled={isUploadingImage}
                    >
                        <FiImage className="w-5 h-5" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                    />

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
                        disabled={(!newMessage.trim() && !imagePreview) || !isConnected || isSending}
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

            {/* Image Lightbox */}
            <AnimatePresence>
                {lightboxImage && (
                    <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
                )}
            </AnimatePresence>

            {/* Calling state - show overlay while waiting for answer */}
            {isCalling && !isInCall && (
                <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6"
                    >
                        <FiPhone className="w-10 h-10 text-white" />
                    </motion.div>
                    <p className="text-white text-xl font-semibold mb-2">Calling...</p>
                    <p className="text-slate-400 text-sm mb-8">Waiting for {chatData?.user?.name || 'friend'} to answer</p>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={hangUp}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg shadow-red-500/30"
                    >
                        <FiPhoneOff className="w-6 h-6" />
                    </motion.button>
                </div>
            )}

            {/* Active call */}
            {isInCall && (
                <VideoCallModal
                    localStream={localStream}
                    remoteStream={remoteStream}
                    onHangUp={hangUp}
                />
            )}

            {/* Incoming call */}
            {isReceivingCall && (
                <IncomingCallModal
                    callerInfo={callerInfo}
                    onAccept={acceptCall}
                    onReject={rejectCall}
                />
            )}
        </div>
    );
}

