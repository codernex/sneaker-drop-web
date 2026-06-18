import { useEffect, useState } from "react";

interface CountdownProps {
  expiresAt: string; // ISO date string
  onExpired?: () => void;
}

export function Countdown({ expiresAt, onExpired }: CountdownProps) {
  const getRemaining = () =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));

  const [seconds, setSeconds] = useState(getRemaining);

  useEffect(() => {
    if (seconds <= 0) {
      onExpired?.();
      return;
    }
    const id = setInterval(() => {
      const rem = getRemaining();
      setSeconds(rem);
      if (rem <= 0) {
        clearInterval(id);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = Math.max(0, seconds / 60) * 100; // assuming 60s TTL

  const color =
    seconds > 30 ? "text-emerald-400" : seconds > 10 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-5 w-5">
        <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor"
            strokeWidth="2" className="text-muted" />
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor"
            strokeWidth="2" strokeDasharray={`${2 * Math.PI * 8}`}
            strokeDashoffset={`${2 * Math.PI * 8 * (1 - pct / 100)}`}
            className={color}
            style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
      </div>
      <span className={`text-sm font-mono font-semibold ${color}`}>
        {mins > 0 ? `${mins}m ` : ""}{String(secs).padStart(2, "0")}s
      </span>
    </div>
  );
}
