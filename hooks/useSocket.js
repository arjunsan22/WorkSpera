// hooks/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;

    console.log('useSocket: Attempting to connect for userId:', userId);

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
      path: '/socket.io/', // Use default path for standalone server
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 60000,
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('useSocket: Connected to server with ID:', socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
      if (userId) {
        socketInstance.emit('join-room', userId);
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('useSocket: Connection Error:', error);
      setIsConnected(false);
      setConnectionError(error.message);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('useSocket: Disconnected from server. Reason:', reason);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      console.log('useSocket: Cleaning up socket connection for userId:', userId);
      socketInstance.close();
    };
  }, [userId]);

  return { socket, isConnected, connectionError };
};