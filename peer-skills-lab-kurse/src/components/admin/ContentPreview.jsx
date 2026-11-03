// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Zeigt die echte öffentliche Seite im iframe und schickt ihr den Entwurf per postMessage.
export default function ContentPreview({ path, contentKey, draft, anchor }) {
  const frame = useRef(null);
  const [mobile, setMobile] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const origin = window.location.origin;

  const send = (message) => frame.current?.contentWindow?.postMessage(message, origin);
  const sendDraft = () => send({ type: "psl-content-preview", key: contentKey, value: draft });

  // Entwurf entprellt an die Seite schicken
  useEffect(() => {
    const t = setTimeout(sendDraft, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, contentKey]);

  // Die Seite meldet sich, sobald sie bereit ist (auch nach Neuladen)
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin === origin && e.data?.type === "psl-preview-ready") sendDraft();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, contentKey]);

  useEffect(() => {
    if (anchor?.id) send({ type: "psl-scroll", anchor: anchor.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-background">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live-Vorschau</span>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant={mobile ? "ghost" : "secondary"} onClick={() => setMobile(false)}>
            <Monitor /> Desktop
          </Button>
          <Button type="button" size="sm" variant={mobile ? "secondary" : "ghost"} onClick={() => setMobile(true)}>
            <Smartphone /> Handy
          </Button>
          <Button type="button" size="icon" variant="ghost" aria-label="Vorschau neu laden" className="h-8 w-8"
            onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex justify-center overflow-hidden">
        <iframe
          key={reloadKey}
          ref={frame}
          title="Vorschau"
          src={`${path}?preview=1`}
          onLoad={sendDraft}
          className="h-full bg-background border-0"
          style={{ width: mobile ? 390 : "100%", maxWidth: "100%", borderLeft: mobile ? "1px solid var(--border, #ddd)" : 0, borderRight: mobile ? "1px solid var(--border, #ddd)" : 0 }}
        />
      </div>
    </div>
  );
}
