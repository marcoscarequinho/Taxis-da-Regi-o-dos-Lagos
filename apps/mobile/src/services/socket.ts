import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../config";

let socket: Socket | null = null;

export function connectSocket(accessToken: string): Socket {
  if (socket?.connected) return socket;

  socket = io(`${SOCKET_URL}/realtime`, {
    auth: { token: accessToken },
    transports: ["websocket"],
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
