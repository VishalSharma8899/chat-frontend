import React, { useState } from "react";
import VoiceCall from "./voicecall";
import VideoCall from "./videocall";

const CallPopup = ({
  socket,
  currentUserId,
  targetUser,
  callFrom,
  callType,
  callState,
  setCallState,
}) => {
  const [showVoiceCall, setShowVoiceCall] = useState(false);

  const user = callFrom || targetUser;

  const handleAccept = () => {
    setCallState("connected");
    setShowVoiceCall(true);
  };

  const handleReject = () => {
    socket.emit("callRejected", { to: callFrom?._id });
    setCallState(null);
  };

  if (!callState) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20%",
        left: "50%",
        transform: "translate(-50%, -20%)",
        background: "linear-gradient(135deg, #e0f7fa, #ffffff)",
        padding: "25px 30px",
        border: "2px solid #00acc1",
        borderRadius: "12px",
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
        textAlign: "center",
        zIndex: 1000,
        minWidth: "320px",
      }}
    >
      {callState === "ringing" && (
        <div
          style={{ fontSize: "18px", marginBottom: "20px", color: "#00796b" }}
        >
          📞 Calling <strong>{user?.username}</strong>...
        </div>
      )}

      {callState === "incoming" && (
        <>
          <div
            style={{ fontSize: "18px", marginBottom: "20px", color: "#00796b" }}
          >
            📞 Incoming {callType} call from <strong>{user?.username}</strong>
          </div>
          <div
            style={{ display: "flex", justifyContent: "center", gap: "15px" }}
          >
            <button
              onClick={handleAccept}
              style={{
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ✅ Accept
            </button>
            <button
              onClick={handleReject}
              style={{
                padding: "10px 20px",
                backgroundColor: "#F44336",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ❌ Reject
            </button>
          </div>
        </>
      )}

      

        {callState === "connected" && showVoiceCall && (
  callType === "voice" ? (
    <VoiceCall
      currentUserId={currentUserId}
      targetUserId={(callFrom || targetUser)?._id}
      token={socket.auth.token}
      isCaller={!callFrom}
    />
  ) : (
    <VideoCall
   currentUserId={currentUserId}
  targetUserId={(callFrom || targetUser)?._id}
  token={socket.auth.token}
  isCaller={!callFrom}
/>

  )
)}
    </div>
  );
};

export default CallPopup;
