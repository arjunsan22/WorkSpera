"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { FiX, FiMoreHorizontal } from "react-icons/fi";
import { FaHeart, FaRegHeart, FaPaperPlane } from "react-icons/fa";

const STORY_DURATION = 5000;

export default function StoryViewer({ feed, startIndex = 0, onClose }) {
    const { data: session } = useSession();
    const [currentUserIndex, setCurrentUserIndex] = useState(startIndex);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [likesState, setLikesState] = useState({});

    // Extra safety checks for dynamic feed changes
    if (!feed || feed.length === 0) return null;

    const safeUserIndex =
        currentUserIndex >= 0 && currentUserIndex < feed.length
            ? currentUserIndex
            : 0;

    const currentUserGroup = feed[safeUserIndex];
    const storiesForUser = currentUserGroup?.stories || [];

    if (storiesForUser.length === 0) return null;

    const safeStoryIndex =
        currentStoryIndex >= 0 && currentStoryIndex < storiesForUser.length
            ? currentStoryIndex
            : 0;

    const currentStory = storiesForUser[safeStoryIndex];

    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const progressRef = useRef(0);

    useEffect(() => {
        const initial = {};
        feed.forEach((group) => {
            group.stories.forEach((story) => {
                const likes = story.likes || [];
                const isLiked = !!session && likes.some((id) => id.toString?.() === session.user.id);
                initial[story._id] = { likeCount: likes.length, isLiked };
            });
        });
        setLikesState(initial);
    }, [feed, session]);

    useEffect(() => {
        setProgress(0);
        progressRef.current = 0;
        startTimer();
        return () => clearTimer();
    }, [currentUserIndex, currentStoryIndex]);

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startTimer = () => {
        clearTimer();
        const startTime = Date.now() - (progressRef.current * STORY_DURATION) / 100;
        startTimeRef.current = startTime;

        timerRef.current = setInterval(() => {
            if (isPaused) return;
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = (elapsed / STORY_DURATION) * 100;

            if (newProgress >= 100) {
                handleNext();
            } else {
                setProgress(newProgress);
                progressRef.current = newProgress;
            }
        }, 30); 
    };

    const handlePause = (paused) => {
        setIsPaused(paused);
        if (!paused) {
            const accumulated = (progressRef.current / 100) * STORY_DURATION;
            startTimeRef.current = Date.now() - accumulated;
        }
    };

    const handleNext = () => {
        if (currentStoryIndex < currentUserGroup.stories.length - 1) {
            setCurrentStoryIndex((prev) => prev + 1);
        } else {
            if (currentUserIndex < feed.length - 1) {
                setCurrentUserIndex((prev) => prev + 1);
                setCurrentStoryIndex(0);
            } else {
                onClose();
            }
        }
    };

    const handlePrev = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex((prev) => prev - 1);
        } else {
            if (currentUserIndex > 0) {
                const prevUserIndex = currentUserIndex - 1;
                setCurrentUserIndex(prevUserIndex);
                setCurrentStoryIndex(feed[prevUserIndex].stories.length - 1);
            } else {
                setCurrentStoryIndex(0);
                setProgress(0);
                progressRef.current = 0;
                startTimer();
            }
        }
    };

    const currentLikesState = likesState[currentStory._id] || {
        likeCount: currentStory.likes?.length || 0,
        isLiked: false,
    };

    const handleLike = async () => {
        if (!session) return;
        try {
            const res = await fetch(`/api/stories/${currentStory._id}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: session.user.id }),
            });
            if (res.ok) {
                setLikesState((prev) => {
                    const prevState = prev[currentStory._id] || currentLikesState;
                    const nextLiked = !prevState.isLiked;
                    return {
                        ...prev,
                        [currentStory._id]: {
                            isLiked: nextLiked,
                            likeCount: prevState.likeCount + (nextLiked ? 1 : -1),
                        },
                    };
                });
            }
        } catch (error) {
            console.error("Error liking story:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black md:bg-black/95 backdrop-blur-xl flex items-center justify-center transition-all">
            {/* Background Image Blur (For desktop cinematic feel) */}
            <div
                className="absolute inset-0 opacity-40 bg-cover bg-center hidden md:block"
                style={{ backgroundImage: `url(${currentStory.image})`, filter: 'blur(80px)' }}
            />

            <div className="relative w-full md:w-[420px] h-full md:h-[92vh] md:rounded-xl overflow-hidden bg-black shadow-2xl flex flex-col">
                
                {/* Content Area */}
                <div
                    className="relative flex-1 flex items-center justify-center overflow-hidden cursor-pointer"
                    onMouseDown={() => handlePause(true)}
                    onMouseUp={() => handlePause(false)}
                    onTouchStart={() => handlePause(true)}
                    onTouchEnd={() => handlePause(false)}
                >
                    <img
                        src={currentStory.image}
                        alt="Story"
                        className="w-full h-full object-cover select-none"
                    />

                    {/* Gradient Overlays for UI Readability */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {/* Caption Overlay */}
                    {currentStory.text && (
                        <div className="absolute bottom-24 left-0 right-0 px-6 py-4 text-center pointer-events-none">
                            <p className="text-white text-lg font-medium drop-shadow-lg leading-snug">
                                {currentStory.text}
                            </p>
                        </div>
                    )}
                </div>

                {/* Top Interface: Progress & User */}
                <div className="absolute top-0 left-0 right-0 p-3 z-20">
                    <div className="flex gap-1.5 mb-4 px-1">
                        {currentUserGroup.stories.map((story, idx) => (
                            <div key={story._id} className="h-[2px] flex-1 bg-white/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white transition-all duration-100 ease-linear"
                                    style={{
                                        width: idx < currentStoryIndex ? '100%' :
                                               idx === currentStoryIndex ? `${progress}%` : '0%'
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                            <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                                <img
                                    src={currentUserGroup.user.profileImage || '/default-avatar.png'}
                                    alt={currentUserGroup.user.name}
                                    className="w-9 h-9 rounded-full border-2 border-black object-cover"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-sm tracking-wide drop-shadow-md">
                                    {currentUserGroup.user.name}
                                </span>
                                <span className="text-white/80 text-[11px] font-medium uppercase tracking-tighter">
                                    {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="text-white p-2">
                                <FiMoreHorizontal size={20} />
                            </button>
                            <button onClick={onClose} className="text-white p-2">
                                <FiX size={26} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Interface: Interactions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 flex items-center gap-4 z-20">
                    <div className="flex-1">
                        <div className="bg-transparent border border-white/40 rounded-full px-5 py-2.5 backdrop-blur-sm">
                            <p className="text-white/60 text-sm">Send message...</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleLike(); }}
                        className="transition-transform active:scale-125 duration-200"
                    >
                        {currentLikesState.isLiked ? (
                            <FaHeart className="text-red-500" size={26} />
                        ) : (
                            <FaRegHeart className="text-white" size={26} />
                        )}
                        <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-bold px-1 rounded-full">
                            {currentLikesState.likeCount > 0 && currentLikesState.likeCount}
                        </span>
                    </button>

                    <button className="text-white transition-transform active:scale-110">
                        <FaPaperPlane size={22} />
                    </button>
                </div>

                {/* Navigation Overlays */}
                <div 
                    className="absolute inset-y-0 left-0 w-[20%] z-10 cursor-pointer" 
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                />
                <div 
                    className="absolute inset-y-0 right-0 w-[20%] z-10 cursor-pointer" 
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                />
            </div>
        </div>
    );
}