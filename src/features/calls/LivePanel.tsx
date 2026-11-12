"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Radio, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Photo } from "@/components/ui/Photo";
import { useAppSocket } from "@/features/app/socket";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";

type Stream = { broadcasterId: string; username: string; avatar: string | null; title: string; startedAt: string; viewers: string[] };

const ICE: RTCConfiguration = { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] };

/**
 * Live "outfit check" broadcasts over the backend's live-stream signalling:
 * the broadcaster opens one peer connection per viewer (liveViewerJoined →
 * liveOffer → liveAnswer, liveIceCandidate both ways).
 */
export function LivePanel() {
  const { user } = useAuth();
  const socket = useAppSocket();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [broadcasting, setBroadcasting] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [watching, setWatching] = useState<Stream | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [setup, setSetup] = useState(false);

  const localStream = useRef<MediaStream | null>(null);
  const broadcastPeers = useRef(new Map<string, RTCPeerConnection>());
  const viewerPeer = useRef<RTCPeerConnection | null>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  const stopBroadcast = useCallback(() => {
    socket?.emit("stopLiveStream");
    broadcastPeers.current.forEach((pc) => pc.close());
    broadcastPeers.current.clear();
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    setBroadcasting(false);
    setViewers(0);
  }, [socket]);

  const stopWatching = useCallback(() => {
    if (watching) socket?.emit("leaveLiveStream", { broadcasterId: watching.broadcasterId });
    viewerPeer.current?.close();
    viewerPeer.current = null;
    setWatching(null);
  }, [socket, watching]);

  useEffect(() => {
    if (!socket) return;
    const onList = (list: Stream[]) => setStreams(list.filter((s) => s.broadcasterId !== user?.id));
    const onStarted = (s: Stream) => s.broadcasterId !== user?.id && setStreams((list) => [s, ...list.filter((x) => x.broadcasterId !== s.broadcasterId)]);
    const onStopped = ({ broadcasterId }: { broadcasterId: string }) => setStreams((list) => list.filter((s) => s.broadcasterId !== broadcasterId));
    const onEnded = () => {
      viewerPeer.current?.close();
      viewerPeer.current = null;
      setWatching(null);
      setError("The live stream ended.");
    };

    // Broadcaster side: one connection per viewer.
    const onViewerJoined = async ({ viewerId }: { viewerId: string }) => {
      if (!localStream.current) return;
      const pc = new RTCPeerConnection(ICE);
      localStream.current.getTracks().forEach((t) => pc.addTrack(t, localStream.current!));
      pc.onicecandidate = (e) => e.candidate && socket.emit("liveIceCandidate", { targetUserId: viewerId, candidate: e.candidate.toJSON() });
      broadcastPeers.current.set(viewerId, pc);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("liveOffer", { targetUserId: viewerId, offer });
    };
    const onViewerLeft = ({ viewerId }: { viewerId: string }) => {
      broadcastPeers.current.get(viewerId)?.close();
      broadcastPeers.current.delete(viewerId);
    };
    const onAnswer = async ({ fromViewerId, answer }: { fromViewerId: string; answer: RTCSessionDescriptionInit }) => {
      await broadcastPeers.current.get(fromViewerId)?.setRemoteDescription(answer).catch(() => undefined);
    };
    const onCount = ({ broadcasterId, count }: { broadcasterId: string; count: number }) => broadcasterId === user?.id && setViewers(count);

    // Viewer side.
    const onOffer = async ({ fromBroadcasterId, offer }: { fromBroadcasterId: string; offer: RTCSessionDescriptionInit }) => {
      const pc = new RTCPeerConnection(ICE);
      pc.ontrack = (e) => {
        if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0];
      };
      pc.onicecandidate = (e) => e.candidate && socket.emit("liveIceCandidate", { targetUserId: fromBroadcasterId, candidate: e.candidate.toJSON() });
      viewerPeer.current?.close();
      viewerPeer.current = pc;
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("liveAnswer", { targetUserId: fromBroadcasterId, answer });
    };
    const onIce = async ({ candidate, fromUserId }: { candidate: RTCIceCandidateInit; fromUserId: string }) => {
      const pc = broadcastPeers.current.get(fromUserId) ?? viewerPeer.current;
      await pc?.addIceCandidate(candidate).catch(() => undefined);
    };

    socket.on("activeStreamsList", onList);
    socket.on("liveStreamStarted", onStarted);
    socket.on("liveStreamStopped", onStopped);
    socket.on("liveStreamEnded", onEnded);
    socket.on("liveViewerJoined", onViewerJoined);
    socket.on("liveViewerLeft", onViewerLeft);
    socket.on("liveAnswer", onAnswer);
    socket.on("liveViewerCount", onCount);
    socket.on("liveOffer", onOffer);
    socket.on("liveIceCandidate", onIce);
    socket.emit("getActiveStreams");
    return () => {
      socket.off("activeStreamsList", onList);
      socket.off("liveStreamStarted", onStarted);
      socket.off("liveStreamStopped", onStopped);
      socket.off("liveStreamEnded", onEnded);
      socket.off("liveViewerJoined", onViewerJoined);
      socket.off("liveViewerLeft", onViewerLeft);
      socket.off("liveAnswer", onAnswer);
      socket.off("liveViewerCount", onCount);
      socket.off("liveOffer", onOffer);
      socket.off("liveIceCandidate", onIce);
    };
  }, [socket, user?.id]);

  // Leave cleanly when navigating away.
  useEffect(() => () => {
    localStream.current?.getTracks().forEach((t) => t.stop());
    broadcastPeers.current.forEach((pc) => pc.close());
    viewerPeer.current?.close();
  }, []);

  const goLive = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 720, height: 960 }, audio: true });
      localStream.current = stream;
      setBroadcasting(true);
      setSetup(false);
      socket?.emit("goLive", { title: title.trim() || undefined });
      window.setTimeout(() => {
        if (localVideo.current) localVideo.current.srcObject = stream;
      }, 50);
    } catch {
      setError("Allow camera and microphone access to go live.");
    }
  };

  const watch = (s: Stream) => {
    setError("");
    setWatching(s);
    socket?.emit("joinLiveStream", { broadcasterId: s.broadcasterId });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="no-scrollbar flex items-center gap-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => (broadcasting ? stopBroadcast() : setSetup(true))}
          className={cn("flex w-14 shrink-0 flex-col items-center gap-1", broadcasting && "text-red-300")}
          aria-label={broadcasting ? "End live stream" : "Go live"}
        >
          <span className={cn("flex size-12 items-center justify-center rounded-full border-2", broadcasting ? "border-red-500 bg-red-500/20" : "border-dashed border-white/25 text-subtle")}>
            <Radio className="size-5" />
          </span>
          <span className="text-[10px]">{broadcasting ? "End" : "Go live"}</span>
        </button>
        {streams.map((s) => (
          <button key={s.broadcasterId} type="button" onClick={() => watch(s)} title={s.title} className="flex w-14 shrink-0 flex-col items-center gap-1">
            <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-full border-2 border-red-500 bg-accent text-white">
              {s.avatar ? <Photo src={s.avatar} alt="" /> : s.username.charAt(0).toUpperCase()}
              <span className="absolute bottom-0 rounded-sm bg-red-600 px-1 text-[8px] font-bold uppercase">Live</span>
            </span>
            <span className="w-full truncate text-center text-[10px] text-subtle">{s.username}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}

      {broadcasting && (
        <div className="relative overflow-hidden rounded-2xl border border-red-500/40">
          <video ref={localVideo} autoPlay muted playsInline className="aspect-[3/4] w-full bg-black object-cover" />
          <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
            LIVE · <Eye className="size-3" /> {viewers}
          </span>
        </div>
      )}

      <Modal open={setup} onClose={() => setSetup(false)} title="Go live">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">Show friends what you&apos;re wearing and get opinions in real time.</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="e.g. Which lehenga for Saturday?"
            aria-label="Stream title"
            className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none focus:border-accent-bright/70"
          />
          <button type="button" onClick={goLive} className="flex h-11 items-center justify-center gap-2 rounded-full bg-red-600 text-sm font-medium text-white hover:bg-red-500">
            <Radio className="size-4" />
            Start live stream
          </button>
        </div>
      </Modal>

      {watching && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label={`${watching.username} is live`}>
          <div className="relative w-full max-w-[420px] overflow-hidden rounded-(--radius-frame) border border-white/10 bg-black">
            <video ref={remoteVideo} autoPlay playsInline className="aspect-[3/4] w-full object-cover" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-3">
              <span className="flex items-center gap-2 text-sm text-white">
                <span className="rounded-sm bg-red-600 px-1.5 text-[10px] font-bold uppercase">Live</span>
                {watching.username} · {watching.title}
              </span>
              <button type="button" onClick={stopWatching} aria-label="Leave stream" className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white">
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
