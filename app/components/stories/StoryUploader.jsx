"use client";
import { useState, useRef } from "react";
import { FiImage, FiX, FiSend, FiLoader } from "react-icons/fi";
import { useSession } from "next-auth/react";

export default function StoryUploader({ onClose, onUploadSuccess }) {
    const { data: session } = useSession();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [text, setText] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Upload Image
            const formData = new FormData();
            formData.append("image", file);

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Image upload failed");
            const uploadData = await uploadRes.json();
            const imageUrl = uploadData.url;

            // 2. Create Story
            const storyRes = await fetch("/api/stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: imageUrl,
                    text: text,
                }),
            });

            if (!storyRes.ok) throw new Error("Story creation failed");

            if (onUploadSuccess) onUploadSuccess();
            onClose();
        } catch (error) {
            console.error("Story upload error:", error);
            alert("Failed to upload story");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h3 className="text-xl font-bold text-white">Add to Story</h3>
                    <button
                        onClick={onClose}
                        className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
                    >
                        <FiX className="text-white text-lg" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">

                    {!preview ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-64 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-colors group"
                        >
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FiImage className="text-3xl text-zinc-400" />
                            </div>
                            <p className="text-zinc-400 font-medium">Click to select photo</p>
                        </div>
                    ) : (
                        <div className="relative w-full h-80 rounded-xl overflow-hidden group">
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                onClick={() => { setFile(null); setPreview(null); }}
                                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                            >
                                <FiX />
                            </button>

                            {/* Text Overlay Input (Optional style) */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                <input
                                    type="text"
                                    placeholder="Add a caption..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full bg-transparent text-white placeholder-zinc-300 border-none focus:ring-0 text-center text-lg outline-none"
                                    maxLength={100}
                                />
                            </div>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 flex justify-end">
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${!file || isUploading
                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:opacity-90 shadow-lg shadow-pink-500/25"
                            }`}
                    >
                        {isUploading ? (
                            <>
                                <FiLoader className="animate-spin text-lg" />
                                Posting...
                            </>
                        ) : (
                            <>
                                <FiSend className="text-lg" />
                                Share to Story
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
