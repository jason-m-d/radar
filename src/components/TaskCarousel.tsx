import MiniTaskCard from "./MiniTaskCard";
import { useEffect, useRef, useState } from "react";

export type TaskCarouselTask = {
  id: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
  isSeen: boolean;
  isIgnored: boolean;
  isSnoozed?: boolean;
};

export type TaskCarouselProps = {
  tasks: TaskCarouselTask[];
  removingIds?: Set<string>;
  onComplete: (taskId: string) => void;
  onOpen: (taskId: string) => void;
  onSnooze: (taskId: string) => void;
  onDirectSnooze?: (taskId: string, option: "today" | "tomorrow" | "next-week") => void;
  onReschedule: (taskId: string) => void;
  onBackBurner: (taskId: string) => void;
  onIgnore: (taskId: string) => void;
  onIgnoreAndRemove?: (taskId: string) => void;
  onSelectionChange?: (taskId: string | null) => void;
};

export default function TaskCarousel({
  tasks,
  removingIds,
  onComplete,
  onOpen,
  onSnooze,
  onDirectSnooze,
  onReschedule,
  onBackBurner,
  onIgnore,
  onIgnoreAndRemove,
  onSelectionChange,
}: TaskCarouselProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const skipSelectionEffect = useRef(false);

  const handleSelect = (id: string) => {
    const newSelection = selectedId === id ? null : id;
    skipSelectionEffect.current = true;
    setSelectedId(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleComplete = async (taskId: string) => {
    await onComplete(taskId);

    if (selectedId === taskId) {
      skipSelectionEffect.current = true;
      setSelectedId(null);
      onSelectionChange?.(null);
    }
  };

  useEffect(() => {
    if (skipSelectionEffect.current) {
      skipSelectionEffect.current = false;
      return;
    }

    if (onSelectionChange) {
      onSelectionChange(selectedId);
    }
  }, [selectedId, onSelectionChange]);

  return (
    <div className="relative">
      <div className="flex gap-1 overflow-x-auto pb-2 pl-1 scroll-smooth transition-all duration-300 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {tasks.map((task) => (
          <MiniTaskCard
            key={task.id}
            id={task.id}
            title={task.title}
            dueDate={task.dueDate}
            isSelected={selectedId === task.id}
            isCompleted={task.isCompleted}
            isSeen={task.isSeen}
            isIgnored={task.isIgnored}
            isSnoozed={task.isSnoozed}
            isRemoving={removingIds?.has(task.id)}
            onSelect={handleSelect}
            onComplete={(id) => {
              void handleComplete(id);
            }}
            onOpen={onOpen}
            onSnooze={onSnooze}
            onDirectSnooze={onDirectSnooze}
            onReschedule={onReschedule}
            onBackBurner={onBackBurner}
            onIgnore={onIgnore}
            onIgnoreAndRemove={onIgnoreAndRemove}
          />
        ))}
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#1C1A17] to-transparent pointer-events-none z-10" />
    </div>
  );
}
