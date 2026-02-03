"use client";
import { useState, useEffect, useRef } from "react";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewer({ feed, startIndex = 0, onClose }) {
    const [currentUserIndex, setCurrentUserIndex] = useState(startIndex);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Safety check
    if (!feed || feed.length === 0) return null;

    const currentUserGroup = feed[currentUserIndex];
    const currentStory = currentUserGroup.stories[currentStoryIndex];

    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const progressRef = useRef(0); // Store progress between pauses

    // Start/Reset Timer when story changes
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
        }, 50); // Update every 50ms for smooth animation
    };

    const handlePause = (paused) => {
        setIsPaused(paused);
        if (paused) {
            // Just pause the update logic in setInterval, but keep interval running check
            // Actually better to calculate elapsed time correctly on resume
            if (timerRef.current && startTimeRef.current) {
                // capture current progress is enough? 
                // The interval logic above relies on `startTimeRef`, so if we pause, `Date.now()` keeps increasing.
                // We need to adjust `startTimeRef` when resuming.
            }
        } else {
            // Resuming: Reset startTime so that (Date.now() - startTime) equals the previous elapsed time
            // accumulated elapsed = (progress / 100) * DURATION
            const accumulated = (progressRef.current / 100) * STORY_DURATION;
            startTimeRef.current = Date.now() - accumulated;
        }
    };

    const handleNext = () => {
        if (currentStoryIndex < currentUserGroup.stories.length - 1) {
            // Next story for same user
            setCurrentStoryIndex(prev => prev + 1);
        } else {
            // Next user
            if (currentUserIndex < feed.length - 1) {
                setCurrentUserIndex(prev => prev + 1);
                setCurrentStoryIndex(0);
            } else {
                onClose(); // End of all stories
            }
        }
    };

    const handlePrev = () => {
        if (currentStoryIndex > 0) {
            // Prev story for same user
            setCurrentStoryIndex(prev => prev - 1);
        } else {
            // Prev user
            if (currentUserIndex > 0) {
                const prevUserIndex = currentUserIndex - 1;
                setCurrentUserIndex(prevUserIndex);
                // Go to last story of previous user? Usually yes.
                setCurrentStoryIndex(feed[prevUserIndex].stories.length - 1);
            } else {
                // Start of all stories, maybe close or restart?
                // standard is stay at start or close. Let's restart story.
                setCurrentStoryIndex(0);
                setProgress(0);
                progressRef.current = 0;
                startTimer();
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center">
            {/* Background Blur (Optional) */}
            <div
                className="absolute inset-0 opacity-30 bg-cover bg-center blur-3xl"
                style={{ backgroundImage: `url(${currentStory.image})` }}
            />

            <div className="relative w-full md:max-w-md h-full md:h-[90vh] md:rounded-2xl overflow-hidden bg-gray-900 shadow-2xl">

                {/* Story Content */}
                <div
                    className="relative w-full h-full bg-black flex items-center justify-center"
                    onMouseDown={() => handlePause(true)}
                    onMouseUp={() => handlePause(false)}
                    onTouchStart={() => handlePause(true)}
                    onTouchEnd={() => handlePause(false)}
                >
                    <img
                        src={currentStory.image}
                        alt="Story"
                        className="max-h-full max-w-full object-contain"
                    />
                    {currentStory.text && (
                        <div className="absolute bottom-20 left-0 right-0 text-center px-6 py-2 bg-black/30 backdrop-blur-sm">
                            <p className="text-white text-lg font-medium">{currentStory.text}</p>
                        </div>
                    )}
                </div>

                {/* Top Overlay: Progress Bars & User Info */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
                    {/* Progress Bars */}
                    <div className="flex gap-1 mb-3">
                        {currentUserGroup.stories.map((story, idx) => (
                            <div key={story._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
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

                    {/* User Info */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src={currentUserGroup.user.profileImage || '/default-avatar.png'}
                                alt={currentUserGroup.user.name}
                                className="w-10 h-10 rounded-full border border-white/50"
                            />
                            <div>
                                <p className="text-white font-semibold text-sm">{currentUserGroup.user.name}</p>
                                <p className="text-white/70 text-xs">
                                    {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Controls for desktop mostly */}
                            <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full">
                                <FiX size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Overlays (invisible click areas) */}
                <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handlePrev(); }}></div>
                <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handleNext(); }}></div>

            </div>
        </div>
    );
}
