import { ArrowUpRight, Circle, Flame } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type FC, type KeyboardEvent } from "react";

type TaskStatus = "action-needed" | "waiting" | "complete";

type TaskCardProps = {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  priority: number;
  waitingOn?: string;
  subject?: string;
  backBurneredAt?: string | null;
  confidence?: number | null;
  onSelect?: (taskId: string) => void;
  onComplete?: (taskId: string) => void | Promise<void>;
  onBackBurner?: (taskId: string) => void | Promise<void>;
  onUncomplete?: (taskId: string) => void | Promise<void>;
  isCompleting?: boolean;
  className?: string;
  style?: CSSProperties;
  showBackBurner?: boolean;
  variant?: "sidebar" | "action-message" | "completed" | "subchat" | "action-expanded";
};

type StatusTheme = {
  background: string;
  textColor: string;
  statusLabel: string;
  badgeBackground: string;
  badgeText: string;
  metaText: string;
  accentDot: string;
};

const statusThemes: Record<TaskStatus, StatusTheme> = {
  "action-needed": {
    background: "var(--accent-tomato)",
    textColor: "#1C1A17",
    statusLabel: "ACTION",
    badgeBackground: "rgba(28, 26, 23, 0.12)",
    badgeText: "#1C1A17",
    metaText: "rgba(28, 26, 23, 0.72)",
    accentDot: "rgba(28, 26, 23, 0.5)",
  },
  waiting: {
    background: "var(--accent-tropical-indigo)",
    textColor: "#1C1A17",
    statusLabel: "WAITING THEM",
    badgeBackground: "rgba(28, 26, 23, 0.18)",
    badgeText: "#1C1A17",
    metaText: "rgba(28, 26, 23, 0.72)",
    accentDot: "rgba(28, 26, 23, 0.5)",
  },
  complete: {
    background: "#2A2A2A",
    textColor: "rgba(232, 227, 216, 0.75)",
    statusLabel: "DONE",
    badgeBackground: "rgba(232, 227, 216, 0.06)",
    badgeText: "rgba(232, 227, 216, 0.65)",
    metaText: "rgba(232, 227, 216, 0.45)",
    accentDot: "rgba(232, 227, 216, 0.25)",
  },
};

const priorityLabel = (priority: number) => `P${priority}`;

