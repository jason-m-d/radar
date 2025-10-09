import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type MouseEvent as ReactMouseEvent } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUpRight, Calendar, Clock, Flame } from "lucide-react";

import TaskCard from "@/components/TaskCard";
import TaskCarousel from "@/components/TaskCarousel";
import type { TaskCarouselTask } from "@/components/TaskCarousel";

/**
 * NOTE: ActionMessage carousel logic is kept for backwards compatibility with
 * historical action messages. New action messages (type=ACTION) are filtered
 * out of chat and handled by CommitmentDock instead. This component only
 * renders for legacy action messages and non-ACTION message types.
 */

export type ActionMessageMetadata = {
  taskIds?: string[];
  projectIds?: string[];
};

export type ActionMessageTaskSummary = {
  id: string;
  title: string;
  dueDate: string;
  status: "action-needed" | "waiting" | "complete";
  priority: number;
  waitingOn?: string;
  subject?: string;
  backBurneredAt?: string | null;
  gmailThreadId?: string | null;
};

export type ActionMessageProjectSummary = {
  id: string;
  name: string;
  taskCount: number;
  lastActivity: string;
};

export type ActionMessagePayload = {
  id: string;
  content: string;
  confidence?: number | null;
  isRead: boolean;
  metadata?: ActionMessageMetadata | null;
  taskId?: string | null;
  projectId?: string | null;
  createdAt?: string;
};

type ActionMessageProps = {
  message: ActionMessagePayload;
  onOpenTask?: (taskId: string) => void;
  onOpenProject?: (projectId: string) => void;
  onSnooze?: (messageId: string) => void;
  onBackBurner?: (messageId: string, taskIds: string[]) => Promise<void> | void;
  onRead?: (messageId: string) => Promise<void> | void;
  onReschedule?: (messageId: string, taskIds: string[]) => Promise<void> | void;
  onCompleteTask?: (taskId: string) => Promise<void> | void;
};

type FetchState<T> = {
  loading: boolean;
  data: T[];
  error?: string;
};

const CONFIDENCE_COLORS: Array<{ min: number; max: number; background: string; text: string }> = [
  { min: 8, max: 10, background: "rgba(77, 144, 66, 0.2)", text: "#3E7A37" },
  { min: 5, max: 7.99, background: "rgba(204, 153, 51, 0.22)", text: "#A97710" },
  { min: 0, max: 4.99, background: "rgba(255, 84, 61, 0.22)", text: "#B53B27" }
];

function getConfidenceColors(confidence?: number | null) {
  if (confidence == null) {
    return { background: "rgba(232, 227, 216, 0.12)", text: "#E8E3D8" };
  }
  const palette = CONFIDENCE_COLORS.find(({ min, max }) => confidence >= min && confidence <= max);
  return palette ?? { background: "rgba(232, 227, 216, 0.12)", text: "#E8E3D8" };
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) {
    return "";
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return String(timestamp).toUpperCase();
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).toUpperCase();
}

async function fetchTaskSummaries(ids: string[]): Promise<ActionMessageTaskSummary[]> {
  if (!ids.length) {
    return [];
  }

  const response = await fetch(`/api/tasks/details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids })
  });

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  const data = (await response.json()) as { tasks: ActionMessageTaskSummary[] };
  return data.tasks ?? [];
}

async function fetchProjectSummaries(ids: string[]): Promise<ActionMessageProjectSummary[]> {
  if (!ids.length) {
    return [];
  }

  const response = await fetch(`/api/projects/details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids })
  });

  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }

  const data = (await response.json()) as { projects: ActionMessageProjectSummary[] };
  return data.projects ?? [];
}

