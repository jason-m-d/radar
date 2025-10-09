import { Clock, EyeOff, Flame, Plus } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";

const SNOOZE_OPTION_MAP = {
  "Later Today": "today",
  Tomorrow: "tomorrow",
  "Next Week": "next-week",
} as const;

type SnoozeOptionLabel = keyof typeof SNOOZE_OPTION_MAP;

export type MiniTaskCardProps = {
  id: string;
  title: string;
  dueDate: string;
  isSelected: boolean;
  isCompleted: boolean;
  isSeen: boolean;
  isIgnored: boolean;
  isSnoozed?: boolean;
  isRemoving?: boolean;
  onSelect: (id: string) => void;
  onComplete: (id: string) => void;
  onOpen: (id: string) => void;
  onSnooze?: (id: string) => void;
  onDirectSnooze?: (id: string, option: "today" | "tomorrow" | "next-week") => void;
  onReschedule?: (id: string) => void;
  onBackBurner?: (id: string) => void;
  onIgnore?: (id: string) => void;
  onIgnoreAndRemove?: (id: string) => void;
};

export default function MiniTaskCard({
  id,
  title,
  dueDate,
  isSelected,
  isCompleted,
  isSeen,
  isIgnored,
  isSnoozed = false,
  isRemoving = false,
  onSelect,
  onComplete,
  onOpen,
  onSnooze,
  onDirectSnooze,
  onReschedule,
  onBackBurner,
  onIgnore,
  onIgnoreAndRemove,
}: MiniTaskCardProps) {
  const backgroundClassName = isSnoozed || isIgnored
    ? "bg-[#4a4a4a]"
    : isSeen || isCompleted
      ? "bg-[#3d4a32]"
      : "bg-[#5b6e4c]";

  const [showSnoozePrompt, setShowSnoozePrompt] = useState(false);
  const [confirmationMode, setConfirmationMode] = useState<null | "snooze" | "ignore">(null);
  const [confirmationText, setConfirmationText] = useState("");
  const confirmationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardWidth = isSelected
    ? showSnoozePrompt
      ? 420
      : 196
    : 180;

  useEffect(() => {
    console.log(`MiniTaskCard expanded: ${isSelected}`);
    console.log(`Width: ${cardWidth}px`);
  }, [cardWidth, isSelected]);

  const containerClassName = [
    "relative h-[96px] min-w-[180px] cursor-pointer overflow-hidden rounded-[12px] transition-[width] duration-[400ms] ease-[cubic-bezier(0.65,0,0.35,1)]",
    "transition-colors transition-shadow",
    "hover:shadow-[0_0_16px_rgba(255,255,255,0.3)] hover:brightness-110",
    isRemoving ? "animate-slide-out opacity-0 -translate-x-8" : backgroundClassName,
  ].join(" ");

  const handleSelect = () => {
    onSelect(id);
  };

  const handleComplete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setShowSnoozePrompt(false);
    setConfirmationMode(null);
    setConfirmationText("");
    onComplete(id);
  };

  const handleSnooze = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
      confirmationTimeoutRef.current = null;
    }
    setShowSnoozePrompt(true);
    setConfirmationMode(null);
    setConfirmationText("");
    console.log("Snooze prompt shown");
  };

  const handleBackBurner = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onBackBurner?.(id);
  };

  const handleIgnoreClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
    }
    setShowSnoozePrompt(false);
    setConfirmationText("Task ignored");
    setConfirmationMode("ignore");
    confirmationTimeoutRef.current = setTimeout(() => {
      confirmationTimeoutRef.current = null;
      setConfirmationMode(null);
      setConfirmationText("");
      if (onIgnoreAndRemove) {
        onIgnoreAndRemove(id);
      } else {
        onIgnore?.(id);
      }
    }, 3000);
  };

  const handleOpen = () => {
    onOpen(id);
  };

  const handleCloseSnoozePrompt = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setShowSnoozePrompt(false);
    setConfirmationMode(null);
    setConfirmationText("");
  };

  const handleSnoozeWithOption = (
    event: MouseEvent<HTMLButtonElement>,
    optionLabel: SnoozeOptionLabel,
  ) => {
    event.stopPropagation();
    if (confirmationTimeoutRef.current) {
      clearTimeout(confirmationTimeoutRef.current);
    }
    setShowSnoozePrompt(false);
    const confirmationMessage = `Great! I'll remind you about this ${optionLabel}.`;
    setConfirmationText(confirmationMessage);
    setConfirmationMode("snooze");
    console.log(`Snooze option selected: ${optionLabel}`);
    console.log("Snooze confirmation shown");
    const mappedOption = SNOOZE_OPTION_MAP[optionLabel];
    confirmationTimeoutRef.current = setTimeout(() => {
      setConfirmationMode(null);
      setConfirmationText("");
      confirmationTimeoutRef.current = null;
      if (mappedOption) {
        onDirectSnooze?.(id, mappedOption);
      } else {
        onSnooze?.(id);
      }
      if (isSelected) {
        onSelect(id);
      }
    }, 4000);
  };

  const UntouchedView = () => (
    <div className="relative flex h-full flex-col p-3">
      <h3 className="line-clamp-2 text-[14px] font-semibold text-white">{title}</h3>
      <span className="mt-1 text-[11px] uppercase text-white/70">{dueDate}</span>
      <button
        type="button"
        className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
        onClick={handleComplete}
      >
        <Plus className="h-[18px] w-[18px]" />
      </button>
    </div>
  );

  const ExpandedView = ({ isVisible }: { isVisible: boolean }) => (
    <div
      className={[
        "absolute inset-0 flex items-center justify-center",
        "transition-opacity duration-300 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors duration-300 ease-in-out hover:bg-white/30"
          onClick={handleComplete}
        >
          <Plus className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors duration-300 ease-in-out hover:bg-white/30"
          onClick={handleSnooze}
          onDoubleClick={(event) => {
            event.stopPropagation();
            onReschedule?.(id);
          }}
        >
          <Clock className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors duration-300 ease-in-out hover:bg-white/30"
          onClick={handleBackBurner}
        >
          <Flame className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors duration-300 ease-in-out hover:bg-white/30"
          onClick={handleIgnoreClick}
        >
          <EyeOff className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );

  const SnoozePromptView = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center transition-opacity duration-300 ease-in-out">
      <button
        type="button"
        className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white transition-colors duration-300 ease-in-out hover:bg-white/30"
        onClick={handleCloseSnoozePrompt}
      >
        <Plus className="h-4 w-4 rotate-45" />
      </button>
      <p className="text-[16px] font-medium text-white">
        When should I remind you about this?
      </p>
      <div className="flex items-center justify-center gap-2">
        {(Object.keys(SNOOZE_OPTION_MAP) as SnoozeOptionLabel[]).map((option) => (
          <button
            key={option}
            type="button"
            className="h-10 rounded-full bg-white/15 px-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-colors duration-200 ease-in-out hover:bg-white/25"
            onClick={(event) => handleSnoozeWithOption(event, option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  const ConfirmationView = () => (
    <div className="absolute inset-0 flex items-center justify-center px-6 text-center transition-opacity duration-300 ease-in-out">
      <p className="text-[16px] font-medium text-white">{confirmationText}</p>
    </div>
  );

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isSelected) {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = null;
      }
      setShowSnoozePrompt(false);
      setConfirmationMode(null);
      setConfirmationText("");
    }
  }, [isSelected]);

  return (
    <div
      className={containerClassName}
      style={{ width: `${cardWidth}px` }}
      onClick={handleSelect}
      onDoubleClick={(event) => {
        event.stopPropagation();
        handleOpen();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleSelect();
        }
      }}
    >
      {isSelected ? (
        <div className="relative h-full w-full">
          <ExpandedView isVisible={!showSnoozePrompt && confirmationMode === null} />
          {showSnoozePrompt ? <SnoozePromptView /> : null}
          {confirmationMode ? <ConfirmationView /> : null}
        </div>
      ) : (
        <UntouchedView />
      )}
      {isSnoozed ? (
        <div className="pointer-events-none absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white/60">
          <Clock className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );
}
