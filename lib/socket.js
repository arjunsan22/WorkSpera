// lib/socket.js
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Socket.IO server URL:
// - In production: Your Render/Railway deployed socket server URL
// - In development: http://localhost:4000 (standalone socket server)
const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    const socketInstance = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
      socketInstance.emit("join-room", userId);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setConnectionError(err.message);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => socketInstance.disconnect();
  }, [userId]);

  return { socket, isConnected, connectionError };
};
