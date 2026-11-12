"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { useAuth } from "@/features/auth/AuthProvider";
import { useAppSocket } from "@/features/app/socket";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type Peer = { id: string; name: string; avatar?: string | null };
type Phase = "idle" | "calling" | "ringing" | "connected";

const ICE: RTCConfiguration = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }] };
const RING_TIMEOUT_MS = 35_000;

type CallApi = { startCall: (peer: Peer, video: boolean) => void; busy: boolean };
const CallContext = createContext<CallApi>({ startCall: () => undefined, busy: false });

export const useCalls = () => useContext(CallContext);

/**
 * 1:1 voice/video calls over the backend's WebRTC signalling
 * (call_offer → incoming_call, call_answer → call_answered, ice_candidate,
 * call_rejected, call_ended). Mounted once for the signed-in app so calls
 * ring on every page.
 */
export function CallProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const socket = useAppSocket();
  const [phase, setPhase] = useState<Phase>("idle");
  const [peer, setPeer] = useState<Peer | null>(null);
  const [video, setVideo] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const remoteRef = useRef<MediaStream | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const offerRef = useRef<RTCSessionDescriptionInit | null>(null);
  const startedAt = useRef<number | null>(null);
  const outgoing = useRef(false);
  const ringTimer = useRef<number | null>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  const phaseRef = useRef<Phase>("idle");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const logCall = useCallback(
    (receiverId: string, status: "completed" | "missed" | "rejected", isVideo: boolean, duration: number) => {
      if (!token) return;
      apiRequest("/calls", { method: "POST", token, body: { receiverId, status, video: isVideo, duration } }).catch(() => undefined);
    },
    [token]
  );

  const cleanup = useCallback(() => {
    if (ringTimer.current) window.clearTimeout(ringTimer.current);
    ringTimer.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    remoteRef.current = null;
    pendingIce.current = [];
    offerRef.current = null;
    startedAt.current = null;
    setPhase("idle");
    setPeer(null);
    setMuted(false);
    setCameraOff(false);
    setSeconds(0);
  }, []);

  const createPeer = useCallback(
    (targetId: string) => {
      const pc = new RTCPeerConnection(ICE);
      pc.onicecandidate = (e) => e.candidate && socket?.emit("ice_candidate", { targetUserId: targetId, candidate: e.candidate.toJSON() });
      pc.ontrack = (e) => {
        remoteRef.current = e.streams[0];
        if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0];
        if (remoteAudio.current) remoteAudio.current.srcObject = e.streams[0];
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          startedAt.current = Date.now();
          setPhase("connected");
        }
        if (pc.connectionState === "failed") {
          setNotice("The call dropped.");
          cleanup();
        }
      };
      localRef.current?.getTracks().forEach((t) => pc.addTrack(t, localRef.current!));
      pcRef.current = pc;
      return pc;
    },
    [socket, cleanup]
  );

  const getMedia = async (withVideo: boolean) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo ? { width: 640, height: 480 } : false });
    localRef.current = stream;
    if (localVideo.current) localVideo.current.srcObject = stream;
    return stream;
  };

  const flushIce = async () => {
    const pc = pcRef.current;
    if (!pc?.remoteDescription) return;
    for (const c of pendingIce.current.splice(0)) await pc.addIceCandidate(c).catch(() => undefined);
  };

  const startCall = useCallback(
    async (target: Peer, withVideo: boolean) => {
      if (!socket || phaseRef.current !== "idle") return;
      setNotice("");
      setPeer(target);
      setVideo(withVideo);
      setPhase("calling");
      outgoing.current = true;
      try {
        await getMedia(withVideo);
        const pc = createPeer(target.id);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call_offer", { targetUserId: target.id, offer, callType: withVideo ? "video" : "audio" });
        ringTimer.current = window.setTimeout(() => {
          if (phaseRef.current !== "calling") return;
          socket.emit("call_ended", { targetUserId: target.id });
          logCall(target.id, "missed", withVideo, 0);
          setNotice(`${target.name} didn't answer.`);
          cleanup();
        }, RING_TIMEOUT_MS);
      } catch {
        setNotice("Allow microphone/camera access to call.");
        cleanup();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [socket, createPeer, cleanup, logCall]
  );

  const accept = async () => {
    if (!socket || !peer || !offerRef.current) return;
    try {
      await getMedia(video);
      const pc = createPeer(peer.id);
      await pc.setRemoteDescription(offerRef.current);
      await flushIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("call_answer", { targetUserId: peer.id, answer });
      setPhase("connected");
      startedAt.current = Date.now();
    } catch {
      setNotice("Allow microphone/camera access to answer.");
      socket.emit("call_rejected", { targetUserId: peer.id });
      cleanup();
    }
  };

  const decline = () => {
    if (peer) socket?.emit("call_rejected", { targetUserId: peer.id });
    cleanup();
  };

  const hangUp = () => {
    if (peer) {
      socket?.emit("call_ended", { targetUserId: peer.id });
      if (outgoing.current) {
        const duration = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0;
        logCall(peer.id, duration > 0 ? "completed" : "missed", video, duration);
      }
    }
    cleanup();
  };

  // Signalling listeners.
  useEffect(() => {
    if (!socket) return;
    const onIncoming = async (data: { fromUserId: string; offer: RTCSessionDescriptionInit; callType: string }) => {
      if (phaseRef.current !== "idle") {
        socket.emit("call_rejected", { targetUserId: data.fromUserId });
        return;
      }
      outgoing.current = false;
      offerRef.current = data.offer;
      setVideo(data.callType === "video");
      setPeer({ id: data.fromUserId, name: "Incoming call" });
      setPhase("ringing");
      if (token) {
        apiRequest<{ username?: string; email: string; avatar?: string | null }>(`/users/profile/${data.fromUserId}`, { token })
          .then((res) => setPeer({ id: data.fromUserId, name: res.data.username || res.data.email.split("@")[0], avatar: res.data.avatar }))
          .catch(() => undefined);
      }
    };
    const onAnswered = async (data: { answer: RTCSessionDescriptionInit }) => {
      if (ringTimer.current) window.clearTimeout(ringTimer.current);
      await pcRef.current?.setRemoteDescription(data.answer).catch(() => undefined);
      await flushIce();
    };
    const onIce = async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (pc?.remoteDescription) await pc.addIceCandidate(data.candidate).catch(() => undefined);
      else pendingIce.current.push(data.candidate);
    };
    const onRejected = () => {
      if (phaseRef.current === "idle") return;
      setNotice("Call declined.");
      setPeer((p) => {
        if (p && outgoing.current) logCall(p.id, "rejected", video, 0);
        return p;
      });
      cleanup();
    };
    const onEnded = () => {
      if (phaseRef.current === "ringing") setNotice("Missed call.");
      cleanup();
    };
    socket.on("incoming_call", onIncoming);
    socket.on("call_answered", onAnswered);
    socket.on("ice_candidate", onIce);
    socket.on("call_rejected", onRejected);
    socket.on("call_ended", onEnded);
    return () => {
      socket.off("incoming_call", onIncoming);
      socket.off("call_answered", onAnswered);
      socket.off("ice_candidate", onIce);
      socket.off("call_rejected", onRejected);
      socket.off("call_ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, token, cleanup, logCall, video]);

  // Call timer.
  useEffect(() => {
    if (phase !== "connected") return;
    const id = window.setInterval(() => setSeconds(startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Re-attach streams when the overlay mounts.
  useEffect(() => {
    if (localVideo.current && localRef.current) localVideo.current.srcObject = localRef.current;
    if (remoteVideo.current && remoteRef.current) remoteVideo.current.srcObject = remoteRef.current;
    if (remoteAudio.current && remoteRef.current) remoteAudio.current.srcObject = remoteRef.current;
  }, [phase]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(id);
  }, [notice]);

  const toggleMute = () => {
    localRef.current?.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted((m) => !m);
  };
  const toggleCamera = () => {
    localRef.current?.getVideoTracks().forEach((t) => (t.enabled = cameraOff));
    setCameraOff((c) => !c);
  };

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <CallContext.Provider value={{ startCall, busy: phase !== "idle" }}>
      {children}
      {notice && phase === "idle" && (
        <div role="status" className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-white/12 bg-[#15132e] px-4 py-2 text-sm text-white shadow-xl md:bottom-8">
          {notice}
        </div>
      )}
      {phase !== "idle" && peer && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={`Call with ${peer.name}`}>
          <div className="relative flex w-full max-w-[720px] flex-col overflow-hidden rounded-(--radius-frame) border border-white/10 bg-[#0b0b1e]">
            <div className={cn("relative flex items-center justify-center bg-black", video ? "aspect-video" : "h-72")}>
              {video && <video ref={remoteVideo} autoPlay playsInline className={cn("size-full object-cover", phase !== "connected" && "hidden")} />}
              <audio ref={remoteAudio} autoPlay />
              {(!video || phase !== "connected") && (
                <div className="flex flex-col items-center gap-3">
                  <span className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-accent text-3xl text-white">
                    {peer.avatar ? <Photo src={peer.avatar} alt="" /> : peer.name.charAt(0).toUpperCase()}
                  </span>
                  <p className="text-title text-white">{peer.name}</p>
                  <p className="text-sm text-muted">
                    {phase === "calling" ? "Calling…" : phase === "ringing" ? `Incoming ${video ? "video" : "voice"} call` : clock}
                  </p>
                </div>
              )}
              {video && (
                <video ref={localVideo} autoPlay playsInline muted className="absolute bottom-3 right-3 aspect-video w-36 rounded-xl border border-white/20 object-cover" />
              )}
              {phase === "connected" && video && <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{clock}</span>}
            </div>
            <div className="flex items-center justify-center gap-3 p-5">
              {phase === "ringing" ? (
                <>
                  <button type="button" onClick={decline} aria-label="Decline" className="flex size-14 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500">
                    <PhoneOff className="size-6" />
                  </button>
                  <button type="button" onClick={accept} aria-label="Answer" className="flex size-14 items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-500">
                    {video ? <Video className="size-6" /> : <Phone className="size-6" />}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} aria-pressed={muted} className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15">
                    {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                  </button>
                  {video && (
                    <button type="button" onClick={toggleCamera} aria-label={cameraOff ? "Turn camera on" : "Turn camera off"} aria-pressed={cameraOff} className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15">
                      {cameraOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
                    </button>
                  )}
                  <button type="button" onClick={hangUp} aria-label="Hang up" className="flex size-14 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500">
                    <PhoneOff className="size-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </CallContext.Provider>
  );
}
