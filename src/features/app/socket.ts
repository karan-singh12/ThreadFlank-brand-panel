"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";
import { WS_BASE_URL } from "@/lib/api/config";
import { useAuth } from "@/features/auth/AuthProvider";

// One app-wide socket for live notifications, GRWM updates and calls.
// (Messages keeps its own connection for chat rooms; the server counts both.)
let shared: { token: string; socket: Socket; refs: number } | null = null;

function acquire(token: string) {
  if (shared && shared.token !== token) {
    shared.socket.disconnect();
    shared = null;
  }
  if (!shared) {
    const socket = io(WS_BASE_URL, { auth: { token }, transports: ["websocket", "polling"], reconnectionAttempts: 10, reconnectionDelay: 2000 });
    shared = { token, socket, refs: 0 };
  }
  shared.refs += 1;
  return shared.socket;
}

function release(socket: Socket) {
  if (!shared || shared.socket !== socket) return;
  shared.refs -= 1;
  if (shared.refs <= 0) {
    socket.disconnect();
    shared = null;
  }
}

/** The shared socket for the signed-in user (null while signed out). */
export function useAppSocket() {
  const { token } = useAuth();
  // Subscribing holds a reference to the socket; React re-reads the snapshot right after.
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!token) return () => undefined;
      const socket = acquire(token);
      onChange();
      return () => release(socket);
    },
    [token]
  );
  return useSyncExternalStore(
    subscribe,
    () => (token && shared?.token === token ? shared.socket : null),
    () => null
  );
}

/** Subscribes to one server event on the shared socket. */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const socket = useAppSocket();
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!socket) return;
    const listener = (payload: T) => ref.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