const ActionMessage = ({ message, onOpenTask, onOpenProject, onSnooze, onBackBurner, onRead, onReschedule, onCompleteTask }: ActionMessageProps) => {
  const [tasksState, setTasksState] = useState<FetchState<ActionMessageTaskSummary>>({ loading: false, data: [] });
  const [projectsState, setProjectsState] = useState<FetchState<ActionMessageProjectSummary>>({ loading: false, data: [] });
  const [isBackBurnerPending, setBackBurnerPending] = useState(false);
  const [activePrompt, setActivePrompt] = useState<'snooze' | 'reschedule' | null>(null);
  const [snoozedUntil, setSnoozedUntil] = useState<Date | null>(null);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [snoozeMenuAnchorKey, setSnoozeMenuAnchorKey] = useState<string | null>(null);
  const [rescheduledTo, setRescheduledTo] = useState<Date | null>(null);
  const [showRescheduleMenu, setShowRescheduleMenu] = useState(false);
  const [rescheduleMenuAnchorKey, setRescheduleMenuAnchorKey] = useState<string | null>(null);
  const [selectedCarouselTaskId, setSelectedCarouselTaskId] = useState<string | null>(null);

  const snoozeButtonRef = useRef<HTMLButtonElement | null>(null);
  const snoozeMenuRef = useRef<HTMLDivElement | null>(null);
  const rescheduleButtonRef = useRef<HTMLButtonElement | null>(null);
  const rescheduleMenuRef = useRef<HTMLDivElement | null>(null);

  const allTaskIds = useMemo(() => {
    const ids = new Set<string>();
    if (message.taskId) {
      ids.add(message.taskId);
    }
    message.metadata?.taskIds?.forEach((id) => ids.add(id));
    return Array.from(ids);
  }, [message.metadata?.taskIds, message.taskId]);

  const allProjectIds = useMemo(() => {
    const ids = new Set<string>();
    if (message.projectId) {
      ids.add(message.projectId);
    }
    message.metadata?.projectIds?.forEach((id) => ids.add(id));
    return Array.from(ids);
  }, [message.metadata?.projectIds, message.projectId]);

  const carouselTasks: TaskCarouselTask[] = useMemo(() => (
    tasksState.data.map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      isCompleted: task.status === "complete",
      isSeen: false,
      isIgnored: false,
    }))
  ), [tasksState.data]);

  useEffect(() => {
    let cancelled = false;

    if (allTaskIds.length === 0) {
      setTasksState({ loading: false, data: [] });
    } else {
      setTasksState({ loading: true, data: [] });
      fetchTaskSummaries(allTaskIds)
        .then((data) => {
          if (!cancelled) {
            setTasksState({ loading: false, data });
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setTasksState({ loading: false, data: [], error: error instanceof Error ? error.message : String(error) });
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [allTaskIds.join("|")]);

  useEffect(() => {
    let cancelled = false;

    if (allProjectIds.length === 0) {
      setProjectsState({ loading: false, data: [] });
    } else {
      setProjectsState({ loading: true, data: [] });
      fetchProjectSummaries(allProjectIds)
        .then((data) => {
          if (!cancelled) {
            setProjectsState({ loading: false, data });
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setProjectsState({ loading: false, data: [], error: error instanceof Error ? error.message : String(error) });
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [allProjectIds.join("|")]);

  useEffect(() => {
    if (!showSnoozeMenu) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (snoozeMenuRef.current?.contains(target)) {
        return;
      }
      if (snoozeButtonRef.current?.contains(target)) {
        return;
      }
      setShowSnoozeMenu(false);
      setSnoozeMenuAnchorKey(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowSnoozeMenu, setSnoozeMenuAnchorKey, showSnoozeMenu]);

  useEffect(() => {
    if (!showRescheduleMenu) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rescheduleMenuRef.current?.contains(target)) {
        return;
      }
      if (rescheduleButtonRef.current?.contains(target)) {
        return;
      }
      setShowRescheduleMenu(false);
      setRescheduleMenuAnchorKey(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setRescheduleMenuAnchorKey, setShowRescheduleMenu, showRescheduleMenu]);

  const markAsRead = useCallback(() => {
    if (!message.isRead) {
      onRead?.(message.id);
    }
  }, [message.id, message.isRead, onRead]);

  const handleTaskClick = useCallback((taskId: string) => {
    markAsRead();
    onOpenTask?.(taskId);
  }, [markAsRead, onOpenTask]);

  const handleCarouselSelection = useCallback((taskId: string | null) => {
    setSelectedCarouselTaskId(taskId);
  }, []);

  const handleProjectClick = useCallback((projectId: string) => {
    markAsRead();
    onOpenProject?.(projectId);
  }, [markAsRead, onOpenProject]);

  const handleBackBurner = useCallback(async () => {
    if (!onBackBurner || !allTaskIds.length) {
      return;
    }
    setBackBurnerPending(true);
    try {
      await onBackBurner(message.id, allTaskIds);
      markAsRead();
    } finally {
      setBackBurnerPending(false);
    }
  }, [allTaskIds, markAsRead, message.id, onBackBurner]);

  const handleComplete = useCallback((taskId: string) => {
    setTasksState((prev) => ({
      ...prev,
      data: prev.data.map((task) => (
        task.id === taskId
          ? { ...task, status: "complete" as const }
          : task
      )),
    }));
    markAsRead();
    void onCompleteTask?.(taskId);
  }, [markAsRead, onCompleteTask]);

  const handleSnoozeSelect = useCallback(async (option: 'today' | 'tomorrow' | 'next-week') => {
    const now = new Date();
    let until: Date;

    if (option === 'today') {
      until = new Date(now);
      until.setHours(now.getHours() + 4);
    } else if (option === 'tomorrow') {
      until = new Date(now);
      until.setDate(now.getDate() + 1);
      until.setHours(9, 0, 0, 0);
    } else {
      until = new Date(now);
      until.setDate(now.getDate() + 7);
      until.setHours(9, 0, 0, 0);
    }

    markAsRead();
    setSnoozedUntil(until);
    setShowSnoozeMenu(false);
    setSnoozeMenuAnchorKey(null);
    setActivePrompt(null);
    onSnooze?.(message.id);

    await fetch(`/api/messages/${message.id}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ until: until.toISOString() })
    });
  }, [markAsRead, message.id, onSnooze, setActivePrompt, setShowSnoozeMenu, setSnoozedUntil, setSnoozeMenuAnchorKey]);

  const handleRescheduleSelect = useCallback(async (option: 'tomorrow' | 'this-week' | 'next-week') => {
    const now = new Date();
    let targetDate: Date;

    if (option === 'tomorrow') {
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

      targetDate = option === 'this-week' ? computeFriday(0) : computeFriday(1);
    }

    const primaryTaskId = allTaskIds[0];
    if (!primaryTaskId) {
      setShowRescheduleMenu(false);
      setRescheduleMenuAnchorKey(null);
      setActivePrompt(null);
      return;
    }

    markAsRead();
    setRescheduledTo(targetDate);
    setShowRescheduleMenu(false);
    setRescheduleMenuAnchorKey(null);
    setActivePrompt(null);
    onReschedule?.(message.id, allTaskIds);

    await fetch(`/api/tasks/${primaryTaskId}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueAt: targetDate.toISOString() })
    });
  }, [allTaskIds, markAsRead, message.id, onReschedule, setActivePrompt, setRescheduleMenuAnchorKey, setRescheduledTo, setShowRescheduleMenu]);

  const handleSnoozeButtonClick = useCallback((event: ReactMouseEvent<HTMLButtonElement>, anchorKey: string) => {
    snoozeButtonRef.current = event.currentTarget;
    if (snoozedUntil) {
      setSnoozeMenuAnchorKey(anchorKey);
      setShowSnoozeMenu(true);
      setActivePrompt(null);
      return;
    }
    setSnoozeMenuAnchorKey(null);
    setShowSnoozeMenu(false);
    setActivePrompt('snooze');
  }, [snoozedUntil, setActivePrompt, setShowSnoozeMenu, setSnoozeMenuAnchorKey]);

  const handleRescheduleButtonClick = useCallback((event: ReactMouseEvent<HTMLButtonElement>, anchorKey: string) => {
    rescheduleButtonRef.current = event.currentTarget;
    if (rescheduledTo) {
      setRescheduleMenuAnchorKey(anchorKey);
      setShowRescheduleMenu(true);
      setActivePrompt(null);
      return;
    }
    setRescheduleMenuAnchorKey(null);
    setShowRescheduleMenu(false);
    setActivePrompt('reschedule');
  }, [rescheduledTo, setActivePrompt, setRescheduleMenuAnchorKey, setShowRescheduleMenu]);

  const confidenceDisplay = typeof message.confidence === "number"
    ? Number(message.confidence.toFixed(1))
    : null;
  const { background: confidenceBg, text: confidenceText } = getConfidenceColors(confidenceDisplay ?? undefined);
  const showSnoozeButton = typeof onSnooze === "function";
  const showBackBurnerButton = typeof onBackBurner === "function";
  const showRescheduleButton = typeof onReschedule === "function";
  const showCarousel = tasksState.data.length >= 2;
  const selectedTask = selectedCarouselTaskId
    ? tasksState.data.find((task) => task.id === selectedCarouselTaskId) ?? null
    : null;

  useEffect(() => {
    if (!showCarousel && selectedCarouselTaskId !== null) {
      setSelectedCarouselTaskId(null);
      return;
    }

    if (selectedCarouselTaskId && !tasksState.data.some((task) => task.id === selectedCarouselTaskId)) {
      setSelectedCarouselTaskId(null);
    }
  }, [showCarousel, selectedCarouselTaskId, tasksState.data]);

  const renderControlButton = (
    icon: ReactNode,
    onClick: ((event: ReactMouseEvent<HTMLButtonElement>) => void) | undefined,
    hoverColor: string,
    disabled = false
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center"
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "9999px",
        opacity: disabled ? 0.3 : 0.4,
        filter: "grayscale(100%)",
        transition: "all 200ms ease",
        cursor: disabled ? "not-allowed" : "pointer",
        color: "#fef3ea",
      }}
      onMouseEnter={(event) => {
        if (disabled) {
          return;
        }
        event.currentTarget.style.opacity = "1";
        event.currentTarget.style.filter = "grayscale(0%)";
        event.currentTarget.style.color = hoverColor;
      }}
      onMouseLeave={(event) => {
        if (disabled) {
          return;
        }
        event.currentTarget.style.opacity = "0.4";
        event.currentTarget.style.filter = "grayscale(100%)";
        event.currentTarget.style.color = "#fef3ea";
      }}
    >
      {icon}
    </button>
  );

  return (
    <div className="mb-0" data-message-id={message.id}>
      <div className="flex flex-col">
        {message.createdAt ? (
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#A39A88]">
            {formatTimestamp(message.createdAt)}
          </p>
        ) : null}
        <div className="rounded-lg bg-[#5b4842] px-5 py-5 text-[#fef3ea] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
          <ReactMarkdown className="radar-markdown">
            {message.content}
          </ReactMarkdown>
        </div>
        <div className="relative mt-4">
          <div className="ml-12 flex flex-col" style={{ gap: "16px" }}>
            {(tasksState.loading || projectsState.loading) ? (
              <span className="text-[13px] uppercase tracking-[0.06em] text-[rgba(254,243,234,0.55)]">
                Loading details…
              </span>
            ) : null}
            {tasksState.error || projectsState.error ? (
              <span className="text-[13px] text-[rgba(254,243,234,0.75)]">
                Unable to load linked items. Try again later.
              </span>
            ) : null}
            {showCarousel ? (
              <div className="flex flex-col gap-4">
                <TaskCarousel
                  tasks={carouselTasks}
                  onComplete={handleComplete}
                  onOpen={handleTaskClick}
                  onSnooze={(_taskId) => {
                    /* will wire in future */
                  }}
                  onReschedule={(_taskId) => {
                    /* will wire in future */
                  }}
                  onBackBurner={(_taskId) => {
                    /* will wire in future */
                  }}
                  onIgnore={(_taskId) => {
                    /* will wire in future */
                  }}
                  onSelectionChange={handleCarouselSelection}
                />
                {selectedTask ? (
                  <TaskCard
                    {...selectedTask}
                    confidence={message.confidence ?? null}
                    variant="action-expanded"
                    onSelect={() => handleTaskClick(selectedTask.id)}
                    showBackBurner={false}
                  />
                ) : null}
              </div>
            ) : (
              tasksState.data.map((task) => (
                <div key={task.id} className="relative">
                  <div className="absolute left-[-48px] top-0 flex flex-col items-center" style={{ width: "32px", height: "112px", justifyContent: "space-evenly" }}>
                    {typeof confidenceDisplay === "number" ? (
                      <span
                        title="Confidence level"
                        className="flex items-center justify-center text-[14px] font-semibold"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "9999px",
                          backgroundColor: confidenceBg,
                          color: confidenceText,
                        }}
                      >
                        {confidenceDisplay}
                      </span>
                    ) : null}
                    {showSnoozeButton ? (
                      <div className="relative">
                        {renderControlButton(
                          <Clock
                            className={`h-4 w-4 ${snoozedUntil ? "animate-pulse" : ""}`.trim()}
                            style={snoozedUntil ? { filter: "drop-shadow(0 0 6px rgba(74, 158, 255, 0.9))" } : undefined}
                          />,
                          (event) => handleSnoozeButtonClick(event, task.id),
                          "#4A9EFF",
                          false
                        )}
                        {showSnoozeMenu && snoozedUntil && snoozeMenuAnchorKey === task.id ? (
                          <div
                            ref={snoozeMenuRef}
                            className="absolute left-0 top-full mt-2 rounded-lg bg-[#2A2A2A] p-4 shadow-lg"
                            style={{ width: "200px", zIndex: 9999 }}
                          >
                            <p className="mb-2 text-[13px] text-[#F5F0E8]">Snoozed until:</p>
                            <p className="mb-3 text-[15px] font-semibold text-[#4A9EFF]">
                              {snoozedUntil.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                            <button
                              onClick={() => {
                                setSnoozedUntil(null);
                                setShowSnoozeMenu(false);
                                setSnoozeMenuAnchorKey(null);
                              }}
                              className="w-full rounded bg-[#FF543D] px-3 py-2 text-[13px] uppercase text-white hover:bg-[#FF6B4A]"
                            >
                              Cancel Snooze
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {showBackBurnerButton && allTaskIds.length
                      ? renderControlButton(
                        <Flame className="h-4 w-4" />,
                        handleBackBurner,
                        "#FF8C42",
                        isBackBurnerPending
                      )
                      : null}
                    {showRescheduleButton && allTaskIds.length ? (
                      <div className="relative">
                        {renderControlButton(
                          <Calendar
                            className={`h-4 w-4 ${rescheduledTo ? "animate-pulse" : ""}`.trim()}
                            style={rescheduledTo ? { filter: "drop-shadow(0 0 6px rgba(77, 144, 66, 0.9))" } : undefined}
                          />,
                          (event) => handleRescheduleButtonClick(event, task.id),
                          "#4D9042",
                          false
                        )}
                        {showRescheduleMenu && rescheduledTo && rescheduleMenuAnchorKey === task.id ? (
                          <div
                            ref={rescheduleMenuRef}
                            className="absolute left-0 top-full mt-2 rounded-lg bg-[#2A2A2A] p-4 shadow-lg"
                            style={{ width: "200px", zIndex: 9999 }}
                          >
                            <p className="mb-2 text-[13px] text-[#F5F0E8]">Rescheduled to:</p>
                            <p className="mb-3 text-[15px] font-semibold text-[#4D9042]">
                              {rescheduledTo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <button
                              onClick={() => {
                                setRescheduledTo(null);
                                setShowRescheduleMenu(false);
                                setRescheduleMenuAnchorKey(null);
                              }}
                              className="w-full rounded bg-[#FF543D] px-3 py-2 text-[13px] uppercase text-white hover:bg-[#FF6B4A]"
                            >
                              Cancel Reschedule
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <TaskCard
                    {...task}
                    variant="action-message"
                    onSelect={() => handleTaskClick(task.id)}
                    onComplete={onCompleteTask ? () => handleComplete(task.id) : undefined}
                    showBackBurner={false}
                  />
                </div>
              ))
            )}
            <div
              className="ml-12 mt-4 overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: activePrompt === 'snooze' ? '200px' : '0px',
                opacity: activePrompt === 'snooze' ? 1 : 0
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[16px] text-[#F5F0E8]">When should I remind you about this?</p>
                <button
                  onClick={() => setActivePrompt(null)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[18px] text-[#F5F0E8] hover:bg-[rgba(255,255,255,0.1)]"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded bg-[#3A3A3A] px-4 py-2 text-[13px] uppercase tracking-wider text-[#F5F0E8] hover:bg-[#4A4A4A]"
                  onClick={() => handleSnoozeSelect('today')}
                >
                  LATER TODAY
                </button>
                <button
                  className="rounded bg-[#3A3A3A] px-4 py-2 text-[13px] uppercase tracking-wider text-[#F5F0E8] hover:bg-[#4A4A4A]"
                  onClick={() => handleSnoozeSelect('tomorrow')}
                >
                  TOMORROW
                </button>
                <button
                  className="rounded bg-[#3A3A3A] px-4 py-2 text-[13px] uppercase tracking-wider text-[#F5F0E8] hover:bg-[#4A4A4A]"
                  onClick={() => handleSnoozeSelect('next-week')}
                >
                  NEXT WEEK
                </button>
              </div>
              <p className="mt-2 text-[13px] text-[rgba(245,240,232,0.6)]">Or you can tell me in the chat.</p>
            </div>
            <div
              className="ml-12 mt-4 overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: activePrompt === 'reschedule' ? '200px' : '0px',
                opacity: activePrompt === 'reschedule' ? 1 : 0
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[16px] text-[#F5F0E8]">When should this be due?</p>
                <button
                  onClick={() => setActivePrompt(null)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[18px] text-[#F5F0E8] hover:bg-[rgba(255,255,255,0.1)]"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded bg-[#3A3A3A] px-4 py-2 text-[13px] uppercase tracking-wider text-[#F5F0E8] hover:bg-[#4A4A4A]"
                  onClick={() => handleRescheduleSelect('tomorrow')}
                >
                  TOMORROW
                </button>
                <button
                  className="rounded bg-[#3A3A3A] px-4 py-2 text-[13px] uppercase tracking-wider text-[#F5F0E8] hover:bg-[#4A4A4A]"
                  onClick={() => handleRescheduleSelect('this-week')}
                >
                  THIS WEEK (FRI)
                </button>
                <button
                  className="rounded bg-[#3A3A3A] px-4 py-2 text-[13px] uppercase tracking-wider text-[#F5F0E8] hover:bg-[#4A4A4A]"
                  onClick={() => handleRescheduleSelect('next-week')}
                >
                  NEXT WEEK (FRI)
                </button>
              </div>
              <p className="mt-2 text-[13px] text-[rgba(245,240,232,0.6)]">Or you can tell me in the chat.</p>
            </div>
            {projectsState.data.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleProjectClick(project.id)}
                className="group flex w-full cursor-pointer items-center gap-4 rounded-lg bg-[rgba(232,227,216,0.06)] px-5 py-4 text-left text-[#E8E3D8] transition duration-200 hover:bg-[rgba(232,227,216,0.12)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-[rgba(232,227,216,0.75)]">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <h3 className="text-[16px] font-semibold leading-tight tracking-[-0.01em]">{project.name}</h3>
                  <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.06em] text-[rgba(232,227,216,0.7)]">
                    <span>{project.taskCount} tasks</span>
                    <span className="h-1 w-1 rounded-full bg-[rgba(232,227,216,0.45)]"></span>
                    <span>{project.lastActivity}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionMessage;
