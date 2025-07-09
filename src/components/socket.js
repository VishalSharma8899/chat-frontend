 
import { io } from "socket.io-client";
const baseUrl = import.meta.env.VITE_API_BASE_URL;
let socket;

export const connectSocket = (token) => {
  socket = io(`${baseUrl}`, {
    auth: {
      token,
    },
  });

  return socket;
};

export const getSocket = () => socket;
