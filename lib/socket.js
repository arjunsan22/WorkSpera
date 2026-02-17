// lib/socket.js
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    console.log("🔌 Attempting to connect to socket at:", SOCKET_SERVER_URL);

    const socketInstance = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,  // Try 10 times
      reconnectionDelay: 2000,    // Wait 2 seconds between tries
      timeout: 60000,             // Wait 60 seconds (important for Render wake-up)
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected! ID:", socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
      socketInstance.emit("join-room", userId);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected. Reason:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
      // If it's a timeout, it's likely just the server waking up
      if (err.message === "timeout") {
        console.warn("⏳ Server is taking long to respond. It might be waking up...");
      }
      setConnectionError(err.message);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, [userId]);

  return { socket, isConnected, connectionError };
};
