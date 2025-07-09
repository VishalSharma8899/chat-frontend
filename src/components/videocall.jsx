 

// import React, { useEffect, useRef, useState } from "react";
// import { io } from "socket.io-client";

// const formatTime = (seconds) => {
//   const mins = Math.floor(seconds / 60)
//     .toString()
//     .padStart(2, "0");
//   const secs = (seconds % 60).toString().padStart(2, "0");
//   return `${mins}:${secs}`;
// };

// const VideoCall = ({ currentUserId, targetUserId, token }) => {
//   const peerRef = useRef(null);
//   const socketRef = useRef(null);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const mediaStreamRef = useRef(null);
//   const mediaReadyRef = useRef(false);
//   const timerIntervalRef = useRef(null);

//   const [callStarted, setCallStarted] = useState(false);
//   const [elapsedTime, setElapsedTime] = useState(0);

//   useEffect(() => {
//     let isMounted = true;

//     const socket = io("${baseUrl}", {
//       auth: { token },
//     });
//     socketRef.current = socket;

//     const peer = new RTCPeerConnection({
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     });
//     peerRef.current = peer;

//     // Get local media
//     navigator.mediaDevices
//       .getUserMedia({ video: true, audio: true })
//       .then((stream) => {
//         if (!isMounted) {
//           console.warn("⚠️ Component unmounted before setting stream.");
//           stream.getTracks().forEach((t) => t.stop());
//           return;
//         }

//         if (!stream || stream.getTracks().length === 0) {
//           console.error("❌ No media tracks found or component unmounted.");
//           return;
//         }

//         mediaStreamRef.current = stream;
//         mediaReadyRef.current = true;

//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = stream;
//         }

//         stream.getTracks().forEach((track) => {
//           try {
//             peer.addTrack(track, stream);
//           } catch (err) {
//             console.warn("❌ addTrack failed:", err);
//           }
//         });
//       })
//       .catch((err) => {
//         console.error("❌ Error accessing camera/mic:", err);
//       });

//     // ICE candidate handling
//     peer.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("iceCandidate", {
//           to: targetUserId,
//           candidate: event.candidate,
//         });
//       }
//     };

//     socket.on("iceCandidate", ({ candidate }) => {
//       if (peer.signalingState !== "closed") {
//         peer
//           .addIceCandidate(new RTCIceCandidate(candidate))
//           .catch((e) => console.warn("❌ ICE add failed", e));
//       }
//     });

//     // Remote track setup
//     peer.ontrack = (event) => {
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//       }
//     };

//     // Receiving call
//     socket.on("callIncoming", async ({ from, offer }) => {
//       console.log("📞 Incoming video call...");
//       while (!mediaReadyRef.current) {
//         await new Promise((resolve) => setTimeout(resolve, 100));
//       }

//       if (peer.signalingState === "closed") return;

//       await peer.setRemoteDescription(new RTCSessionDescription(offer));
//       const answer = await peer.createAnswer();
//       await peer.setLocalDescription(answer);

//       socket.emit("answerCall", {
//         to: from._id,
//         answer,
//       });

//       startTimer();
//     });

//     // Receiving answer
//     socket.on("callAnswered", async ({ answer }) => {
//       if (peer.signalingState === "closed") return;
//       await peer.setRemoteDescription(new RTCSessionDescription(answer));
//       console.log("✅ Video call connected");
//       startTimer();
//     });

//     // Outgoing call logic
//     const isCaller = currentUserId !== targetUserId;

//     const initiateCall = async () => {
//       while (!mediaReadyRef.current) {
//         await new Promise((resolve) => setTimeout(resolve, 100));
//       }

//       if (peer.signalingState === "closed") return;

//       const offer = await peer.createOffer();
//       await peer.setLocalDescription(offer);

//       socket.emit("callUser", {
//         to: targetUserId,
//         offer,
//         type: "video",
//       });

//       console.log("📤 Calling peer...");
//     };

//     if (isCaller) {
//       initiateCall();
//     }

//     // Cleanup
//     return () => {
//       isMounted = false;
//       if (peer.signalingState !== "closed") {
//         peer.close();
//       }
//       socket.disconnect();
//       mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
//       stopTimer();
//     };
//   }, [currentUserId, targetUserId, token]);

//   const startTimer = () => {
//     if (!callStarted) {
//       setCallStarted(true);
//       timerIntervalRef.current = setInterval(() => {
//         setElapsedTime((prev) => prev + 1);
//       }, 1000);
//     }
//   };

//   const stopTimer = () => {
//     clearInterval(timerIntervalRef.current);
//     timerIntervalRef.current = null;
//     setCallStarted(false);
//     setElapsedTime(0);
//   };

