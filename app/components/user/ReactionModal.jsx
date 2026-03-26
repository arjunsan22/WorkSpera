import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import Link from 'next/link';

export default function ReactionModal({ isOpen, onClose, likes }) {
  if (!isOpen) return null;

  // Reaction icon mapping
  const reactionIcons = {
    like: '👍',
    love: '❤️',
    celebrate: '👏',
    insightful: '💡',
    support: '🤝',
    funny: '😂',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-3">
            <h2 className="text-xl font-bold text-white">Reactions ({likes?.length || 0})</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {likes && likes.length > 0 ? (
              likes.map((like, idx) => {
                // Ensure like.user is populated object
                const user = like.user;
                if (!user || typeof user !== 'object') return null;

                const rType = like.reactionType || 'like';

                return (
                  <div key={idx} className="flex items-center justify-between group">
                    <Link
                      href={`/profile/${user._id}`}
                      className="flex items-center gap-3 w-full"
                      onClick={onClose}
                    >
                      <div className="relative">
                        <img
                          src={user.profileImage || '/default-avatar.png'}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-0.5 text-xs shadow-md border border-slate-700">
                          {reactionIcons[rType] || reactionIcons['like']}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-200 text-sm font-semibold group-hover:text-indigo-400 transition-colors">
                          {user.name}
                        </p>
                        <p className="text-slate-400 text-xs">@{user.username}</p>
                      </div>
                    </Link>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-slate-500 py-4">No reactions yet.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
