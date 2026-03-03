'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiMessageCircle } from 'react-icons/fi';

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hey there! 👋 I'm **WorkSpera AI**, your personal assistant. Ask me anything — career tips, profile help, or just chat!",
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input.trim() };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                const errMsg = errData?.error || "Sorry, I couldn't process that right now. Please try again! 🔄";
                throw new Error(errMsg);
            }

            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: data.reply },
            ]);
        } catch (error) {
            console.error('Chatbot error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: error.message || "Sorry, I couldn't process that right now. Please try again! 🔄",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Simple markdown-like renderer for bold text
    const renderContent = (text) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={i} className="font-semibold text-white">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <>
            {/* Floating Chatbot Icon Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white shadow-2xl shadow-indigo-500/40 flex items-center justify-center hover:shadow-indigo-500/60 transition-shadow"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                id="chatbot-toggle"
                aria-label="Open AI Chatbot"
            >
                <FiMessageCircle className="w-6 h-6" />
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping pointer-events-none" />
            </motion.button>

            {/* Chatbot Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[min(600px,85vh)] flex flex-col rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl shadow-black/40"
                            id="chatbot-modal"
                        >
                            {/* Header */}
                            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-5 py-4 flex items-center justify-between flex-shrink-0">
                                {/* Decorative glow */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                                <div className="relative flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                        <span className="text-xl">ᗯᔕ</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-base leading-tight">
                                            WorkSpera AI
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" />
                                            <span className="text-white/70 text-xs">Online</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="relative p-2 rounded-xl text-white/80 hover:bg-white/20 hover:text-white transition-all"
                                    aria-label="Close chatbot"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto bg-slate-900/95 backdrop-blur-xl px-4 py-5 space-y-4 scrollbar-hide">
                                {messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx === messages.length - 1 ? 0.1 : 0 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {/* Assistant avatar */}
                                        {msg.role === 'assistant' && (
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 mr-2 mt-1 text-xs shadow-lg shadow-indigo-500/20">
                                                ᗯᔕ
                                            </div>
                                        )}

                                        <div
                                            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-md shadow-lg shadow-indigo-500/20'
                                                : 'bg-slate-800/80 text-slate-300 border border-slate-700/50 rounded-bl-md shadow-lg'
                                                }`}
                                        >
                                            {msg.role === 'assistant'
                                                ? renderContent(msg.content)
                                                : msg.content}
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Typing indicator */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex justify-start"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 mr-2 mt-1 text-xs">
                                            ✨
                                        </div>
                                        <div className="bg-slate-800/80 border border-slate-700/50 px-5 py-3 rounded-2xl rounded-bl-md shadow-lg">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-4 py-3 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask me anything..."
                                        disabled={isLoading}
                                        className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50"
                                        id="chatbot-input"
                                    />
                                    <motion.button
                                        onClick={sendMessage}
                                        disabled={!input.trim() || isLoading}
                                        className={`p-3 rounded-xl transition-all flex-shrink-0 ${input.trim() && !isLoading
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50'
                                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                            }`}
                                        whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
                                        whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
                                        id="chatbot-send"
                                        aria-label="Send message"
                                    >
                                        <FiSend className="w-5 h-5" />
                                    </motion.button>
                                </div>
                                <p className="text-center text-[10px] text-slate-600 mt-2">
                                    Powered by Gemini AI • WorkSpera-owned by AS
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
