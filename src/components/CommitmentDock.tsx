import { useCallback, useEffect, useMemo, useState } from "react";

import TaskCarousel from "./TaskCarousel";
import TaskCard from "./TaskCard";
import type { TaskCarouselTask } from "./TaskCarousel";
import type { ActionMessageTaskSummary } from "./ActionMessage";

export type CommitmentDockTask = {
  messageId: string;
  taskId: string;
  taskData: ActionMessageTaskSummary;
  seenAt: Date | null;
  ignoredAt: Date | null;
  gmailThreadId: string | null;
  snoozedUntil: Date | null;
};

export type CommitmentDockProps = {
  onTaskUpdate: () => void;
};

export default function CommitmentDock({ onTaskUpdate }: CommitmentDockProps) {
  const [tasks, setTasks] = useState<CommitmentDockTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [removingTaskIds, setRemovingTaskIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [activePrompt, setActivePrompt] = useState<{ taskId: string; type: "snooze" | "reschedule" } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sortedTasks = useMemo(() => {
    const now = new Date();
    return [...tasks].sort((a, b) => {
      const aIgnored = Boolean(a.ignoredAt);
      const bIgnored = Boolean(b.ignoredAt);
      if (aIgnored !== bIgnored) {
        return aIgnored ? 1 : -1;
      }

      const aSeen = Boolean(a.seenAt);
      const bSeen = Boolean(b.seenAt);
      if (aSeen !== bSeen) {
        return aSeen ? 1 : -1;
      }

      const aSnoozed = Boolean(a.snoozedUntil && a.snoozedUntil > now);
      const bSnoozed = Boolean(b.snoozedUntil && b.snoozedUntil > now);
      if (aSnoozed !== bSnoozed) {
        return aSnoozed ? 1 : -1;
      }

      return 0;
    });
  }, [tasks]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => setToastMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleMarkSeen = useCallback(async (taskId: string) => {
    const task = tasks.find((item) => item.taskId === taskId);
    if (!task || task.seenAt) {
      return;
    }

    try {
      await fetch(`/api/messages/${task.messageId}/seen`, {
        method: "POST",
      });
    } catch (error) {
      console.error("[CommitmentDock] Failed to mark seen:", error);
    }

    setTasks((previous) =>
      previous.map((item) => (
        item.taskId === taskId
          ? { ...item, seenAt: new Date() }
          : item
      ))
    );
    setToastMessage("Moved to back of queue");
  }, [tasks]);

  useEffect(() => {
    const fetchUnseenTasks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/messages?type=ACTION&uninteracted=true");
        if (!response.ok) {
          throw new Error(`Failed to load messages with status ${response.status}`);
        }
        const data = await response.json() as {
          messages?: Array<{
            id: string;
            taskId?: string | null;
            metadata?: { taskIds?: string[] } | null;
            seenAt?: string | null;
            ignoredAt?: string | null;
            snoozedUntil?: string | null;
          }>;
        };

        const taskList: CommitmentDockTask[] = [];

        for (const msg of data.messages ?? []) {
          if (!msg.taskId) {
            continue;
          }

          const metadataTaskIds = Array.isArray(msg.metadata?.taskIds) ? msg.metadata?.taskIds : [];
          if (metadataTaskIds && metadataTaskIds.length > 1) {
            continue;
          }

          const taskResponse = await fetch("/api/tasks/details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [msg.taskId] }),
          });

          if (!taskResponse.ok) {
            continue;
          }

          const taskData = await taskResponse.json() as { tasks?: ActionMessageTaskSummary[] };
          const taskSummary = taskData.tasks?.[0];
          if (taskSummary) {
            taskList.push({
              messageId: msg.id,
              taskId: msg.taskId,
              taskData: taskSummary,
              seenAt: msg.seenAt ? new Date(msg.seenAt) : null,
              ignoredAt: msg.ignoredAt ? new Date(msg.ignoredAt) : null,
              gmailThreadId: taskSummary.gmailThreadId ?? null,
              snoozedUntil: msg.snoozedUntil ? new Date(msg.snoozedUntil) : null,
            });
          }
        }

        setTasks(taskList);
        setSelectedTaskId((prev) => {
          if (prev && taskList.some((task) => task.taskId === prev)) {
            return prev;
          }
          return taskList[0]?.taskId ?? null;
        });
      } catch (error) {
        console.error("[CommitmentDock] Failed to fetch tasks:", error);
        setTasks([]);
        setSelectedTaskId(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUnseenTasks();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTasks((previous) => [...previous]);
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const handleInteraction = useCallback(async (taskId: string) => {
    const task = tasks.find((item) => item.taskId === taskId);
    if (!task) {
      return;
    }

    setActivePrompt((prompt) => (prompt?.taskId === taskId ? null : prompt));
    setRemovingTaskIds((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });

    await fetch(`/api/messages/${task.messageId}/interact`, {
      method: "POST",
    });

    setTimeout(() => {
      void handleMarkSeen(taskId);
      setTasks((prev) => {
        const nextTasks = prev.filter((item) => item.taskId !== taskId);
        setSelectedTaskId((current) => {
          if (current && current !== taskId) {
            return current;
          }
          return nextTasks[0]?.taskId ?? null;
        });
        return nextTasks;
      });

      setRemovingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });

      onTaskUpdate();
    }, 300);
  }, [handleMarkSeen, onTaskUpdate, tasks]);

  const handleComplete = useCallback(async (taskId: string) => {
    const task = tasks.find((item) => item.taskId === taskId);
    if (!task) {
      return;
    }

    setActivePrompt((prompt) => (prompt?.taskId === taskId ? null : prompt));
    setRemovingTaskIds((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });

    try {
      const response = await fetch(`/api/tasks/${taskId}/uncomplete`, {
        method: "POST",
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error("[CommitmentDock] Failed to accept task", {
          taskId,
          status: response.status,
          detail,
        });
      }
    } catch (error) {
      console.error("[CommitmentDock] Accept task error:", error);
    }

    try {
      await fetch(`/api/messages/${task.messageId}/interact`, {
        method: "POST",
      });
    } catch (error) {
      console.error("[CommitmentDock] Failed to mark message interacted:", error);
    }

    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }

    setTimeout(() => {
      setTasks((prev) => prev.filter((item) => item.taskId !== taskId));
      setRemovingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      onTaskUpdate();
    }, 300);
  }, [onTaskUpdate, selectedTaskId, tasks]);

  const handleIgnore = useCallback(async (taskId: string) => {
    const task = tasks.find((item) => item.taskId === taskId);
    if (!task) {
      return;
    }

    try {
      await fetch(`/api/messages/${task.messageId}/ignore`, {
        method: "POST",
      });
    } catch (error) {
      console.error("[CommitmentDock] Failed to mark ignored:", error);
    }

    setActivePrompt((prompt) => (prompt?.taskId === taskId ? null : prompt));
    setTasks((previous) =>
      previous.map((item) => (
        item.taskId === taskId
          ? { ...item, ignoredAt: new Date(), seenAt: item.seenAt ?? new Date() }
          : item
      ))
    );

    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }

    setToastMessage("Moved to back of queue");
  }, [selectedTaskId, tasks]);

  const handleIgnoreAndRemove = useCallback(async (taskId: string) => {
    const task = tasks.find((item) => item.taskId === taskId);
    if (!task) {
      return;
    }

    console.log("handleIgnoreAndRemove called for taskId:", taskId);
    console.log("Found task with messageId:", task.messageId);

    setActivePrompt((prompt) => (prompt?.taskId === taskId ? null : prompt));

    setRemovingTaskIds((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });

    try {
      const response = await fetch(`/api/messages/${task.messageId}/ignore`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => null);
      console.log("Ignore API response:", response.status, payload);

      if (!response.ok) {
        console.error("[CommitmentDock] Ignore failed", { status: response.status, body: payload });
        alert("Failed to ignore task. Please try again.");
        setRemovingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
        return;
      }
    } catch (error) {
      console.error("[CommitmentDock] Failed to mark ignored:", error);
      setRemovingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      return;
    }

    setTasks((previous) =>
      previous.map((item) => (
        item.taskId === taskId
          ? { ...item, ignoredAt: new Date(), seenAt: item.seenAt ?? new Date() }
          : item
      ))
    );

    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }

    console.log(`Task ignored and removed from dock: ${taskId}`);

    setTimeout(() => {
      setTasks((previous) => previous.filter((item) => item.taskId !== taskId));
      setRemovingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      onTaskUpdate();
    }, 300);
  }, [onTaskUpdate, selectedTaskId, tasks]);

  const handleOpenEmail = useCallback((taskId: string) => {
    const task = tasks.find((item) => item.taskId === taskId);
    if (!task || !task.gmailThreadId) {
      return;
    }

    if (typeof window !== "undefined") {
      const href = `https://mail.google.com/mail/u/0/#inbox/${task.gmailThreadId}`;
      window.open(href, "_blank", "noopener,noreferrer");
    }

    void handleInteraction(taskId);
  }, [handleInteraction, tasks]);

  const handleBackBurnerClick = useCallback(async (taskId: string) => {
    const task = tasks.find((item) => item.taskId === taskId);
    if (!task) {
      return;
    }

    setActivePrompt((prompt) => (prompt?.taskId === taskId ? null : prompt));

    setRemovingTaskIds((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });

    try {
      const response = await fetch(`/api/tasks/${task.taskId}/back-burner`, {
        method: "POST",
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error("[CommitmentDock] task back burner failed", {
          taskId,
          status: response.status,
          detail,
        });
        alert("Failed to move this task to Back Burner. Please try again.");
        setRemovingTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
        return;
      }
    } catch (error) {
      console.error("[CommitmentDock] task back burner error", error);
      alert("Failed to move this task to Back Burner. Please try again.");
      setRemovingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      return;
    }

    try {
      await fetch(`/api/messages/${task.messageId}/interact`, {
        method: "POST",
      });
    } catch (error) {
      console.error("[CommitmentDock] back burner interact error", error);
    }

    setTimeout(() => {
      setTasks((previous) => previous.filter((item) => item.taskId !== taskId));
      setRemovingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });

      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }

      onTaskUpdate();
    }, 300);
  }, [onTaskUpdate, selectedTaskId, tasks]);

  const handleCarouselSelection = useCallback((taskId: string | null) => {
    if (selectedTaskId && taskId !== selectedTaskId) {
      void handleMarkSeen(selectedTaskId);
    }

    if (!taskId && selectedTaskId) {
      void handleMarkSeen(selectedTaskId);
    }

    setSelectedTaskId(taskId);
  }, [handleMarkSeen, selectedTaskId]);

  const handleDirectSnooze = useCallback(async (
    taskId: string,
    option: "today" | "tomorrow" | "next-week",
  ) => {
    const task = tasks.find((item) => item.taskId === taskId);
    if (!task) {
      return;
    }

    const now = new Date();
    let until: Date;

    if (option === "today") {
      until = new Date(now);
      until.setHours(now.getHours() + 4);
    } else if (option === "tomorrow") {
      until = new Date(now);
      until.setDate(now.getDate() + 1);
      until.setHours(9, 0, 0, 0);
    } else {
      until = new Date(now);
      until.setDate(now.getDate() + 7);
      until.setHours(9, 0, 0, 0);
    }

    try {
      await fetch(`/api/messages/${task.messageId}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ until: until.toISOString() }),
      });
    } catch (error) {
      console.error("[CommitmentDock] Failed to snooze message:", error);
    }

    setTasks((previous) =>
      previous.map((item) => (
        item.taskId === taskId
          ? { ...item, snoozedUntil: until }
          : item
      ))
    );

    setToastMessage(
      `Snoozed until ${until.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`,
    );

    setActivePrompt((prompt) => (prompt?.taskId === taskId ? null : prompt));

    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }

    console.log(`Card snoozed, moved to back: ${taskId}`);
  }, [selectedTaskId, tasks]);

  const handleSnoozeClick = useCallback((taskId: string) => {
    setActivePrompt({ taskId, type: "snooze" });
  }, []);

  const handleRescheduleClick = useCallback((taskId: string) => {
    setActivePrompt({ taskId, type: "reschedule" });
  }, []);

  const handleSnoozeSelect = useCallback(async (option: "today" | "tomorrow" | "next-week") => {
    if (!activePrompt || activePrompt.type !== "snooze") {
      return;
    }

    const task = tasks.find((item) => item.taskId === activePrompt.taskId);
    if (!task) {
      return;
    }

    const now = new Date();
    let until: Date;

    if (option === "today") {
      until = new Date(now);
      until.setHours(now.getHours() + 4);
    } else if (option === "tomorrow") {
      until = new Date(now);
      until.setDate(now.getDate() + 1);
      until.setHours(9, 0, 0, 0);
    } else {
      until = new Date(now);
      until.setDate(now.getDate() + 7);
      until.setHours(9, 0, 0, 0);
    }

    await fetch(`/api/messages/${task.messageId}/snooze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ until: until.toISOString() }),
    });

    setTasks((previous) =>
      previous.map((item) => (
        item.taskId === activePrompt.taskId
          ? { ...item, snoozedUntil: until }
          : item
      ))
    );

    setActivePrompt(null);
    setToastMessage(`Snoozed until ${until.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`);

    if (selectedTaskId === activePrompt.taskId) {
      setSelectedTaskId(null);
    }
  }, [activePrompt, selectedTaskId, tasks]);

  const handleRescheduleSelect = useCallback(async (option: "tomorrow" | "this-week" | "next-week") => {
    if (!activePrompt || activePrompt.type !== "reschedule") {
      return;
    }

    const task = tasks.find((item) => item.taskId === activePrompt.taskId);
    if (!task) {
      return;
    }

    const promptTaskId = activePrompt.taskId;

    const now = new Date();
    let targetDate: Date;

    if (option === "tomorrow") {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(9, 0, 0, 0);
    } else {
      const computeFriday = (weeksOffset = 0) => {
        const candidate = new Date(now);
        const day = candidate.getDay();
        const daysUntilFriday = (5 - day + 7) % 7;
        candidate.setDate(candidate.getDate() + daysUntilFriday + weeksOffset * 7);
        candidate.setHours(17, 0, 0, 0);
        if (candidate <= now) {
          candidate.setDate(candidate.getDate() + 7);
        }
        return candidate;
      };

      targetDate = option === "this-week" ? computeFriday(0) : computeFriday(1);
    }

    await fetch(`/api/tasks/${task.taskId}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueAt: targetDate.toISOString() }),
    });

    await fetch(`/api/messages/${task.messageId}/interact`, {
      method: "POST",
    });

    setActivePrompt(null);

    const dateStr = targetDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    setToastMessage(`Rescheduled to ${dateStr} and added to Tasks`);

    setRemovingTaskIds((prev) => {
      const next = new Set(prev);
      next.add(promptTaskId);
      return next;
    });

    if (selectedTaskId === promptTaskId) {
      setSelectedTaskId(null);
    }

    setTimeout(() => {
      setTasks((previous) => previous.filter((item) => item.taskId !== promptTaskId));
      setRemovingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(promptTaskId);
        return next;
      });
      onTaskUpdate();
    }, 300);
  }, [activePrompt, onTaskUpdate, selectedTaskId, tasks]);

  const nowForFlags = new Date();

  const carouselTasks: TaskCarouselTask[] = sortedTasks.map((task) => ({
    id: task.taskId,
    title: task.taskData.title,
    dueDate: task.taskData.dueDate,
    isCompleted: false,
    isSeen: Boolean(task.seenAt),
    isIgnored: Boolean(task.ignoredAt),
    isSnoozed: Boolean(task.snoozedUntil && task.snoozedUntil > nowForFlags),
  }));

  const selectedTask = selectedTaskId
    ? tasks.find((task) => task.taskId === selectedTaskId)
    : null;

  const isRemovingSelected = selectedTaskId ? removingTaskIds.has(selectedTaskId) : false;

  if (isLoading) {
    return null;
  }

  if (tasks.length === 0) {
    return (
      <div className="mb-4 rounded-lg bg-[#5b4842] px-6 py-4 text-center">
        <span className="text-[16px] text-[#fef3ea]">All caught up! 🎉</span>
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-col gap-3">
      {selectedTask ? (
        <div className={`transition-all duration-300 ease-in-out ${isRemovingSelected ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}`}>
          <TaskCard
            {...selectedTask.taskData}
            variant="action-expanded"
            onSelect={() => {
              void handleInteraction(selectedTask.taskId);
            }}
            onComplete={() => {
              void handleComplete(selectedTask.taskId);
            }}
            showBackBurner={false}
          />
        </div>
      ) : null}

      <div className="max-w-full overflow-hidden">
        <TaskCarousel
          tasks={carouselTasks}
          removingIds={removingTaskIds}
          onComplete={(taskId) => {
            void handleComplete(taskId);
          }}
          onOpen={handleOpenEmail}
          onSnooze={handleSnoozeClick}
          onDirectSnooze={handleDirectSnooze}
          onReschedule={handleRescheduleClick}
          onBackBurner={(taskId) => {
            void handleBackBurnerClick(taskId);
          }}
          onIgnore={(taskId) => {
            void handleIgnore(taskId);
          }}
          onIgnoreAndRemove={(taskId) => {
            void handleIgnoreAndRemove(taskId);
          }}
          onSelectionChange={handleCarouselSelection}
        />
      </div>

      {activePrompt ? (
        <div className="mt-4 rounded-lg bg-[#5b4842] px-5 py-4">
          <p className="mb-3 text-[16px] text-[#F5F0E8]">
            {activePrompt.type === "snooze"
              ? "When should I remind you about this?"
              : "When should this be due?"}
          </p>
          <div className="flex flex-wrap gap-2">
            {activePrompt.type === "snooze" ? (
              <>
                <button
                  className="rounded bg-[#3A3A3A] px-4 py-2 text-[13px] uppercase tracking-wider text-[#F5F0E8] hover:bg-[#4A4A4A]"
                  onClick={() => {
                    void handleSnoozeSelect("today");
                  }}
                >
                  LATER TODAY
                </button>
                <button
                  className="rounded bg-[#3A3A3A] px-4 py-2 text-[13px] uppercase tracking-wider text-[#F5F0E8] hover:bg-[#4A4A4A]"
                  onClick={() => {
                    void handleSnoozeSelect("tomorrow");
                  }}
                >
                  TOMORROW
                </button>
                <button
                  className="rounded bg-[#3A3A3A] px-4 py-2 text-[13px] uppercase tracking-wider text-[#F5F0E8] hover:bg-[#4A4A4A]"
                  onClick={() => {
                    void handleSnoozeSelect("next-week");
                  }}
                >
                  NEXT WEEK
                </button>
              </>
            ) : (
              <>
                <button
                  className="rounded bg-[#3A3A3A] px-4 py-2 text-[13px] uppercase tracking-wider text-[#F5F0E8] hover:bg-[#4A4A4A]"
                  onClick={() => {
                    void handleRescheduleSelect("tomorrow");
                  }}
                >
                  TOMORROW
                </button>
                <button
                  className="rounded bg-[#3A3A3A] px-4 py-2 text-[13px] uppercase tracking-wider text-[#F5F0E8] hover:bg-[#4A4A4A]"
                  onClick={() => {
                    void handleRescheduleSelect("this-week");
                  }}
                >
                  THIS WEEK (FRI)
                </button>
                <button
                  className="rounded bg-[#3A3A3A] px-4 py-2 text-[13px] uppercase tracking-wider text-[#F5F0E8] hover:bg-[#4A4A4A]"
                  onClick={() => {
                    void handleRescheduleSelect("next-week");
                  }}
                >
                  NEXT WEEK (FRI)
                </button>
              </>
            )}
          </div>
          <button
            className="mt-3 text-[13px] text-[rgba(245,240,232,0.6)] hover:text-[#F5F0E8]"
            onClick={() => setActivePrompt(null)}
          >
            Cancel
          </button>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-lg bg-[#5b4842] px-4 py-2 text-[14px] text-[#F5F0E8] shadow-lg animate-fade-in z-50">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
