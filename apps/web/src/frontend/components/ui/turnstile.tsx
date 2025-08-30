import { useEffect, useRef } from "react";

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
    onTurnstileError?: () => void;
    onTurnstileExpired?: () => void;
  }
}

export function Turnstile({
  siteKey,
  onVerify,
  onError,
  onExpire,
  className,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (import.meta.env.DEV) {
      onVerifyRef.current("dev-token");
      return;
    }

    if (typeof window !== "undefined") {
      window.onTurnstileSuccess = (token: string) => {
        onVerifyRef.current(token);
      };

      if (onErrorRef.current) {
        window.onTurnstileError = () => {
          onErrorRef.current?.();
        };
      }

      if (onExpireRef.current) {
        window.onTurnstileExpired = () => {
          onExpireRef.current?.();
        };
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        delete window.onTurnstileSuccess;
        delete window.onTurnstileError;
        delete window.onTurnstileExpired;
      }
    };
  }, []);

  if (import.meta.env.DEV) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`cf-turnstile ${className || ""}`}
      data-sitekey={siteKey}
      data-size="invisible"
      data-appearance="interaction-only"
      data-callback="onTurnstileSuccess"
      data-error-callback="onTurnstileError"
      data-expired-callback="onTurnstileExpired"
    />
  );
}
