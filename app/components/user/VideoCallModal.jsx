// components/user/VideoCallModal.jsx
"use client";
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiPhoneOff,
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
} from "react-icons/fi";

export default function VideoCallModal({ localStream, remoteStream, onHangUp }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format duration as mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-950 flex flex-col"
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/80 text-sm font-medium">
            {formatDuration(callDuration)}
          </span>
        </div>
        <span className="text-white/60 text-xs">Video Call</span>
      </div>

      {/* Video Grid */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 p-2 pt-14 pb-28">
        {/* Local Video */}
        <div className="relative flex-1 bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/30">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <FiVideoOff className="w-8 h-8 text-white" />
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <p className="text-white text-xs font-medium">You</p>
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative flex-1 bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/30">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center"
              >
                <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </motion.div>
              <p className="text-slate-400 text-sm font-medium">
                Connecting to friend...
              </p>
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <p className="text-white text-xs font-medium">Friend</p>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-8">
        <div className="flex items-center justify-center gap-5">
          {/* Mute */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMuted
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
              }`}
          >
            {isMuted ? (
              <FiMicOff className="w-5 h-5" />
            ) : (
              <FiMic className="w-5 h-5" />
            )}
          </motion.button>

          {/* Video toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isVideoOff
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
              }`}
          >
            {isVideoOff ? (
              <FiVideoOff className="w-5 h-5" />
            ) : (
              <FiVideo className="w-5 h-5" />
            )}
          </motion.button>

          {/* Hang up */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onHangUp}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-shadow"
          >
            <FiPhoneOff className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}