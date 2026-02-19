// hooks/useWebRTC.js
import { useState, useEffect, useRef, useCallback } from "react";

export const useWebRTC = (socket, remoteUserId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callerInfo, setCallerInfo] = useState(null); // { socketId, userId, name, profileImage }

  const peerConnection = useRef(null);
  const pendingOffer = useRef(null);
  const remoteUserIdRef = useRef(remoteUserId);
  const localStreamRef = useRef(null);

  // Keep ref in sync
  useEffect(() => {
    remoteUserIdRef.current = remoteUserId;
  }, [remoteUserId]);

  // Helper: get user media on demand (only when a call starts)
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("Camera/mic access denied or unavailable:", err.name, err.message);
      // Try audio-only as fallback
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        setLocalStream(audioOnlyStream);
        localStreamRef.current = audioOnlyStream;
        return audioOnlyStream;
      } catch (audioErr) {
        console.error("Audio also unavailable:", audioErr.name);
        return null;
      }
    }
  }, []);

  // Helper: stop all tracks in the local stream
  const stopLocalStream = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      // Stop any active media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle WebRTC signaling via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      const { from, offer, callerUserId, callerName, callerImage } = data;
      console.log("📞 Incoming call from:", callerName || from);
      setIsReceivingCall(true);
      setCallerInfo({
        socketId: from,
        userId: callerUserId,
        name: callerName || "Someone",
        profileImage: callerImage || null,
      });
      // Store the offer so we can process it when the user accepts
      pendingOffer.current = { from, offer };
    };

    const handleCallAccepted = (data) => {
      const { answer } = data;
      if (!peerConnection.current) {
        console.warn("Received call answer but no peer connection exists");
        return;
      }
      peerConnection.current
        .setRemoteDescription(new RTCSessionDescription(answer))
        .then(() => {
          console.log("✅ Call accepted, remote description set");
          setIsCalling(false);
          setIsInCall(true);
        })
        .catch((err) => {
          console.error("Failed to set remote description:", err);
        });
    };

    const handleIceCandidate = (data) => {
      const { candidate } = data;
      if (!peerConnection.current || !candidate) return;
      peerConnection.current
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch((err) => {
          console.error("Error adding received ICE candidate:", err);
        });
    };

    const handleCallEnded = () => {
      console.log("📞 Call ended by remote");
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      setRemoteStream(null);
      setIsCalling(false);
      setIsReceivingCall(false);
      setIsInCall(false);
      setCallerInfo(null);
      // Stop the local stream when call ends
      stopLocalStream();
    };

    const handleCallRejected = () => {
      console.log("📞 Call rejected by remote");
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      setRemoteStream(null);
      setIsCalling(false);
      setIsReceivingCall(false);
      setIsInCall(false);
      setCallerInfo(null);
      stopLocalStream();
    };

    // Attach listeners
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-rejected", handleCallRejected);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-rejected", handleCallRejected);
    };
  }, [socket, stopLocalStream]);

  // Create a peer connection with proper ICE servers
  const createPeerConnection = useCallback(
    (targetId) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      });

      pc.ontrack = (event) => {
        console.log("🎥 Received remote track:", event.track.kind);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("ice-candidate", {
            to: targetId,
            candidate: event.candidate,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
          console.warn("ICE connection failed/disconnected");
        }
      };

      return pc;
    },
    [socket]
  );

  // Initiate a call — acquires media first, then creates the offer
  // callerName and callerImage are passed so the receiver knows who is calling
  const callUser = useCallback(
    async (userId, callerName, callerImage) => {
      if (!socket) {
        console.warn("Cannot call: missing socket");
        return;
      }

      setIsCalling(true);

      // Acquire media on demand
      const stream = await getLocalStream();
      if (!stream) {
        console.warn("Cannot call: failed to get media stream");
        setIsCalling(false);
        return;
      }

      const pc = createPeerConnection(userId);
      peerConnection.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call-user", {
          to: userId,
          offer: pc.localDescription,
          callerName: callerName || "Someone",
          callerImage: callerImage || null,
        });
        // Don't set isInCall yet — wait for the answer
        console.log("📞 Call offer sent to:", userId);
      } catch (err) {
        console.error("Error creating offer:", err);
        setIsCalling(false);
        stopLocalStream();
      }
    },
    [socket, getLocalStream, createPeerConnection, stopLocalStream]
  );

  // Accept incoming call — acquires media, then processes the stored offer
  const acceptCall = useCallback(async () => {
    if (!socket || !pendingOffer.current) {
      console.warn("Cannot accept call: no pending offer");
      return;
    }

    const { from, offer } = pendingOffer.current;

    // Acquire media on demand
    const stream = await getLocalStream();

    const pc = createPeerConnection(from);
    peerConnection.current = pc;

    // Add local stream tracks if available
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer-call", { to: from, answer: pc.localDescription });

      setIsReceivingCall(false);
      setIsInCall(true);
      pendingOffer.current = null;
      console.log("✅ Call accepted, answer sent to:", from);
    } catch (err) {
      console.error("Error accepting call:", err);
    }
  }, [socket, getLocalStream, createPeerConnection]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (socket && pendingOffer.current) {
      socket.emit("reject-call", { to: pendingOffer.current.from });
    }
    setIsReceivingCall(false);
    setCallerInfo(null);
    pendingOffer.current = null;
  }, [socket]);

  // End call
  const hangUp = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (socket && remoteUserIdRef.current) {
      // Always send hang-up to the remote user's room (userId)
      socket.emit("hang-up", { to: remoteUserIdRef.current });
      // Also send to caller socket ID if we have it
      if (callerInfo?.socketId) {
        socket.emit("hang-up", { to: callerInfo.socketId });
      }
    }

    // Stop local media tracks
    stopLocalStream();

    setRemoteStream(null);
    setIsCalling(false);
    setIsReceivingCall(false);
    setIsInCall(false);
    setCallerInfo(null);
    pendingOffer.current = null;
  }, [socket, callerInfo, stopLocalStream]);

  return {
    localStream,
    remoteStream,
    isCalling,
    isReceivingCall,
    isInCall,
    callerInfo,
    callUser,
    hangUp,
    acceptCall,
    rejectCall,
  };
};
