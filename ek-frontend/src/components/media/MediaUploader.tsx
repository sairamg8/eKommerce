import { useRef, useState } from "react";
import type { DragEvent } from "react";
import type { MediaAsset, MediaKind } from "../../mock/types";
import { MEDIA_RULES } from "../../mock/types";
import { cn } from "../../lib/cn";
import { Icon } from "../ui/Icon";
import s from "./MediaUploader.module.css";

const KIND_ICON: Record<MediaKind, string> = {
  image: "image", video: "camera", document: "file",
};

const bytes = (b: number) =>
  b > 1_000_000 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

const kindOf = (mime: string): MediaKind =>
  mime.startsWith("video/") ? "video" : mime === "application/pdf" ? "document" : "image";

let seq = 7000;

/** Builds the asset record the server would return after a successful upload. */
export function makeAsset(file: { name: string; type: string; size: number }, by: string): MediaAsset {
  seq += 1;
  const kind = kindOf(file.type);
  return {
    id: `med_${seq}`,
    kind,
    filename: file.name,
    mime: file.type,
    size_bytes: file.size,
    hue: (seq * 47) % 360,
    duration_s: kind === "video" ? 15 + (seq % 120) : null,
    pages: kind === "document" ? 2 + (seq % 18) : null,
    alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
    uploaded_by: by,
    uploaded_at: new Date().toISOString(),
  };
}

export function MediaUploader({
  value, onChange, accept = ["image", "video", "document"],
  max = 8, uploadedBy, primaryId, onPrimary, compact, label, hint,
}: {
  value: MediaAsset[];
  onChange: (next: MediaAsset[]) => void;
  accept?: MediaKind[];
  max?: number;
  uploadedBy: string;
  /** Pass with onPrimary to enable "set as cover". */
  primaryId?: string;
  onPrimary?: (id: string) => void;
  compact?: boolean;
  label?: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const mimes = accept.flatMap((k) => [...MEDIA_RULES[k].mimes]);

  const ingest = (files: File[]) => {
    setError(null);
    const room = max - value.length;
    if (room <= 0) { setError(`You can upload at most ${max} files here.`); return; }

    const ok: MediaAsset[] = [];
    for (const file of files.slice(0, room)) {
      const kind = kindOf(file.type);
      if (!accept.includes(kind)) {
        setError(`${file.name}: only ${accept.map((k) => MEDIA_RULES[k].label).join(", ")} allowed.`);
        continue;
      }
      if (file.size > MEDIA_RULES[kind].maxBytes) {
        setError(`${file.name} is ${bytes(file.size)} — the limit for ${MEDIA_RULES[kind].label.toLowerCase()} is ${bytes(MEDIA_RULES[kind].maxBytes)}.`);
        continue;
      }
      ok.push(makeAsset(file, uploadedBy));
    }
    if (!ok.length) return;

    // Simulate the upload so progress states are real, not decorative.
    onChange([...value, ...ok]);
    for (const asset of ok) {
      let pct = 0;
      setProgress((p) => ({ ...p, [asset.id]: 0 }));
      const timer = setInterval(() => {
        pct += 12 + Math.round(Math.random() * 18);
        if (pct >= 100) {
          clearInterval(timer);
          setProgress((p) => {
            const next = { ...p };
            delete next[asset.id];
            return next;
          });
        } else {
          setProgress((p) => ({ ...p, [asset.id]: pct }));
        }
      }, 140);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    ingest([...e.dataTransfer.files]);
  };

  const remove = (id: string) => onChange(value.filter((a) => a.id !== id));

  return (
    <div>
      {label && <div style={{ fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{label}</div>}

      <button type="button"
              className={cn(s.zone, compact && s.compact, over && s.over)}
              onClick={() => input.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={onDrop}>
        <span className={s.zIco}><Icon name="upload" size={19} /></span>
        <span className={s.zt}>Drop files here, or click to browse</span>
        <span className={s.zd}>
          {accept.map((k) => `${MEDIA_RULES[k].label} up to ${bytes(MEDIA_RULES[k].maxBytes)}`).join(" · ")}
          {` · max ${max} files`}
        </span>
      </button>

      <input ref={input} type="file" multiple hidden accept={mimes.join(",")}
             onChange={(e) => { ingest([...(e.target.files ?? [])]); e.target.value = ""; }} />

      {error && <div className={s.err}>{error}</div>}
      {hint && !error && <div className={s.hint}>{hint}</div>}

      {value.length > 0 && (
        <div className={s.grid}>
          {value.map((a) => {
            const pct = progress[a.id];
            const isPrimary = primaryId === a.id;
            return (
              <div key={a.id} className={cn(s.tile, isPrimary && s.primary)}>
                <div className={s.preview}
                     style={{
                       background: `linear-gradient(145deg, hsl(${a.hue} 60% 93%), hsl(${(a.hue + 40) % 360} 55% 85%))`,
                       color: `hsl(${a.hue} 45% 32%)`,
                     }}>
                  <Icon name={KIND_ICON[a.kind]} size={26} className={s.pIco} />
                  {a.kind === "video" && a.duration_s != null && (
                    <span className={s.dur}>
                      {Math.floor(a.duration_s / 60)}:{String(a.duration_s % 60).padStart(2, "0")}
                    </span>
                  )}
                  {a.kind === "document" && a.pages != null && (
                    <span className={s.dur}>{a.pages}p</span>
                  )}
                  {isPrimary && <span className={s.flag}>COVER</span>}
                  <div className={s.tools}>
                    {onPrimary && a.kind === "image" && !isPrimary && (
                      <button type="button" className={s.tbtn} title="Set as cover"
                              onClick={() => onPrimary(a.id)}>
                        <Icon name="star" size={12} />
                      </button>
                    )}
                    <button type="button" className={cn(s.tbtn, s.tdel)} title="Remove"
                            onClick={() => remove(a.id)}>
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>
                {pct != null && <div className={s.bar}><div className={s.fill} style={{ width: `${pct}%` }} /></div>}
                <div className={s.info}>
                  <span className={s.fname}>{a.filename}</span>
                  <span className={s.fmeta}>
                    {pct != null ? `Uploading ${pct}%` : `${a.kind} · ${bytes(a.size_bytes)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
