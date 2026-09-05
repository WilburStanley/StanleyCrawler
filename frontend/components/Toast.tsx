"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";

type ToastProps = {
  message: string | null;
  onClear: () => void;
  duration?: number;
};

const Toast = ({ message, onClear, duration = 2000 }: ToastProps) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClear, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClear]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50">
      <div className="flex items-center gap-2 bg-surface border border-border text-text text-sm px-4 py-2.5 rounded-sm shadow-lg animate-in fade-in slide-in-from-bottom-2">
        <Check size={14} className="text-success" />
        {message}
      </div>
    </div>
  );
};

export default Toast;