const TaskCard: FC<TaskCardProps> = ({
  id,
  title,
  dueDate,
  status,
  priority,
  waitingOn,
  subject,
  backBurneredAt,
  confidence,
  onSelect,
  onComplete,
  onBackBurner,
  onUncomplete,
  isCompleting,
  className,
  style,
  showBackBurner = true,
  variant = "sidebar",
}) => {
  const theme = statusThemes[status] ?? statusThemes["action-needed"];
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [needsBlur, setNeedsBlur] = useState(false);
  const isActionExpanded = variant === "action-expanded";

  const COMPLETED_ACTION_WIDTH = 140;
  const COMPLETED_ACTION_RIGHT = 16;

  const heightClass = variant === "completed"
    ? "h-14"
    : variant === "action-message"
      ? "h-28"
      : isActionExpanded
        ? "h-32"
        : "min-h-[72px]";

  const paddingClass = variant === "completed"
    ? "px-4 py-3"
    : isActionExpanded
      ? "px-5 py-4"
      : "px-4 py-4";

  const layoutClass = variant === "completed"
    ? "flex-row items-center gap-4"
    : isActionExpanded
      ? "flex-col gap-3"
      : "flex-col gap-2";

  const shadowClass = isActionExpanded
    ? "shadow-lg"
    : "shadow-[0_2px_8px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.02)]";

  const hoverShadowClass = isActionExpanded
    ? "hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl"
    : "hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_4px_12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.04)]";

  const textClass = isActionExpanded ? "text-white" : "";

  const baseClassName = `group relative flex ${layoutClass} ${heightClass} w-full cursor-pointer overflow-hidden rounded-lg ${paddingClass} text-left transition-all duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] ${shadowClass} ${hoverShadowClass} ${textClass}`.trim();
  const combinedClassName = className ? `${baseClassName} ${className}` : baseClassName;
  const mergedStyle: CSSProperties = {
    backgroundColor: isActionExpanded ? "#5b4f8a" : theme.background,
    color: isActionExpanded ? "#FFFFFF" : theme.textColor,
    ...style,
  };

  const showCompleteButton = !isActionExpanded && typeof onComplete === "function" && status !== "complete";
  const showBackBurnerButton = !isActionExpanded && showBackBurner && typeof onBackBurner === "function" && !backBurneredAt;

  const handleSelect = () => {
    onSelect?.(id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect();
    }
  };

  const renderOpenButton = (additionalClasses = "") => (
    <div className="relative">
      <button
        type="button"
        aria-label="View source thread"
        onClick={(event) => event.stopPropagation()}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={`flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.2)] text-[rgba(28,26,23,0.85)] backdrop-blur-sm transition duration-200 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,255,255,0.4)] ${additionalClasses}`}
        style={{
          opacity: additionalClasses.includes("pointer-events-none") ? 0 : 1,
        }}
      >
        <ArrowUpRight className="h-4 w-4" />
      </button>
      {subject ? (
        <span
          className={`pointer-events-none absolute bottom-full right-0 mb-2 text-left transition duration-150 ${
            showTooltip ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          <span className="relative block rounded bg-[rgba(0,0,0,0.9)] px-3 py-2 text-[13px] font-medium text-[#F5F0E8] shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
            {subject}
            <span className="absolute left-auto right-4 top-full -mt-1 h-2 w-2 rotate-45 bg-[rgba(0,0,0,0.9)]"></span>
          </span>
        </span>
      ) : null}
    </div>
  );

  const renderDefaultContent = () => (
    <>
      <div className="flex h-full items-start justify-between gap-3">
        <div className="flex h-full flex-1 flex-col justify-between">
          <h3
            className="truncate text-[16px] font-semibold leading-tight tracking-[-0.015em]"
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              ...(variant === "sidebar" ? {} : { maxWidth: "calc(100% - 140px)" }),
            }}
          >
            {title}
          </h3>
          {dueDate ? (
            <span className="text-[13px] font-normal uppercase tracking-[0.04em]" style={{ color: theme.metaText }}>
              {dueDate}
            </span>
          ) : null}
        </div>
        <span
          className="rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ backgroundColor: theme.badgeBackground, color: theme.badgeText }}
        >
          {theme.statusLabel}
        </span>
      </div>

      {waitingOn ? (
        <span
          className="inline-flex max-w-[75%] items-center rounded px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em]"
          style={{ backgroundColor: theme.badgeBackground, color: theme.badgeText }}
        >
          Waiting on {waitingOn}
        </span>
      ) : null}

      <div className="mt-1 flex items-center justify-between">
        <span
          className="inline-flex items-center rounded px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em]"
          style={{ backgroundColor: theme.badgeBackground, color: theme.badgeText }}
        >
          {priorityLabel(priority)}
        </span>
      </div>

      <div className="absolute bottom-4 flex items-center gap-2" style={{ right: `${COMPLETED_ACTION_RIGHT}px` }}>
        {showCompleteButton ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onComplete?.(id);
            }}
            disabled={isCompleting}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.2)] text-[rgba(28,26,23,0.85)] backdrop-blur-sm transition duration-200 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,255,255,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Circle className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
        {showBackBurnerButton ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onBackBurner?.(id);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.2)] text-[rgba(28,26,23,0.85)] backdrop-blur-sm transition duration-200 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(255,255,255,0.4)]"
          >
            <Flame className="h-4 w-4" />
          </button>
        ) : null}
        {renderOpenButton()}
      </div>
    </>
  );

  const renderActionExpandedContent = () => {
    const formattedConfidence = typeof confidence === "number" && Number.isFinite(confidence)
      ? confidence.toFixed(1)
      : null;

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <h3 className="flex-1 text-[18px] font-semibold leading-tight tracking-[-0.015em] text-white">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            {formattedConfidence ? (
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                {`${formattedConfidence}`}<span className="ml-1 opacity-80">CONF</span>
              </span>
            ) : null}
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
              {priorityLabel(priority)}
            </span>
          </div>
        </div>

        {dueDate ? (
          <span className="mt-2 text-[12px] uppercase tracking-[0.08em] text-white/70">
            {dueDate}
          </span>
        ) : null}

        {subject ? (
          <span className="mt-3 inline-flex max-w-full items-center rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.08em] text-white">
            {subject}
          </span>
        ) : null}

        {waitingOn ? (
          <span className="mt-auto inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.08em] text-white/90">
            Waiting on {waitingOn}
          </span>
        ) : null}
      </div>
    );
  };

  const renderCompletedContent = () => (
    <div className="relative flex w-full items-center">
      <h3
        ref={titleRef}
        className="flex-1 truncate text-[16px] font-semibold leading-tight tracking-[-0.015em]"
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          paddingRight: `${COMPLETED_ACTION_WIDTH + COMPLETED_ACTION_RIGHT}px`,
        }}
      >
        {title}
      </h3>
      <div
        className="absolute flex items-center gap-2 transition-opacity duration-300"
        style={{
          right: `${COMPLETED_ACTION_RIGHT}px`,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: isHovered ? 0 : 1,
          pointerEvents: isHovered ? "none" : "auto",
        }}
      >
        <span
          className="rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ backgroundColor: theme.badgeBackground, color: theme.badgeText }}
        >
          Done
        </span>
        {renderOpenButton()}
      </div>
      {isHovered ? (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUncomplete?.(id);
            }}
            className="absolute flex h-8 w-[140px] items-center justify-center rounded px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1C1A17] transition-colors duration-200 hover:bg-[var(--accent-tropical-indigo)]"
            style={{
              backgroundColor: "#FF543D",
              right: '6px',
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1,
            }}
          >
            Mark as incomplete?
          </button>
          {needsBlur ? (
            <div
              className="pointer-events-none absolute top-0 bottom-0"
              style={{
                left: `calc(100% - ${COMPLETED_ACTION_WIDTH + COMPLETED_ACTION_RIGHT}px)`,
                width: `${COMPLETED_ACTION_WIDTH}px`,
                background: "linear-gradient(to left, rgba(42,42,42,0.85), transparent)",
                backdropFilter: "blur(2px)",
                zIndex: 0,
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );

  const content = variant === "completed"
    ? renderCompletedContent()
    : isActionExpanded
      ? renderActionExpandedContent()
      : renderDefaultContent();

  useEffect(() => {
    if (variant !== "completed") {
      setNeedsBlur(false);
      return;
    }

    const update = () => {
      const node = titleRef.current;
      if (!node) {
        setNeedsBlur(false);
        return;
      }
      setNeedsBlur(node.scrollWidth > node.clientWidth);
    };

    update();
    if (typeof window === "undefined") {
      return;
    }
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, [title, variant, isHovered]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={combinedClassName}
      style={mergedStyle}
      data-task-id={id}
      onMouseEnter={() => {
        if (variant === "completed") {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (variant === "completed") {
          setIsHovered(false);
        }
      }}
    >
      {content}
    </div>
  );
};

export default TaskCard;
