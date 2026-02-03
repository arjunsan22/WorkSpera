"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import StoryViewer from "./StoryViewer";
import StoryUploader from "./StoryUploader"; // Optional: if we want to allow quick add from feed
import { FiPlus } from "react-icons/fi";

export default function StoryFeed() {
    const { data: session } = useSession();
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [uploaderOpen, setUploaderOpen] = useState(false);
    const [initialStoryIndex, setInitialStoryIndex] = useState(0);

    const fetchStories = async () => {
        try {
            const res = await fetch("/api/stories");
            if (res.ok) {
                const data = await res.json();
                setStories(data.stories);
            }
        } catch (error) {
            console.error("Failed to fetch stories", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchStories();
        }
    }, [session]);

    const handleStoryClick = (index) => {
        setInitialStoryIndex(index);
        setViewerOpen(true);
    };

    // Check if current user has a story in the feed
    const userStoryIndex = stories.findIndex(
        (group) => group.user._id === session?.user?.id
    );

    const hasUserStory = userStoryIndex !== -1;

    // If we want to segregate "My Story" from the list visually or logically
    // For now I'll just render the list as returned, but if My Story is missing, show a "Add" circle?

    return (
        <div className="mb-6">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">

                {/* 'Add Story' / 'My Story' Circle if not in list or separate handling */}
                {/* If the user has a story, it should be in the list. If not, show Add button. */}

                {!hasUserStory && session && (
                    <div className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer" onClick={() => setUploaderOpen(true)}>
                        <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-gray-600 p-1 flex items-center justify-center hover:bg-gray-800 transition-colors">
                            <img
                                src={session.user.image || "/default-avatar.png"}
                                className="w-full h-full rounded-full object-cover opacity-50"
                                alt="Me"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FiPlus className="text-white bg-blue-600 rounded-full p-1 w-6 h-6" />
                            </div>
                        </div>
                        <span className="text-xs text-gray-400 truncate w-16 text-center">Add Story</span>
                    </div>
                )}

                {/* Story Circles */}
                {stories.map((group, index) => {
                    const isMe = group.user._id === session?.user?.id;
                    return (
                        <div
                            key={group.user._id}
                            className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer group"
                            onClick={() => handleStoryClick(index)}
                        >
                            <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600 group-hover:scale-105 transition-transform">
                                <div className="w-full h-full rounded-full border-2 border-black overflow-hidden">
                                    <img
                                        src={group.user.profileImage || "/default-avatar.png"}
                                        alt={group.user.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <span className="text-xs text-white truncate w-16 text-center">
                                {isMe ? "Your Story" : group.user.name.split(' ')[0]}
                            </span>
                        </div>
                    );
                })}

                {loading && (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="flex flex-col items-center gap-2 min-w-[70px] animate-pulse">
                            <div className="w-16 h-16 rounded-full bg-gray-800"></div>
                            <div className="w-12 h-2 rounded bg-gray-800"></div>
                        </div>
                    ))
                )}

            </div>

            {viewerOpen && (
                <StoryViewer
                    feed={stories}
                    startIndex={initialStoryIndex}
                    onClose={() => setViewerOpen(false)}
                />
            )}

            {uploaderOpen && (
                <StoryUploader
                    onClose={() => setUploaderOpen(false)}
                    onUploadSuccess={() => {
                        fetchStories(); // Refresh list
                    }}
                />
            )}
        </div>
    );
}
