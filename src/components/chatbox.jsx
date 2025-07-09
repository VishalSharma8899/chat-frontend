import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import CallPopup from "./CallPopup";

const ChatBox = ({ token }) => {
  const currentUser = jwtDecode(token);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const [socket, setSocket] = useState(null);
  const [callType, setCallType] = useState(null);
  const [callState, setCallState] = useState(null);
  const [callFrom, setCallFrom] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:4000/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const others = res.data.users.filter(
          (u) => u._id !== currentUser.userid
        );
        setUsers(others);
      });
  }, [token]);

  useEffect(() => {
    const s = io("http://localhost:4000", { auth: { token } });
    setSocket(s);

    s.on("connect", () => console.log(" Socket connected:", s.id));


    s.on("receivePrivateMessage", (data) =>
      setMessages((prev) => [...prev, data])
    );

    s.on("messageEdited", (updatedMsg) =>
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMsg._id ? updatedMsg : msg))
      )
    );
    s.on("messageDeleted", ({ messageId }) =>
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId))
    );

    

    s.on("callIncoming", ({ from, type }) => {
  console.log(" Incoming call from", from?.username, "Type:", type);
  setCallFrom(from);
  setCallType(type);
  setCallState("incoming");
});


    s.on("callAnswered", () => {
      console.log(" Call answered");
      setCallType("voice");
      setCallState("connected");
    });

    return () => s.disconnect();
  }, [token]);

  useEffect(() => {
    if (!selectedUser) return;
    axios
      .get(`http://localhost:4000/api/get/${selectedUser._id}`, {
        headers: { Authorization: token },
      })
      .then((res) => setMessages(res.data));
  }, [selectedUser, token]);

  const sendMessage = () => {
    if (!message || !selectedUser || !socket) return;
    socket.emit("privateMessage", { to: selectedUser._id, message });
    setMessage("");
  };

  

  const startCall = (type) => {
  if (!selectedUser || !socket) {
    console.warn(" Cannot start call — missing selectedUser or socket");
    return;
  }

  console.log(` Starting ${type} call with`, selectedUser.username);
  setCallType(type);
  setCallState("ringing");

  socket.emit("callUser", {
    to: selectedUser._id,
    type: type,
  });
};

  const handleEdit = (msg) => {
    const newContent = prompt("Edit your message:", msg.text);
    if (newContent && newContent !== msg.text) {
      socket.emit("editMessage", { messageId: msg._id, newContent });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      socket.emit("deleteMessage", { messageId: id });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const visibleMessages = messages.filter(
    (msg) =>
      (msg.sender === currentUser.userid &&
        msg.receiver === selectedUser?._id) ||
      (msg.sender === selectedUser?._id && msg.receiver === currentUser.userid)
  );

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h3>Users</h3>
        {users.map((u) => (
          <div
            key={u._id}
            style={styles.userItem}
            onClick={() => setSelectedUser(u)}
          >
            {u.username}
          </div>
        ))}
        <button style={styles.logoutBtn} onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      <div style={styles.chatWindow}>
        <h3>
          {selectedUser
            ? `Chat with ${selectedUser.username}`
            : "Select a user"}
        </h3>
        <div style={styles.chatHistory}>
          {visibleMessages.map((msg, i) => (
            <div key={msg._id || i} style={styles.messageLine}>
              <p>
                <strong
                  style={{
                    color: msg.sender === currentUser.userid ? "blue" : "green",
                  }}
                >
                  {msg.sender === currentUser.userid ? "You" : "Them"}:
                </strong>{" "}
                {msg.text}
                {msg.edited && <em> (edited)</em>}
              </p>
              {msg.sender === currentUser.userid && (
                <div>
                  <button onClick={() => handleEdit(msg)}>Edit</button>
                  <button onClick={() => handleDelete(msg._id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedUser && (
          <div style={styles.chatInput}>
            <input
              style={styles.input}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button style={styles.button} onClick={sendMessage}>
              Send
            </button>
            <button style={styles.callBtn} onClick={() => startCall("voice")}>
              🔊 Voice
            </button>
            <button style={styles.callBtn} onClick={() => startCall("video")}>
              🎥 Video
            </button>
          </div>
        )}
      </div>

      <CallPopup
        socket={socket}
        currentUserId={currentUser.userid}
        targetUser={selectedUser}
        callType={callType}
        callState={callState}
        setCallState={setCallState}
        callFrom={callFrom}
      />
    </div>
  );
};

export default ChatBox;

// 💅 Styles
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    background: "#081d33",
  },
  sidebar: {
    width: "260px",
    padding: "20px",
    borderRight: "1px solid #555",
    color: "#fff",
  },
  userItem: {
    padding: "8px",
    marginBottom: "8px",
    background: "#fff",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#000",
  },
  logoutBtn: {
    marginTop: "20px",
    padding: "8px 12px",
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  chatWindow: {
    flex: 1,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    color: "#fff",
  },
  chatHistory: {
    flex: 1,
    padding: "10px",
    background: "#fff",
    borderRadius: "4px",
    overflowY: "auto",
    color: "#000",
    marginBottom: "10px",
  },
  chatInput: { display: "flex", gap: "10px", marginTop: "10px" },
  input: { flex: 1, padding: "8px" },
  button: {
    padding: "8px 12px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
  },
  callBtn: {
    padding: "8px 12px",
    background: "#ffc107",
    color: "#000",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  messageLine: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
  },
};
