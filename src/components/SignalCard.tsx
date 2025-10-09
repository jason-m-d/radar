import { ArrowUpRight } from "lucide-react";
import type { CSSProperties, FC } from "react";

export type SignalCardProps = {
  id: string;
  subject: string;
  sender: string;
  senderEmail: string;
  receivedAt: string;
  hasTask: boolean;
  onSelect?: (id: string) => void;
  className?: string;
  style?: CSSProperties;
};

function formatTimestamp(value: string): string {
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  } catch {
    return value;
  }
}

const SignalCard: FC<SignalCardProps> = ({
  id,
  subject,
  sender,
  senderEmail,
  receivedAt,
  hasTask,
  onSelect,
  className,
  style,
}) => {
  const handleClick = () => {
    onSelect?.(id);
  };

  const baseClassName = "group relative flex w-full cursor-pointer flex-col gap-3 rounded-lg px-4 pb-5 pt-4 text-left text-[#E8E3D8] shadow-[0_4px_16px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.02)] transition-all duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_12px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)]";
  const combinedClassName = className ? `${baseClassName} ${className}` : baseClassName;

  const mergedStyle: CSSProperties = {
    backgroundColor: "var(--accent-forest-green)",
    ...style,
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={combinedClassName}
      style={mergedStyle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3
            className="text-[16px] font-semibold leading-tight tracking-[-0.015em] text-[#E8E3D8]"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {subject}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-[13px] leading-snug text-[rgba(232,227,216,0.75)]">
            <span className="max-w-[140px] truncate font-medium text-[#E8E3D8]" title={sender}>
              {sender}
            </span>
            <span className="h-1 w-1 rounded-full bg-[rgba(232,227,216,0.4)]"></span>
            <span className="max-w-[160px] truncate text-[rgba(232,227,216,0.6)]" title={senderEmail}>
              {senderEmail}
            </span>
          </div>
        </div>
        {hasTask ? (
          <span className="rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#E8E3D8]" style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}>
            Has task
          </span>
        ) : null}
      </div>
      <span className="text-[12px] uppercase tracking-[0.06em] text-[rgba(232,227,216,0.7)]">
        {formatTimestamp(receivedAt)}
      </span>

      <span
        className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.2)] text-[#E8E3D8] backdrop-blur-sm transition-transform duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:brightness-110"
        aria-hidden="true"
      >
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </button>
  );
};

export default SignalCard;
