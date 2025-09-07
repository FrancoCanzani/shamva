import { Turnstile as CloudflareTurnstile } from "@marsidev/react-turnstile";

interface TurnstileProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export function Turnstile({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  className,
}: TurnstileProps) {
  return (
    <CloudflareTurnstile
      siteKey={siteKey}
      onSuccess={onSuccess}
      onError={onError}
      onExpire={onExpire}
      options={{
        theme: "light",
        size: "normal",
      }}
      className={className}
    />
  );
}
