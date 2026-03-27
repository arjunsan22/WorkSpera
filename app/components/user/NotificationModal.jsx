import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiRefreshCw, FiX, FiInfo } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function NotificationModal({ showNotifications, setShowNotifications, notifications, setNotifications, setUnreadCount }) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {showNotifications && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNotifications(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <FiBell className="w-5 h-5 text-indigo-400" />
                Notifications
              </h2>
              <div className="flex gap-2">
                {/* Mark all as read */}
                <button
                  onClick={async () => {
                    try {
                      await fetch('/api/user/notifications/read', { method: 'POST' });
                      // Optimistically mark all as read
                      setNotifications(notifs =>
                        notifs.map(n => ({ ...n, read: true }))
                      );
                      setUnreadCount(0);
                    } catch (err) {
                      console.error('Failed to mark as read');
                    }
                  }}
                  className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  Mark all read
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-700/50 hover:text-slate-300"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <FiBell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">No notifications</p>
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`p-4 rounded-xl mb-2.5 transition-colors ${notif.read
                      ? 'bg-slate-900/30 hover:bg-slate-900/50'
                      : 'bg-indigo-900/20 border-l-4 border-indigo-500 hover:bg-indigo-900/30'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {notif.sender?.profileImage ? (
                        <img
                          src={notif.sender.profileImage}
                          alt={notif.sender.name}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                          {notif.sender?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200">
                          <span className="font-semibold">{notif.sender?.name || 'Someone'}</span>{' '}
                          {notif.type === 'follow' && 'followed you'}
                          {notif.type === 'like' && 'liked your post'}
                          {(notif.type === 'connection_request' || notif.type === 'connect') && '(connects) he wants to help with your work'}
                        </p>
                        
                        {/* Action Buttons based on notification type */}
                        {notif.type === 'follow' || notif.type === 'message' || notif.type === 'connect' || notif.type === 'connection_request' ? (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/chat/${notif.sender._id}`);
                                setShowNotifications(false);
                              }}
                              className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow shadow-indigo-500/20 cursor-pointer"
                            >
                              Message
                            </button>
                            
                            {/* Connect info button if it's a connect request */}
                            {(notif.type === 'connection_request' || notif.type === 'connect') && notif.post && (
                              <button
                                className="group relative px-3 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-lg hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <FiInfo className="w-3.5 h-3.5" />
                                Work Info
                                
                                {/* Hover Tooltip for Work Info */}
                                <div className="absolute top-full left-0 mt-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl">
                                  {notif.post.image && notif.post.image[0] && (
                                    <img src={notif.post.image[0]} alt="Work" className="w-full h-24 object-cover rounded-md mb-2" />
                                  )}
                                  <p className="text-xs text-slate-300 line-clamp-2">{notif.post.caption || 'Work details'}</p>
                                </div>
                              </button>
                            )}
                          </div>
                        ) : null}

                        {notif.message && (
                          <p className="text-xs text-slate-400 mt-2 italic border-l-2 border-slate-600 pl-2 line-clamp-2">
                            "{notif.message}"
                          </p>
                        )}
                        
                        {/* Display post thumbnail for likes */}
                        {notif.type === 'like' && notif.post && notif.post.image && notif.post.image.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            <img src={notif.post.image[0]} alt="Post" className="w-12 h-12 object-cover rounded-lg border border-slate-700/50" />
                          </div>
                        )}
                        <p className="text-xs text-slate-600 mt-1">
                          {new Date(notif.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
