// hooks/useWebRTC.js
import { useState, useEffect, useRef, useCallback } from "react";

export const useWebRTC = (socket, remoteUserId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callerSocketId, setCallerSocketId] = useState(null);

  const peerConnection = useRef(null);
  const pendingOffer = useRef(null);

  // Helper: get user media on demand (only when a call starts)
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
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
        return audioOnlyStream;
      } catch (audioErr) {
        console.error("Audio also unavailable:", audioErr.name);
        return null;
      }
    }
  }, []);

  // Helper: stop all tracks in the local stream
  const stopLocalStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      // Stop any active media tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle WebRTC signaling via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      const { from, offer } = data;
      setIsReceivingCall(true);
      setCallerSocketId(from);
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
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      setRemoteStream(null);
      setIsCalling(false);
      setIsReceivingCall(false);
      setIsInCall(false);
      // Stop the local stream when call ends
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
    };

    // Attach listeners
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
    };
  }, [socket, localStream]);

  // Initiate a call — acquires media first, then creates the offer
  const callUser = useCallback(
    async (userId) => {
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

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerConnection.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            to: userId,
            candidate: event.candidate,
          });
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call-user", { to: userId, offer: pc.localDescription });
        setIsInCall(true);
      } catch (err) {
        console.error("Error creating offer:", err);
        setIsCalling(false);
      }
    },
    [socket, getLocalStream]
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

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current = pc;

    // Add local stream tracks if available
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: from,
          candidate: event.candidate,
        });
      }
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer-call", { to: from, answer: pc.localDescription });

      setIsReceivingCall(false);
      setIsInCall(true);
      pendingOffer.current = null;
    } catch (err) {
      console.error("Error accepting call:", err);
    }
  }, [socket, getLocalStream]);

  // End call
  const hangUp = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (socket) {
      const to = isReceivingCall ? callerSocketId : socket.id;
      socket.emit("hang-up", { to });
    }

    // Stop local media tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);
    setIsCalling(false);
    setIsReceivingCall(false);
    setIsInCall(false);
    pendingOffer.current = null;
  }, [socket, isReceivingCall, callerSocketId, localStream]);

  return {
    localStream,
    remoteStream,
    isCalling,
    isReceivingCall,
    isInCall,
    callUser,
    hangUp,
    acceptCall,
  };
};
