// hooks/useWebRTC.js
import { useState, useEffect, useRef } from "react";

export const useWebRTC = (socket, localStream, remoteUserId) => {
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [isInCall, setIsInCall] = useState(false); // ✅ New: tracks if user is actively in a call
  const [callerSocketId, setCallerSocketId] = useState(null);

  const peerConnection = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
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

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerConnection.current = pc;

      // Add local stream (your camera/mic)
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // Set remote description (caller's offer)
      pc.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
          // Create answer
          return pc.createAnswer();
        })
        .then((answer) => {
          return pc.setLocalDescription(answer);
        })
        .then(() => {
          const answer = pc.localDescription;
          socket.emit("answer-call", { to: from, answer });
        })
        .catch((err) => {
          console.error("Error handling incoming call:", err);
        });

      // Handle remote stream (caller's video/audio)
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
          setIsInCall(true); // ✅ Caller: now in call
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
      setIsInCall(false); // ✅ Exit call
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

  // Initiate a call
  const callUser = (userId) => {
    if (!socket || !localStream) {
      console.warn("Cannot call: missing socket or localStream");
      return;
    }

    setIsCalling(true);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current = pc;

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
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

    pc.createOffer()
      .then((offer) => {
        return pc.setLocalDescription(offer);
      })
      .then(() => {
        const offer = pc.localDescription;
        socket.emit("call-user", { to: userId, offer });
        setIsInCall(true); // ✅ Caller enters call UI immediately
      })
      .catch((err) => {
        console.error("Error creating offer:", err);
        setIsCalling(false);
      });
  };

  // End call
  const hangUp = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (socket) {
      const to = isReceivingCall ? callerSocketId : socket.id;
      socket.emit("hang-up", { to });
    }

    setRemoteStream(null);
    setIsCalling(false);
    setIsReceivingCall(false);
    setIsInCall(false);
  };

  // Accept incoming call (hide modal only)
  const acceptCall = () => {
    setIsReceivingCall(false);
    setIsInCall(true); // ✅ Receiver also enters call
  };

  return {
    remoteStream,
    isCalling,
    isReceivingCall,
    isInCall, // ✅ Now exposed
    callUser,
    hangUp,
    acceptCall,
  };
};
