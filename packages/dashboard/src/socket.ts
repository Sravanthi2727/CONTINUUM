import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.on("connect", () => console.log("🔌 Socket connected:", socket?.id));
    socket.on("disconnect", () => console.log("🔌 Socket disconnected"));
  }
  return socket;
}
