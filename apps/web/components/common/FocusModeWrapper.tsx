"use client";

import React, { useEffect, useMemo } from "react";

type AnyProps = Record<string, any>;

type Props = AnyProps & {
  children: React.ReactNode;

  /** 열림/닫힘: 기존 코드 호환용 (enabled/isOpen/open 중 아무거나 써도 됨) */
  enabled?: boolean;
  isOpen?: boolean;
  open?: boolean;

  /** backdrop 클릭 또는 ESC로 닫고 싶을 때 */
  onClose?: () => void;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;

  /** 추가 클래스 */
  overlayClassName?: string;
  stageClassName?: string;
};

export default function FocusModeWrapper({
  children,
  enabled,
  isOpen,
  open,
  onClose,
  closeOnBackdrop = false,
  closeOnEsc = false,
  overlayClassName = "",
  stageClassName = "",
}: Props) {
  const isActive = useMemo(() => {
    const v = isOpen ?? open ?? enabled;
    return v === undefined ? true : Boolean(v);
  }, [enabled, isOpen, open]);

  // body scroll lock
  useEffect(() => {
    if (!isActive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isActive]);

  // ESC close
  useEffect(() => {
    if (!isActive || !closeOnEsc || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive, closeOnEsc, onClose]);

  if (!isActive) return <>{children}</>;

  return (
    <>
      {/* ✅ blur/흐림 전부 강제 OFF (CSS의 !important도 이김) */}
      <style jsx global>{`
        .focus-overlay {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          filter: none !important;
        }
        .focus-overlay::before,
        .focus-overlay::after {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          filter: none !important;
        }
        .focus-stage,
        .focus-stage-inner {
          filter: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        /* 혹시 부모에 blur 걸려있는 케이스까지 대비 */
        body,
        body * {
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <div
        className={`focus-overlay ${overlayClassName}`}
        style={{
          // ✅ "뿌연 막" 느낌 제거: overlay 자체를 투명하게 (필요하면 숫자만 조절)
          background: "transparent",
        }}
        onMouseDown={(e) => {
          if (!closeOnBackdrop || !onClose) return;
          if (e.target === e.currentTarget) onClose();
        }}
        role="presentation"
      >
        <div
          className={`focus-stage ${stageClassName}`}
          style={{
            // ✅ stage도 혹시 blur/filter 먹는 것 방지
            filter: "none",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="focus-stage-inner"
            style={{
              filter: "none",
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
