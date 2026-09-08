import { useEffect, useState } from "react";
import type { CallInfo, Participant } from "../../mock/types";
import { Icon } from "../ui/Icon";
import { Thumb } from "../ui/Thumb";

/** Simulated call surface. A real build swaps this for a WebRTC session. */
export function CallOverlay({ peer, media, onEnd }: {
  peer: Participant;
  media: "audio" | "video";
  onEnd: (call: CallInfo) => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(media === "audio");

  useEffect(() => {
    const connect = setTimeout(() => setConnected(true), 1600);
    return () => clearTimeout(connect);
  }, []);

  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setSeconds((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  const end = () =>
    onEnd({
      media,
      duration_s: seconds,
      outcome: connected ? "completed" : "missed",
      initiated_by: "you",
    });

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: `linear-gradient(155deg, hsl(${peer.hue} 32% 16%), #0b0f17)`,
      display: "grid", placeItems: "center", color: "#fff",
    }}>
      <div style={{ display: "grid", justifyItems: "center", gap: 16, textAlign: "center" }}>
        <div style={{
          width: media === "video" ? 200 : 120, height: media === "video" ? 200 : 120,
          borderRadius: media === "video" ? 20 : "50%", overflow: "hidden",
          display: "grid", placeItems: "center",
          background: camOff
            ? `hsl(${peer.hue} 30% 24%)`
            : `linear-gradient(145deg, hsl(${peer.hue} 55% 60%), hsl(${(peer.hue + 40) % 360} 50% 42%))`,
          boxShadow: connected ? "0 0 0 6px rgba(255,255,255,0.07)" : "none",
        }}>
          {camOff
            ? <Thumb hue={peer.hue} size={media === "video" ? 96 : 84} radius={999} label={peer.name} />
            : <Icon name="camera" size={44} />}
        </div>

        <div>
          <div style={{ fontSize: "var(--fs-2xl)", fontWeight: 650, letterSpacing: "-0.02em" }}>
            {peer.name}
          </div>
          <div style={{ fontSize: "var(--fs-md)", opacity: 0.72, marginTop: 4 }}>
            {connected ? clock : `Ringing… ${media === "video" ? "video" : "voice"} call`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
          <button onClick={() => setMuted((m) => !m)} aria-label="Toggle mute"
                  style={btn(muted ? "#fff" : "rgba(255,255,255,0.16)", muted ? "#111" : "#fff")}>
            <Icon name={muted ? "x" : "phone"} size={20} />
          </button>
          {media === "video" && (
            <button onClick={() => setCamOff((c) => !c)} aria-label="Toggle camera"
                    style={btn(camOff ? "#fff" : "rgba(255,255,255,0.16)", camOff ? "#111" : "#fff")}>
              <Icon name="camera" size={20} />
            </button>
          )}
          <button onClick={end} aria-label="End call"
                  style={{ ...btn("#ef4444", "#fff"), transform: "rotate(135deg)" }}>
            <Icon name="phone" size={20} />
          </button>
        </div>

        <div style={{ fontSize: "var(--fs-xs)", opacity: 0.45, marginTop: 8, maxWidth: "34ch" }}>
          Simulated call. A production build would open a WebRTC peer connection here and
          signal through the API.
        </div>
      </div>
    </div>
  );
}

const btn = (bg: string, fg: string) => ({
  width: 56, height: 56, borderRadius: "50%",
  background: bg, color: fg,
  display: "grid", placeItems: "center", cursor: "pointer",
});
