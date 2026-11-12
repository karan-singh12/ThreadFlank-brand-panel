"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { profileContent as copy } from "@/data/studio-content";

const constraints: MediaStreamConstraints = { video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false };

/**
 * Takes a selfie with the front camera: live preview, capture, then retake or use it.
 * Render it only while open (it starts the camera on mount and stops it on unmount).
 * Hands back a JPEG file; the caller uploads it.
 */
export function SelfieCamera({ onClose, onCapture }: { onClose: () => void; onCapture: (file: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shotUrl = useRef<string | null>(null);
  const [shot, setShot] = useState<{ url: string; blob: Blob } | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const open = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return Promise.resolve().then(() => {
        setError(copy.camera.unavailable);
        setStarting(false);
      });
    }
    return navigator.mediaDevices
      .getUserMedia(constraints)
      .then(async (stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      })
      .catch((e: unknown) => {
        const name = e instanceof Error ? e.name : "";
        setError(name === "NotAllowedError" || name === "SecurityError" ? copy.camera.denied : copy.camera.unavailable);
      })
      .finally(() => setStarting(false));
  };

  useEffect(() => {
    open();
    return () => {
      stop();
      if (shotUrl.current) URL.revokeObjectURL(shotUrl.current);
    };
    // Runs once: the camera opens when this mounts and closes when it unmounts.
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Save it the way the person saw it in the mirrored preview.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stop();
        const url = URL.createObjectURL(blob);
        shotUrl.current = url;
        setShot({ url, blob });
      },
      "image/jpeg",
      0.92
    );
  };

  const retake = () => {
    if (shotUrl.current) URL.revokeObjectURL(shotUrl.current);
    shotUrl.current = null;
    setShot(null);
    setError("");
    setStarting(true);
    open();
  };

  const use = () => {
    if (!shot) return;
    onCapture(new File([shot.blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" }));
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={copy.camera.title}>
      <div className="flex flex-col gap-4">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[360px] overflow-hidden rounded-2xl bg-black">
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot.url} alt="Your selfie" className="absolute inset-0 size-full object-cover" />
          ) : (
            <video ref={videoRef} playsInline muted className="absolute inset-0 size-full -scale-x-100 object-cover" />
          )}
          {!shot && !error && !starting && (
            // A face guide, so people frame themselves the same way every time.
            <span aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] h-[58%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-dashed border-white/60" />
          )}
          {starting && (
            <span className="absolute inset-0 flex items-center justify-center">
              <LoaderCircle className="size-7 animate-spin text-white" />
            </span>
          )}
          {error && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/80">{error}</p>}
        </div>
        <p className="text-center text-xs text-muted">{copy.camera.tip}</p>
        <div className="flex justify-center gap-3">
          {shot ? (
            <>
              <ActionButton variant="ghost" onClick={retake}>
                <RefreshCw className="size-4" />
                {copy.camera.retake}
              </ActionButton>
              <ActionButton onClick={use}>{copy.camera.use}</ActionButton>
            </>
          ) : (
            <ActionButton onClick={capture} disabled={Boolean(error) || starting}>
              <Camera className="size-4" />
              {copy.camera.capture}
            </ActionButton>
          )}
        </div>
      </div>
    </Modal>
  );
}
