 
import React, { useEffect, useRef, useState } from 'react';
import { getSocket, connectSocket } from './socket';

const VoiceCall = ({ currentUserId, targetUserId, token }) => {
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const pendingCandidatesRef = useRef([]);
  const remoteDescSetRef = useRef(false);

  const [isCalling, setIsCalling] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState("00:00");

  useEffect(() => {
    let timer;
    if (inCall) {
      timer = setInterval(() => {
        const seconds = Math.floor((Date.now() - callStartTime) / 1000);
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        setCallDuration(`${mins}:${secs}`);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [inCall, callStartTime]);

  useEffect(() => {
    let socket = getSocket();
    if (!socket) socket = connectSocket(token);
    if (!socket) return;

    peerRef.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          to: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    peerRef.current.ontrack = (event) => {
      remoteAudioRef.current.srcObject = event.streams[0];
      if (!inCall) {
        setInCall(true);
        setCallStartTime(Date.now());
      }
    };

    socket.on("callIncoming", ({ from, offer }) => {
      if (!inCall && !isCalling) {
        setIncomingCall({ from, offer });
      }
    });

    socket.on("callAnswered", async ({ answer }) => {
      if (!answer) return;
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        remoteDescSetRef.current = true;
        flushPendingCandidates();

        if (!inCall) {
          setInCall(true);
          setCallStartTime(Date.now());
        }
      } catch (err) {
        console.error("Error setting remote description:", err);
      }
    });

    socket.on("iceCandidate", ({ candidate }) => {
      try {
        const ice = new RTCIceCandidate(candidate);
        if (remoteDescSetRef.current) {
          peerRef.current.addIceCandidate(ice).catch(err => console.error("ICE error:", err));
        } else {
          pendingCandidatesRef.current.push(ice);
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    return () => {
      socket.off("callIncoming");
      socket.off("callAnswered");
      socket.off("iceCandidate");
    };
  }, [targetUserId]);

  const flushPendingCandidates = () => {
    pendingCandidatesRef.current.forEach(candidate => {
      peerRef.current.addIceCandidate(candidate).catch(err => console.error("ICE error:", err));
    });
    pendingCandidatesRef.current = [];
  };

  const callUser = async () => {
    const socket = getSocket();
    if (!socket || !targetUserId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));
      localAudioRef.current.srcObject = stream;
      localStreamRef.current = stream;

      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);

      socket.emit("callUser", { to: targetUserId, offer, type: "voice" });
      setIsCalling(true);
    } catch (err) {
      console.error("Call error:", err);
    }
  };

  const acceptCall = async () => {
    const { from, offer } = incomingCall;
    const socket = getSocket();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));
      localAudioRef.current.srcObject = stream;
      localStreamRef.current = stream;

      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      remoteDescSetRef.current = true;
      flushPendingCandidates();

      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);

      socket.emit("answerCall", { to: from._id || from, answer });

      setInCall(true);
      setCallStartTime(Date.now());
      setIncomingCall(null);
    } catch (err) {
      console.error("Accept call error:", err);
    }
  };

  const rejectCall = () => {
    setIncomingCall(null);
  };

  const endCall = () => {
    setIsCalling(false);
    setInCall(false);
    setCallDuration("00:00");

    localStreamRef.current?.getTracks().forEach(track => track.stop());
    remoteAudioRef.current?.srcObject?.getTracks().forEach(track => track.stop());

    peerRef.current?.close();
    peerRef.current = null;

    localAudioRef.current.srcObject = null;
    remoteAudioRef.current.srcObject = null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
      {!inCall && !incomingCall && (
        <button onClick={callUser} disabled={!targetUserId || isCalling}>
          📞 Start Call
        </button>
      )}

      <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />

      {incomingCall && (
        <div style={{
          backgroundColor: "#fff",
          border: "2px solid #ccc",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <h3>📞 Incoming Call</h3>
          <p>From: <b>{incomingCall.from?.username || incomingCall.from?._id || "Unknown"}</b></p>
          <p style={{ color: "green" }}>Ringing...</p>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button onClick={acceptCall} style={{ background: "green", color: "white", padding: "8px 12px", borderRadius: "5px" }}>✅ Accept</button>
            <button onClick={rejectCall} style={{ background: "gray", color: "white", padding: "8px 12px", borderRadius: "5px" }}>❌ Reject</button>
          </div>
        </div>
      )}

      {inCall && (
        <div style={{
          backgroundColor: "#f0f0f0",
          padding: "12px 18px",
          borderRadius: "10px",
          border: "1px solid #bbb",
          textAlign: "center"
        }}>
          <div>⏱ Duration: <b>{callDuration}</b></div>
          <button onClick={endCall} style={{ marginTop: "10px", background: "red", color: "white", padding: "8px 12px", borderRadius: "5px" }}>
            🛑 End Call
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceCall;
