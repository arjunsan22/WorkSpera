// components/user/IncomingCallModal.jsx
"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FiPhone, FiPhoneOff } from "react-icons/fi";

export default function IncomingCallModal({ callerInfo, onAccept, onReject }) {
  const audioRef = useRef(null);

  // Play ringtone when modal appears
  useEffect(() => {
    // Create a ringtone using Web Audio API
    let audioContext;
    let intervalId;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      const playRingtone = () => {
        // Create a pleasant two-tone ring
        const now = audioContext.currentTime;

        // First tone (higher pitch)
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523.25, now); // C5
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain1.gain.linearRampToValueAtTime(0.15, now + 0.3);
        gain1.gain.linearRampToValueAtTime(0, now + 0.5);
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.start(now);
        osc1.stop(now + 0.5);

        // Second tone (lower pitch)
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
        gain2.gain.setValueAtTime(0, now + 0.15);
        gain2.gain.linearRampToValueAtTime(0.3, now + 0.2);
        gain2.gain.linearRampToValueAtTime(0.15, now + 0.45);
        gain2.gain.linearRampToValueAtTime(0, now + 0.65);
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.65);

        // Third tone (higher)
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.type = "sine";
        osc3.frequency.setValueAtTime(783.99, now + 0.3); // G5
        gain3.gain.setValueAtTime(0, now + 0.3);
        gain3.gain.linearRampToValueAtTime(0.25, now + 0.35);
        gain3.gain.linearRampToValueAtTime(0.1, now + 0.6);
        gain3.gain.linearRampToValueAtTime(0, now + 0.8);
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.start(now + 0.3);
        osc3.stop(now + 0.8);
      };

      // Play immediately and then repeat
      playRingtone();
      intervalId = setInterval(playRingtone, 2000);
    } catch (e) {
      console.warn("Could not create ringtone:", e);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch(() => { });
      }
    };
  }, []);

  const callerName = callerInfo?.name || "Someone";
  const callerImage = callerInfo?.profileImage;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop with blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      {/* Animated call card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div className="bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl shadow-indigo-500/10 overflow-hidden">
          {/* Animated rings behind avatar */}
          <div className="relative flex flex-col items-center pt-10 pb-6">
            {/* Pulsing rings */}
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 w-24 h-24 rounded-full bg-indigo-500/20 -m-2"
              />
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                className="absolute inset-0 w-24 h-24 rounded-full bg-purple-500/15 -m-2"
              />
              <motion.div
                animate={{ scale: [1, 2.2, 1], opacity: [0.15, 0, 0.15] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                className="absolute inset-0 w-24 h-24 rounded-full bg-indigo-400/10 -m-2"
              />

              {/* Caller Avatar */}
              {callerImage ? (
                <img
                  src={callerImage}
                  alt={callerName}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-500/40 shadow-lg relative z-10"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-indigo-500/40 shadow-lg relative z-10">
                  {callerName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Caller info */}
            <h3 className="mt-5 text-xl font-bold text-white">{callerName}</h3>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm text-indigo-300 mt-1 flex items-center gap-2"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Incoming video call...
            </motion.p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-8 pb-10 pt-2">
            {/* Reject */}
            <div className="flex flex-col items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onReject}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-shadow"
              >
                <FiPhoneOff className="w-7 h-7" />
              </motion.button>
              <span className="text-xs text-slate-400 font-medium">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                onClick={onAccept}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-shadow"
              >
                <FiPhone className="w-7 h-7" />
              </motion.button>
              <span className="text-xs text-slate-400 font-medium">Accept</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}