//   return (
//     <div style={styles.container}>
//       <h3 style={styles.heading}>📹 Video Call</h3>
//       <video
//         ref={localVideoRef}
//         autoPlay
//         muted
//         playsInline
//         style={styles.video}
//       />
//       <video ref={remoteVideoRef} autoPlay playsInline style={styles.video} />
//       {callStarted && (
//         <div style={styles.timer}>⏱️ Call Time: {formatTime(elapsedTime)}</div>
//       )}
//     </div>
//   );
// };

// export default VideoCall;

// const styles = {
//   container: {
//     textAlign: "center",
//     backgroundColor: "#f8f8f8",
//     padding: "20px",
//     borderRadius: "12px",
//     boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
//     maxWidth: "500px",
//     margin: "30px auto",
//     fontFamily: "Arial, sans-serif",
//   },
//   heading: {
//     fontSize: "22px",
//     color: "#333",
//     marginBottom: "16px",
//   },
//   video: {
//     width: "220px",
//     height: "160px",
//     margin: "10px",
//     backgroundColor: "#000",
//     borderRadius: "10px",
//     objectFit: "cover",
//   },
//   timer: {
//     fontSize: "18px",
//     color: "#555",
//     marginTop: "10px",
//   },
// };


import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const VideoCall = ({ currentUserId, targetUserId, token }) => {
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaReadyRef = useRef(false);
  const timerIntervalRef = useRef(null);

  const [callStarted, setCallStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [micOn, setMicOn] = useState(true); // 🎤 Mic toggle state
const baseUrl = import.meta.env.VITE_API_BASE_URL;
  useEffect(() => {
    let isMounted = true;

    const socket = io("${baseUrl}", {
      auth: { token },
    });
    socketRef.current = socket;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerRef.current = peer;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (!stream || stream.getTracks().length === 0) {
          console.error("❌ No media tracks found or component unmounted.");
          return;
        }

        mediaStreamRef.current = stream;
        mediaReadyRef.current = true;

        localVideoRef.current.srcObject = stream;

        stream.getTracks().forEach((track) => {
          try {
            peer.addTrack(track, stream);
          } catch (err) {
            console.warn("❌ addTrack failed:", err);
          }
        });
      })
      .catch((err) => {
        console.error("❌ Error accessing camera/mic:", err);
      });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          to: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    socket.on("iceCandidate", ({ candidate }) => {
      if (peer.signalingState !== "closed") {
        peer.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) =>
          console.warn("❌ ICE add failed", e)
        );
      }
    });

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    socket.on("callIncoming", async ({ from, offer }) => {
      console.log("📞 Incoming video call...");
      while (!mediaReadyRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (peer.signalingState === "closed") return;

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answerCall", {
        to: from._id,
        answer,
      });

      startTimer();
    });

    socket.on("callAnswered", async ({ answer }) => {
      if (peer.signalingState === "closed") return;
      await peer.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("✅ Video call connected");
      startTimer();
    });

    const isCaller = currentUserId !== targetUserId;

    const initiateCall = async () => {
      while (!mediaReadyRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (peer.signalingState === "closed") return;

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("callUser", {
        to: targetUserId,
        offer,
        type: "video",
      });

      console.log("📤 Calling peer...");
    };

    if (isCaller) {
      initiateCall();
    }

    return () => {
      isMounted = false;
      if (peer.signalingState !== "closed") {
        peer.close();
      }
      socket.disconnect();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      stopTimer();
    };
  }, [currentUserId, targetUserId, token]);

  // 🔁 Timer functions
  const startTimer = () => {
    if (!callStarted) {
      setCallStarted(true);
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopTimer = () => {
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    setCallStarted(false);
    setElapsedTime(0);
  };

  // 🎤 Mic toggle handler
  const toggleMic = () => {
    const audioTrack = mediaStreamRef.current
      ?.getAudioTracks()
      ?.find((track) => track.kind === "audio");

    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>📹 Video Call</h3>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={styles.video}
      />
      <video ref={remoteVideoRef} autoPlay playsInline style={styles.video} />
      {callStarted && (
        <>
          <div style={styles.timer}>⏱️ Call Time: {formatTime(elapsedTime)}</div>
          <button onClick={toggleMic} style={styles.button}>
            {micOn ? "🎤 Mic On (Click to Mute)" : "🔇 Mic Off (Click to Unmute)"}
          </button>
        </>
      )}
    </div>
  );
};

export default VideoCall;

// 🎨 Styles
const styles = {
  container: {
    textAlign: "center",
    backgroundColor: "#f8f8f8",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    maxWidth: "500px",
    margin: "30px auto",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    fontSize: "22px",
    color: "#333",
    marginBottom: "16px",
  },
  video: {
    width: "220px",
    height: "160px",
    margin: "10px",
    backgroundColor: "#000",
    borderRadius: "10px",
    objectFit: "cover",
  },
  timer: {
    fontSize: "18px",
    color: "#555",
    marginTop: "10px",
  },
  button: {
    marginTop: "12px",
    padding: "8px 16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
