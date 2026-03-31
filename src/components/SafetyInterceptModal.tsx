import { useState } from "react";

interface SafetyInterceptModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message?: string;
}

const SafetyInterceptModal = ({
  open,
  onClose,
  onConfirm,
  title = "Safety Intercept",
  message = "This action may pose a security risk. Do you want to proceed?",
}: SafetyInterceptModalProps) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 mx-4 w-full max-w-sm glow-primary animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold hover:bg-border transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm?.(); onClose(); }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:bg-destructive/80 transition-colors cursor-pointer"
          >
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyInterceptModal;
