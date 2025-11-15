import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    const socketInstance = io("http://localhost:3000", {
      path: "/api/socket",
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      socketInstance.emit("join-room", userId);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket error:", err);
      setConnectionError(err.message);
    });

    setSocket(socketInstance);

    return () => socketInstance.disconnect();
  }, [userId]);

  return { socket, isConnected, connectionError };
};
