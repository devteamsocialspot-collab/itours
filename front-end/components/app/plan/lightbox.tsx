"use client";

/* eslint-disable @next/next/no-img-element -- remote photos at their own size, no loader configured */
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useT } from "@/lib/i18n";

/** The plan's photos full screen: arrows, ← → or a thumbnail to move; Esc or ✕ to close. `index` null = closed. */
export function Lightbox({ photos, index, onIndex, title }: { photos: string[]; index: number | null; onIndex: (index: number | null) => void; title: string }) {
  const t = useT();
  const go = (step: number) => index !== null && onIndex((index + step + photos.length) % photos.length);
  return (
    <Dialog.Root open={index !== null} onOpenChange={(open) => !open && onIndex(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="lb-overlay" />
        <Dialog.Content
          className="lb"
          aria-describedby={undefined}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") go(-1);
            if (e.key === "ArrowRight") go(1);
          }}
        >
          <div className="lb-top">
            <Dialog.Title className="lb-title">{title}</Dialog.Title>
            <span>
              {(index ?? 0) + 1} / {photos.length}
            </span>
            <Dialog.Close className="lb-btn" aria-label={t("common.close")}>
              <X size={20} />
            </Dialog.Close>
          </div>
          <div className="lb-stage">
            {index !== null && <img src={photos[index]} alt={t("plan.viewPhoto", { n: index + 1 })} />}
            {photos.length > 1 && (
              <>
                <button type="button" className="lb-btn lb-prev" aria-label={t("common.prev")} onClick={() => go(-1)}>
                  <ChevronLeft size={26} />
                </button>
                <button type="button" className="lb-btn lb-next" aria-label={t("common.next")} onClick={() => go(1)}>
                  <ChevronRight size={26} />
                </button>
              </>
            )}
          </div>
          <div className="lb-thumbs">
            {photos.map((src, i) => (
              <button key={i} type="button" aria-current={i === index} aria-label={t("plan.viewPhoto", { n: i + 1 })} onClick={() => onIndex(i)}>
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
