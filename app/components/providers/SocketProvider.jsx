'use client';
import { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FiPhone, FiPhoneOff } from 'react-icons/fi';
import { useSocket } from '@/lib/socket';
import { useWebRTC } from '@/hooks/useWebRTC';
import IncomingCallModal from '@/app/components/user/IncomingCallModal';
import VideoCallModal from '@/app/components/user/VideoCallModal';

const SocketContext = createContext(null);

export const useSocketContext = () => useContext(SocketContext);

export default function SocketProvider({ children }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { socket, isConnected } = useSocket(userId);

  const webRTC = useWebRTC(socket, null);

  return (
    <SocketContext.Provider value={{ socket, isConnected, ...webRTC }}>
      {children}
      
      {/* Global Calling state - show overlay while waiting for answer */}
      {webRTC.isCalling && !webRTC.isInCall && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6"
          >
            <FiPhone className="w-10 h-10 text-white" />
          </motion.div>
          <p className="text-white text-xl font-semibold mb-2">Calling...</p>
          <p className="text-slate-400 text-sm mb-8">Waiting for {webRTC.targetUser?.name || 'friend'} to answer</p>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={webRTC.hangUp}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg shadow-red-500/30"
          >
            <FiPhoneOff className="w-6 h-6" />
          </motion.button>
        </div>
      )}

      {/* Active call */}
      {webRTC.isInCall && (
        <VideoCallModal
          localStream={webRTC.localStream}
          remoteStream={webRTC.remoteStream}
          onHangUp={webRTC.hangUp}
        />
      )}

      {/* Incoming call */}
      {webRTC.isReceivingCall && (
        <IncomingCallModal
          callerInfo={webRTC.callerInfo}
          onAccept={webRTC.acceptCall}
          onReject={webRTC.rejectCall}
        />
      )}
    </SocketContext.Provider>
  );
}
