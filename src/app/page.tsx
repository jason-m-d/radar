"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import { ChevronDown, ChevronRight, Folder, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { TaskStatus } from "@prisma/client";

import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import TaskCard from "@/components/TaskCard";
import ProjectSubchat from "@/components/ProjectSubchat";
import TaskSubchat from "@/components/TaskSubchat";
import SignalCard from "@/components/SignalCard";
import CommitmentDock from "@/components/CommitmentDock";
import { animateDataFlow } from "@/lib/animations/dataFlow";
import type { ActionMessageMetadata } from "@/components/ActionMessage";

type TaskView = "tasks" | "radar" | "projects";

type TaskListItem = {
  id: string;
  title: string;
  dueDate: string;
  status: "action-needed" | "waiting" | "complete";
  priority: number;
  waitingOn?: string;
  subject?: string;
  backBurneredAt?: string | null;
  ignoredAt?: string | null;
};

type Project = {
  id: string;
  name: string;
  taskCount: number;
  lastActivity: string;
};

type MessageMetadata = ActionMessageMetadata & {
  snoozePrompt?: boolean;
  snoozeForMessageId?: string;
  reschedulePrompt?: boolean;
  rescheduleForTaskId?: string;
  rescheduleForMessageId?: string;
};

type Message = {
  id: string;
  message: string;
  content: string;
  isUser: boolean;
  timestamp?: string;
  type: "REGULAR" | "ACTION" | "CATCHUP";
  confidence?: number | null;
  taskId?: string | null;
  projectId?: string | null;
  metadata?: MessageMetadata | null;
  isRead?: boolean;
  snoozedUntil?: string | null;
  seenAt?: string | null;
  ignoredAt?: string | null;
};

type Signal = {
  id: string;
  subject: string;
  sender: string;
  senderEmail: string;
  receivedAt: string;
  hasTask: boolean;
  taskCount: number;
};

type TaskApiResponse = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: number;
  dueAt: string | null;
  updatedAt: string;
  backBurneredAt?: string | null;
  ignoredAt?: string | null;
  thread?: {
    id: string;
    subject: string | null;
    participants: string;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
};

const suggestionPills = [
  "Pull latest P&L?",
  "Draft report?",
  "Show expenses from Q1"
];

const viewOrder: TaskView[] = ["tasks", "radar", "projects"];
const LIST_TRANSITION_DURATION = 350;

function getFirstParticipantName(participants: string | null | undefined): string | undefined {
  if (!participants) {
    return undefined;
  }

  const extractName = (raw: string): string | undefined => {
    const match = raw.match(/"?([^"<]+)"?\s*<[^>]+>/);
    if (match) {
      return match[1].trim();
    }
    const emailMatch = raw.match(/<([^>]+)>/);
    if (emailMatch) {
      const email = emailMatch[1].trim();
      return email.split("@")[0] ?? email;
    }
    const value = raw.trim();
    return value.length ? value : undefined;
  };

  try {
    const parsed = JSON.parse(participants);
    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        if (typeof entry === "string") {
          const name = extractName(entry);
          if (name) {
            return name;
          }
          continue;
        }
        if (entry && typeof entry === "object") {
          const maybeName = "name" in entry && typeof (entry as { name?: unknown }).name === "string"
            ? ((entry as { name?: string }).name as string)
            : undefined;
          if (maybeName?.trim()) {
            return maybeName.trim();
          }
          const maybeEmail = "email" in entry && typeof (entry as { email?: unknown }).email === "string"
            ? ((entry as { email?: string }).email as string)
            : undefined;
          if (maybeEmail?.trim()) {
            const email = maybeEmail.trim();
            return email.split("@")[0] ?? email;
          }
        }
      }
    }
  } catch {
    const name = extractName(participants);
    if (name) {
      return name;
    }
  }

  return undefined;
}

function formatDueDate(dueAt: string | null): string {
  if (!dueAt) {
    return "No due date";
  }

  const dueDate = new Date(dueAt);
  if (Number.isNaN(dueDate.getTime())) {
    return "No due date";
  }

  const now = new Date();
  const dayInMs = 24 * 60 * 60 * 1000;
  const diffMs = dueDate.getTime() - now.getTime();

  if (dueDate.toDateString() === now.toDateString()) {
    return "Due today";
  }

  if (diffMs > 0 && diffMs <= dayInMs) {
    return "Due today";
  }

  if (diffMs > dayInMs && diffMs <= dayInMs * 2) {
    return "Due tomorrow";
  }

  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric"
  }).format(dueDate);

  return `Due ${formatted}`;
}

function clampPriority(priority: number | null | undefined): number {
  if (typeof priority !== "number" || Number.isNaN(priority)) {
    return 3;
  }
  return Math.min(Math.max(priority, 1), 3);
}

function transformTaskForCard(task: TaskApiResponse): TaskListItem {
  const status: TaskListItem["status"] = (() => {
    switch (task.status) {
      case TaskStatus.TODO:
        return "action-needed";
      case TaskStatus.WAITING_THEM:
      case TaskStatus.WAITING_YOU:
        return "waiting";
      case TaskStatus.DONE:
        return "complete";
      default:
        return "action-needed";
    }
  })();

  const primaryParticipant = getFirstParticipantName(task.thread?.participants);
  const waitingOn = status === "waiting"
    ? primaryParticipant
    : undefined;

  const rawTitle = typeof task.title === "string" ? task.title.trim() : "";
  const fallbackSender = primaryParticipant || task.project?.name || "RADAR";
  const placeholderTitle = fallbackSender ? `Task from ${fallbackSender}` : "Task from RADAR";
  const title = rawTitle.length ? rawTitle : placeholderTitle;

  return {
    id: task.id,
    title,
    status,
    dueDate: formatDueDate(task.dueAt),
    priority: clampPriority(task.priority),
    waitingOn,
    subject: task.thread?.subject?.trim() || undefined,
    backBurneredAt: task.backBurneredAt ?? null,
    ignoredAt: task.ignoredAt ?? null,
  };
}

type SnoozeOption = "later_today" | "tomorrow" | "next_week";

function calculateSnoozeDate(option: SnoozeOption): Date {
  const now = new Date();

  if (option === "later_today") {
    const laterToday = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    if (laterToday.getDate() !== now.getDate()) {
      laterToday.setHours(17, 0, 0, 0);
    }
    return laterToday;
  }

  if (option === "tomorrow") {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(9, 0, 0, 0);
  return nextWeek;
}

function formatSnoozeDescription(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

function parseCustomSnoozeInput(input: string): { until: Date; label: string } | null {
  const normalized = input.trim().toLowerCase();

  if (!normalized.length) {
    return null;
  }

  if (normalized.includes("tomorrow")) {
    const date = calculateSnoozeDate("tomorrow");
    return { until: date, label: formatSnoozeDescription(date) };
  }

  if (normalized.includes("next week")) {
    const date = calculateSnoozeDate("next_week");
    return { until: date, label: formatSnoozeDescription(date) };
  }

  if (normalized.includes("later") && normalized.includes("today")) {
    const date = calculateSnoozeDate("later_today");
    return { until: date, label: formatSnoozeDescription(date) };
  }

  const parsed = Date.parse(input);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    return { until: date, label: formatSnoozeDescription(date) };
  }

  return null;
}

type ActiveSubchat =
  | { type: "task"; id: string }
  | { type: "project"; id: string }
  | null;

type SubchatOverlayProps = {
  onClose: () => void;
  children: ReactNode;
};

const SubchatOverlay = ({ onClose, children }: SubchatOverlayProps) => {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex justify-end">
        <div
          className={`h-full transform transition-transform duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
            entered ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ width: "calc(100% - 80px)" }}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default function ChatPage() {
  const [activeView, setActiveView] = useState<TaskView>("tasks");
  const [renderedView, setRenderedView] = useState<TaskView>("tasks");
  const [isListExiting, setIsListExiting] = useState(false);
  const [isListEntering, setIsListEntering] = useState(false);
  const [isBackBurnerOpen, setIsBackBurnerOpen] = useState(false);
  const [isIgnoredOpen, setIsIgnoredOpen] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [snoozeContext, setSnoozeContext] = useState<{
    actionMessageId: string;
    promptMessageId: string;
  } | null>(null);
  const [rescheduleContext, setRescheduleContext] = useState<{
    taskId: string;
    promptMessageId: string;
    actionMessageId: string | null;
  } | null>(null);
  const [backBurnerPulse, setBackBurnerPulse] = useState(false);
  const [ignoredPulse, setIgnoredPulse] = useState(false);
  const [tasks, setTasks] = useState<TaskApiResponse[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [activeSubchat, setActiveSubchat] = useState<ActiveSubchat>(null);
  const tabs: { id: TaskView; label: string }[] = [
    { id: "tasks", label: "Tasks" },
    { id: "radar", label: "Radar" },
    { id: "projects", label: "Projects" },
  ];
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<TaskView, HTMLButtonElement | null>>({
    tasks: null,
    radar: null,
    projects: null,
  });
  const [tabIndicator, setTabIndicator] = useState<{ width: number; offset: number }>(
    { width: 0, offset: 0 }
  );
  const [transitionDirection, setTransitionDirection] = useState<"left" | "right">("right");
  const sidebarScrollRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const router = useRouter();

  const nonActionMessages = messages.filter((message) => message.type !== "ACTION");

  const loadMessages = useCallback(
    async (withSpinner = true) => {
      if (withSpinner) {
        setMessagesLoading(true);
      }
      try {
        const response = await fetch("/api/messages");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load messages");
        }
        const mappedMessages: Message[] = Array.isArray(data.messages)
          ? data.messages.map((entry: Record<string, unknown>) => {
              const rawMessage = typeof entry.message === "string" ? entry.message : typeof entry.content === "string" ? entry.content : "";
              const metadata = entry.metadata && typeof entry.metadata === "object" ? (entry.metadata as MessageMetadata) : null;

              return {
                id: String(entry.id ?? ""),
                message: rawMessage,
                content: rawMessage,
                isUser: Boolean(entry.isUser),
                timestamp: typeof entry.timestamp === "string" ? entry.timestamp : undefined,
                type: entry.type === "ACTION" || entry.type === "CATCHUP" ? (entry.type as Message["type"]) : "REGULAR",
                confidence: typeof entry.confidence === "number" ? entry.confidence : null,
                taskId: typeof entry.taskId === "string" ? entry.taskId : null,
                projectId: typeof entry.projectId === "string" ? entry.projectId : null,
                metadata,
                isRead: typeof entry.isRead === "boolean" ? entry.isRead : false,
                snoozedUntil: typeof entry.snoozedUntil === "string" ? entry.snoozedUntil : null,
              };
            })
          : [];

        const catchupMessages = mappedMessages.filter((entry) => entry.type === "CATCHUP");
        const otherMessages = mappedMessages.filter((entry) => entry.type !== "CATCHUP");
        setMessages([...catchupMessages, ...otherMessages]);
      } catch (error) {
        console.error("[ui] Failed to load messages", error);
        if (withSpinner) {
          setMessages([]);
        }
      } finally {
        if (withSpinner) {
          setMessagesLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;
    async function loadTasks() {
      setTasksLoading(true);
      try {
        const response = await fetch("/api/tasks");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load tasks");
        }
        if (!active) return;
        const payload: TaskApiResponse[] = Array.isArray(data.tasks)
          ? data.tasks
          : [];
        setTasks(payload);
      } catch (error) {
        console.error("[ui] Failed to load tasks", error);
        if (active) {
          setTasks([]);
        }
      } finally {
        if (active) {
          setTasksLoading(false);
        }
      }
    }

    void loadTasks();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      setProjectsLoading(true);
      try {
        const response = await fetch("/api/projects");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load projects");
        }
        if (!active) return;
        setProjects(Array.isArray(data.projects) ? data.projects : []);
      } catch (error) {
        console.error("[ui] Failed to load projects", error);
        if (active) {
          setProjects([]);
        }
      } finally {
        if (active) {
          setProjectsLoading(false);
        }
      }
    }

    void loadProjects();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadSignals() {
      setSignalsLoading(true);
      try {
        const response = await fetch("/api/signals");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load signals");
        }
        if (!active) return;
        setSignals(Array.isArray(data.signals) ? data.signals : []);
      } catch (error) {
        console.error("[ui] Failed to load signals", error);
        if (active) {
          setSignals([]);
        }
      } finally {
        if (active) {
          setSignalsLoading(false);
        }
      }
    }

    void loadSignals();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      shouldAutoScrollRef.current = distanceFromBottom <= 80;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (messagesLoading) {
      return;
    }

    const container = chatContainerRef.current;
    if (!container) {
      return;
    }

    if (shouldAutoScrollRef.current) {
      container.scrollTop = container.scrollHeight;
    }

    const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
    shouldAutoScrollRef.current = distanceFromBottom <= 80;
  }, [messagesLoading, messages.length]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCatchup() {
      try {
        const response = await fetch("/api/messages/catchup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (cancelled) {
          return;
        }

        if (!cancelled && data && typeof data === "object" && "message" in data && data.message) {
          setMessages((previous) => previous.map((entry) => (
            entry.type === "ACTION"
              ? { ...entry, isRead: true }
              : entry
          )));
          void loadMessages(false);
        }
      } catch (error) {
        console.error("[ui] catch-up fetch", error);
      }
    }

    void fetchCatchup();

    return () => {
      cancelled = true;
    };
  }, [loadMessages]);

  useEffect(() => {
    const node = sidebarScrollRef.current;
    if (!node) {
      return;
    }

    let offset = 0;
    let releaseTimeout: number | null = null;
    let rafId: number | null = null;
    let lastTouchY = 0;

    const applyOffset = (value: number) => {
      offset = value;
      if (Math.abs(value) < 0.5) {
        node.style.transform = "";
      } else {
        node.style.transform = `translateY(${value}px)`;
      }
    };

    const release = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      const animate = () => {
        offset *= 0.6;
        applyOffset(offset);
        if (Math.abs(offset) < 0.5) {
          applyOffset(0);
          rafId = null;
          return;
        }
        rafId = requestAnimationFrame(animate);
      };
      rafId = requestAnimationFrame(animate);
    };

    const scheduleRelease = () => {
      if (releaseTimeout) {
        window.clearTimeout(releaseTimeout);
      }
      releaseTimeout = window.setTimeout(() => {
        release();
      }, 80);
    };

    const handleWheel = (event: WheelEvent) => {
      const atTop = node.scrollTop <= 0 && event.deltaY < 0;
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1 && event.deltaY > 0;

      if (atTop || atBottom) {
        event.preventDefault();
        const proposed = offset - event.deltaY * 0.25;
        applyOffset(Math.max(Math.min(proposed, 60), -60));
        scheduleRelease();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return;
      }
      lastTouchY = event.touches[0].clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return;
      }
      const currentY = event.touches[0].clientY;
      const deltaY = currentY - lastTouchY;
      lastTouchY = currentY;

      const atTop = node.scrollTop <= 0 && deltaY > 0;
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1 && deltaY < 0;

      if (atTop || atBottom) {
        event.preventDefault();
        const proposed = offset + deltaY * 0.4;
        applyOffset(Math.max(Math.min(proposed, 60), -60));
        scheduleRelease();
      }
    };

    const handleTouchEnd = () => {
      scheduleRelease();
    };

    node.style.willChange = "transform";
    node.addEventListener("wheel", handleWheel, { passive: false });
    node.addEventListener("touchstart", handleTouchStart, { passive: true });
    node.addEventListener("touchmove", handleTouchMove, { passive: false });
    node.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      applyOffset(0);
      node.style.willChange = "";
      node.removeEventListener("wheel", handleWheel);
      node.removeEventListener("touchstart", handleTouchStart);
      node.removeEventListener("touchmove", handleTouchMove);
      node.removeEventListener("touchend", handleTouchEnd);
      if (releaseTimeout) {
        window.clearTimeout(releaseTimeout);
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [renderedView]);

  useEffect(() => {
    if (activeView === renderedView) {
      return;
    }

    const currentIndex = Math.max(viewOrder.indexOf(renderedView), 0);
    const nextIndex = Math.max(viewOrder.indexOf(activeView), 0);
    const direction = nextIndex >= currentIndex ? "right" : "left";

    setTransitionDirection(direction);
    setIsListExiting(true);
    setIsListEntering(false);

    let enterTimeout: ReturnType<typeof setTimeout> | undefined;

    const exitTimeout = window.setTimeout(() => {
      setRenderedView(activeView);
      setIsListExiting(false);
      setIsListEntering(true);

      enterTimeout = window.setTimeout(() => {
        setIsListEntering(false);
      }, LIST_TRANSITION_DURATION);
    }, LIST_TRANSITION_DURATION);

    return () => {
      clearTimeout(exitTimeout);
      if (enterTimeout) {
        clearTimeout(enterTimeout);
      }
    };
  }, [activeView, renderedView]);

  const displayTasks = tasks.map(transformTaskForCard);
  const activeTasks = displayTasks.filter((task) => !task.ignoredAt && !task.backBurneredAt && task.status !== "complete");
  const completedTasks = displayTasks.filter((task) => task.status === "complete" && !task.ignoredAt && !task.backBurneredAt);
  const backBurnerTasks = displayTasks.filter((task) => Boolean(task.backBurneredAt));
  const ignoredTasks = displayTasks.filter((task) => Boolean(task.ignoredAt) && !task.backBurneredAt);
  const previousIgnoredCountRef = useRef<number>(ignoredTasks.length);

  useEffect(() => {
    if (ignoredTasks.length > previousIgnoredCountRef.current) {
      setIgnoredPulse(true);
      window.setTimeout(() => setIgnoredPulse(false), 600);
      setIsIgnoredOpen(true);
    }

    previousIgnoredCountRef.current = ignoredTasks.length;
  }, [ignoredTasks.length]);

  const updateTabIndicator = useCallback(() => {
    const container = tabListRef.current;
    const activeTab = tabRefs.current[activeView];

    if (!container || !activeTab) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    setTabIndicator({
      width: tabRect.width,
      offset: tabRect.left - containerRect.left,
    });
  }, [activeView]);

  useLayoutEffect(() => {
    updateTabIndicator();
  }, [updateTabIndicator]);

  useEffect(() => {
    updateTabIndicator();
  }, [activeView, updateTabIndicator]);

  useEffect(() => {
    const handleResize = () => updateTabIndicator();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateTabIndicator]);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    setMessages((previous) => previous.map((message) => (
      message.id === messageId
        ? { ...message, isRead: true }
        : message
    )));

    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to mark message as read");
      }
    } catch (error) {
      console.error("[ui] mark message read", error);
    }
  }, []);

  const applySnoozeSelection = useCallback(
    async (
      actionMessageId: string,
      promptMessageId: string | null,
      until: Date,
      label: string
    ) => {
      try {
        const response = await fetch(`/api/messages/${actionMessageId}/snooze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ until: until.toISOString() })
        });

        if (!response.ok) {
          throw new Error("Failed to snooze message");
        }

        markMessageAsRead(actionMessageId);

        const confirmation: Message = {
          id: `snooze-confirm-${Date.now()}`,
          message: `Got it, I'll ping you ${label}.`,
          content: `Got it, I'll ping you ${label}.`,
          isUser: false,
          timestamp: new Date().toLocaleString(),
          type: "REGULAR",
          confidence: null,
          taskId: null,
          projectId: null,
          metadata: null,
          isRead: true,
          snoozedUntil: null,
        };

        setMessages((previous) => {
          const filtered = promptMessageId
            ? previous.filter((msg) => msg.id !== promptMessageId)
            : previous;

          const updated = filtered.map((msg) => (
            msg.id === actionMessageId
              ? { ...msg, snoozedUntil: until.toISOString(), isRead: true }
              : msg
          ));

          return [...updated, confirmation];
        });

        setSnoozeContext(null);
      } catch (error) {
        console.error("[ui] snooze", error);
        alert("Failed to snooze this message. Please try again.");
      }
    },
    [markMessageAsRead],
  );

  const applyRescheduleSelection = useCallback(
    async (
      taskId: string,
      promptMessageId: string | null,
      dueAt: Date,
      label: string,
    ) => {
      try {
        const response = await fetch(`/api/tasks/${taskId}/reschedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueAt: dueAt.toISOString() }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[ui] reschedule", { taskId, status: response.status, body: errorText });
          throw new Error("Failed to reschedule task");
        }

        const data = await response.json().catch(() => ({}));
        const updatedTask = (data && typeof data === "object" && "task" in data)
          ? (data.task as { id: string; projectId?: string | null } | undefined)
          : undefined;

        setTasks((previous) => previous.map((task) => (
          task.id === taskId
            ? {
                ...task,
                dueAt: dueAt.toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : task
        )));

        const confirmation: Message = {
          id: `reschedule-confirm-${Date.now()}`,
          message: `Updated due date to ${label}.`,
          content: `Updated due date to ${label}.`,
          isUser: false,
          timestamp: new Date().toLocaleString(),
          type: "REGULAR",
          confidence: null,
          taskId,
          projectId: updatedTask?.projectId ?? null,
          metadata: null,
          isRead: true,
          snoozedUntil: null,
        };

        setMessages((previous) => {
          const withoutPrompt = promptMessageId
            ? previous.filter((msg) => msg.id !== promptMessageId)
            : previous;

          return [...withoutPrompt, confirmation];
        });

        setRescheduleContext(null);
      } catch (error) {
        console.error("[ui] reschedule", error);
        alert("Failed to reschedule this task. Please try again.");
      }
    },
    [],
  );

  const handleSendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      const tempMessage: Message = {
        id: `local-${Date.now()}`,
        message: trimmed,
        content: trimmed,
        isUser: true,
        timestamp: new Date().toLocaleString(),
        type: "REGULAR",
        confidence: null,
        taskId: null,
        projectId: null,
        metadata: null,
        isRead: true,
        snoozedUntil: null,
      };

      setMessages((prev) => [...prev, tempMessage]);

      const pendingSnooze = snoozeContext;
      const pendingReschedule = rescheduleContext;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, threadId: null }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Chat failed");
        }
        await loadMessages(false);

        if (pendingSnooze) {
          const parsed = parseCustomSnoozeInput(trimmed);
          if (parsed) {
            await applySnoozeSelection(
              pendingSnooze.actionMessageId,
              pendingSnooze.promptMessageId,
              parsed.until,
              parsed.label
            );
          }
        }
        if (pendingReschedule) {
          const parsed = parseCustomSnoozeInput(trimmed);
          if (parsed) {
            await applyRescheduleSelection(
              pendingReschedule.taskId,
              pendingReschedule.promptMessageId,
              parsed.until,
              parsed.label,
            );
          }
        }
      } catch (error) {
        console.error("[ui] Failed to send message", error);
        alert("Failed to send message. Please try again.");
        await loadMessages(false);
      }
    },
    [applyRescheduleSelection, applySnoozeSelection, loadMessages, rescheduleContext, snoozeContext],
  );

  const handleOpenTaskSubchat = (taskId: string) => {
    setActiveSubchat({ type: "task", id: taskId });
  };

  const handleOpenProjectSubchat = (projectId: string) => {
    setActiveSubchat({ type: "project", id: projectId });
  };

  const handleOpenSignal = (signalId: string) => {
    console.log("Open signal thread", signalId);
  };

  const closeSubchat = () => {
    setActiveSubchat(null);
  };

  const handleCompleteTask = useCallback(async (taskId: string) => {
    if (completingTaskId && completingTaskId !== taskId) {
      return;
    }

    let previousTasksSnapshot: TaskApiResponse[] = [];
    setCompletingTaskId(taskId);
    setTasks((previous) => {
      previousTasksSnapshot = previous.map((task) => ({ ...task }));
      return previous.map((task) =>
        task.id === taskId
          ? { ...task, status: TaskStatus.DONE, backBurneredAt: null }
          : task
      );
    });

    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to complete task");
      }

      const data = (await response.json()) as { task?: { id: string; status?: TaskStatus } };
      if (data?.task?.id) {
        setTasks((current) =>
          current.map((task) =>
            task.id === data.task!.id
              ? { ...task, status: data.task!.status ?? TaskStatus.DONE, backBurneredAt: null }
              : task
          )
        );
      }

      animateDataFlow(null, taskId);
    } catch (error) {
      console.error("[ui] Failed to complete task", error);
      setTasks(previousTasksSnapshot);
      alert("Failed to complete task. Please try again.");
    } finally {
      setCompletingTaskId(null);
    }
  }, [completingTaskId]);

  const handleBackBurnerAction = useCallback(async (messageId: string, taskIds: string[]) => {
    if (!taskIds.length) {
      return;
    }

    markMessageAsRead(messageId);

    try {
      const response = await fetch(`/api/messages/${messageId}/back-burner`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to move to back burner");
      }

      setTasks((previous) => previous.map((task) => (
        taskIds.includes(task.id)
          ? {
              ...task,
              backBurneredAt: new Date().toISOString(),
            }
          : task
      )));

      animateDataFlow(messageId, taskIds[0]);

      window.setTimeout(() => {
        setMessages((previous) => previous.filter((message) => message.id !== messageId));
      }, 500);

      setBackBurnerPulse(true);
      window.setTimeout(() => setBackBurnerPulse(false), 600);
      setIsBackBurnerOpen(true);
    } catch (error) {
      console.error("[ui] back burner action", error);
      alert("Failed to move to Back Burner. Please try again.");
    }
  }, [markMessageAsRead]);

  const handleTaskBackBurner = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/back-burner`, {
        method: "POST",
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error("[ui] task back burner", { taskId, status: response.status, body: detail });
        throw new Error("Failed to move task to Back Burner");
      }

      const data = await response.json().catch(() => ({}));
      const updated = data && typeof data === "object" && "task" in data
        ? (data.task as { backBurneredAt?: string | null })
        : null;
      const backBurneredAt = updated?.backBurneredAt ?? new Date().toISOString();

      setTasks((previous) => previous.map((task) => (
        task.id === taskId
          ? { ...task, backBurneredAt }
          : task
      )));

      setBackBurnerPulse(true);
      window.setTimeout(() => setBackBurnerPulse(false), 600);
      setIsBackBurnerOpen(true);
    } catch (error) {
      console.error("[ui] task back burner", error);
      alert("Failed to move this task to Back Burner. Please try again.");
    }
  }, []);

  const handleUncompleteTask = useCallback(async (taskId: string) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? { ...task, status: TaskStatus.TODO, backBurneredAt: null }
          : task
      )
    );

    try {
      const response = await fetch(`/api/tasks/${taskId}/uncomplete`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to mark task as incomplete");
      }

      const data = await response.json().catch(() => ({}));
      const updatedTask = data && typeof data === "object" && "task" in data
        ? (data.task as { id: string; status?: TaskStatus; backBurneredAt?: string | null })
        : null;

      if (updatedTask?.id) {
        setTasks((current) =>
          current.map((task) =>
            task.id === updatedTask.id
              ? {
                  ...task,
                  status: updatedTask.status ?? TaskStatus.TODO,
                  backBurneredAt: updatedTask.backBurneredAt ?? null,
                }
              : task
          )
        );
      }
    } catch (error) {
      console.error("[ui] uncomplete task", error);
      alert("Failed to mark task as incomplete. Please try again.");
      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId
            ? { ...task, status: TaskStatus.DONE }
            : task
        )
      );
    }
  }, []);

  const handleDockTaskUpdate = useCallback(() => {
    setTasksLoading(true);
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data: { tasks?: TaskApiResponse[] }) => {
        setTasks(data.tasks ?? []);
        setTasksLoading(false);
      })
      .catch((error) => {
        console.error("[page] Failed to refetch tasks:", error);
        setTasksLoading(false);
      });
  }, []);

  const handleRescheduleAction = useCallback((messageId: string, taskIds: string[]) => {
    if (!taskIds.length) {
      console.warn("[ui] reschedule", "no task ids supplied");
      return;
    }

    const targetTaskId = taskIds[0];
    if (!targetTaskId) {
      return;
    }

    let promptId = "";

    setMessages((previous) => {
      const existingPrompt = previous.find((msg) => msg.metadata?.reschedulePrompt && msg.metadata.rescheduleForTaskId === targetTaskId);
      if (existingPrompt) {
        promptId = existingPrompt.id;
        return previous;
      }

      promptId = `reschedule-${targetTaskId}-${Date.now()}`;
      const promptMessage: Message = {
        id: promptId,
        message: "When should this be due? Type a date or timeframe and I'll reschedule the task.",
        content: "When should this be due? Type a date or timeframe and I'll reschedule the task.",
        isUser: false,
        timestamp: new Date().toLocaleString(),
        type: "REGULAR",
        confidence: null,
        taskId: targetTaskId,
        projectId: null,
        metadata: {
          reschedulePrompt: true,
          rescheduleForTaskId: targetTaskId,
          rescheduleForMessageId: messageId,
        },
        isRead: true,
        snoozedUntil: null,
      };

      return [...previous, promptMessage];
    });

    if (promptId) {
      setRescheduleContext({
        taskId: targetTaskId,
        promptMessageId: promptId,
        actionMessageId: messageId,
      });
    }
  }, []);

  const showSnoozePrompt = useCallback((actionMessageId: string) => {
    let promptId: string | null = null;

    setMessages((previous) => {
      const existingPrompt = previous.find((msg) => msg.metadata?.snoozePrompt && msg.metadata.snoozeForMessageId === actionMessageId);
      if (existingPrompt) {
        promptId = existingPrompt.id;
        return previous;
      }

      promptId = `snooze-${actionMessageId}-${Date.now()}`;
      const actionMessage = previous.find((msg) => msg.id === actionMessageId);

      const metadata: MessageMetadata = {
        snoozePrompt: true,
        snoozeForMessageId: actionMessageId,
        taskIds: actionMessage?.metadata?.taskIds,
        projectIds: actionMessage?.metadata?.projectIds,
      };

      const promptMessage: Message = {
        id: promptId,
        message: "When should I remind you about this?",
        content: "When should I remind you about this?",
        isUser: false,
        timestamp: new Date().toLocaleString(),
        type: "REGULAR",
        confidence: null,
        taskId: null,
        projectId: null,
        metadata,
        isRead: true,
        snoozedUntil: null,
      };

      return [...previous, promptMessage];
    });

    if (promptId) {
      setSnoozeContext({ actionMessageId, promptMessageId: promptId });
    }
  }, []);

  const handleSnoozeOptionSelect = useCallback(
    (actionMessageId: string, promptMessageId: string, option: SnoozeOption) => {
      const labelMap: Record<SnoozeOption, string> = {
        later_today: "Later Today",
        tomorrow: "Tomorrow",
        next_week: "Next Week",
      };

      const scheduled = calculateSnoozeDate(option);
      const label = formatSnoozeDescription(scheduled);

      const userMessage: Message = {
        id: `snooze-option-${Date.now()}`,
        message: labelMap[option],
        content: labelMap[option],
        isUser: true,
        timestamp: new Date().toLocaleString(),
        type: "REGULAR",
        confidence: null,
        taskId: null,
        projectId: null,
        metadata: null,
        isRead: true,
        snoozedUntil: null,
      };

      setMessages((previous) => [...previous, userMessage]);

      applySnoozeSelection(actionMessageId, promptMessageId, scheduled, label);
    },
    [applySnoozeSelection]
  );

  const handleSnoozeCustomSelect = useCallback((actionMessageId: string, promptMessageId: string) => {
    setSnoozeContext({ actionMessageId, promptMessageId });
  }, []);

  const handleRescheduleOptionSelect = useCallback((taskId: string, promptMessageId: string, option: SnoozeOption) => {
    const labelMap: Record<SnoozeOption, string> = {
      later_today: "Later Today",
      tomorrow: "Tomorrow",
      next_week: "Next Week",
    };

    const scheduled = calculateSnoozeDate(option);
    const label = formatSnoozeDescription(scheduled);

    const userMessage: Message = {
      id: `reschedule-option-${Date.now()}`,
      message: labelMap[option],
      content: labelMap[option],
      isUser: true,
      timestamp: new Date().toLocaleString(),
      type: "REGULAR",
      confidence: null,
      taskId: null,
      projectId: null,
      metadata: null,
      isRead: true,
      snoozedUntil: null,
    };

    setMessages((previous) => [...previous, userMessage]);
    setRescheduleContext(null);
    void applyRescheduleSelection(taskId, promptMessageId, scheduled, label);
  }, [applyRescheduleSelection]);

  const listLabel = (() => {
    switch (renderedView) {
      case "tasks":
        return tasksLoading && renderedView === "tasks"
          ? "Loading tasks..."
          : `${activeTasks.length} tasks`;
      case "radar":
        return signalsLoading && renderedView === "radar"
          ? "Loading signals..."
          : `${signals.length} signals`;
      case "projects":
      default:
        return projectsLoading && renderedView === "projects"
          ? "Loading projects..."
          : `${projects.length} projects`;
    }
  })();

  const indicatorWidth = tabIndicator.width || 80;
  const indicatorOffset = tabIndicator.offset || 0;

  const listAnimationClass = isListExiting
    ? transitionDirection === "right"
      ? "radar-list-slide-exit-right"
      : "radar-list-slide-exit-left"
    : isListEntering
      ? transitionDirection === "right"
        ? "radar-list-slide-enter-from-right"
        : "radar-list-slide-enter-from-left"
      : "";

  return (
    <>
      <main className="flex h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <aside
          className="relative flex h-full flex-col border-r border-[rgba(232,227,216,0.08)] bg-[var(--bg-sidebar)]"
          style={{ flex: "0 0 clamp(320px, 33.333%, 500px)" }}
        >
          <div className="flex h-full flex-col px-6 py-8 pr-9">
          <div className="text-[32px] font-bold uppercase tracking-[-0.02em] text-[var(--text-primary)]">RADAR</div>

          <div
            ref={tabListRef}
            className="relative mt-8 flex border-b border-[rgba(232,227,216,0.1)]"
          >
            {tabs.map((view) => (
              <button
                key={view.id}
                ref={(node) => {
                  tabRefs.current[view.id] = node;
                }}
                type="button"
                onClick={() => setActiveView(view.id)}
                className={`flex h-10 flex-1 items-center justify-center px-5 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors duration-300 ${
                  activeView === view.id
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {view.label}
              </button>
            ))}
            <span
              className="pointer-events-none absolute bottom-0 left-0 h-[3px] bg-[var(--accent-tropical-indigo)] transition-[transform,width] duration-[400ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
              style={{ width: `${indicatorWidth}px`, transform: `translateX(${indicatorOffset}px)` }}
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              {listLabel}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-11 items-center gap-2 rounded-none border border-[rgba(232,227,216,0.12)] bg-transparent px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
              >
                <span>Due Date</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-11 items-center gap-2 rounded-none border border-[rgba(232,227,216,0.12)] bg-transparent px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
              >
                <span>Priority</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex-1 overflow-hidden">
            <div
              ref={sidebarScrollRef}
              className="h-full overflow-y-auto pr-1"
              style={{ overscrollBehaviorY: "contain", WebkitOverflowScrolling: "touch" }}
            >
              <div
                className={`flex flex-col ${listAnimationClass}`}
                style={{ gap: "4px" }}
              >
                {renderedView === "tasks" ? (
                  tasksLoading ? (
                    <p className="text-[14px] text-[var(--text-secondary)]">Loading tasks...</p>
                  ) : activeTasks.length ? (
                    activeTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        {...task}
                        backBurneredAt={task.backBurneredAt ?? null}
                        variant="sidebar"
                        onSelect={handleOpenTaskSubchat}
                        onComplete={handleCompleteTask}
                        isCompleting={completingTaskId === task.id}
                        onBackBurner={handleTaskBackBurner}
                      />
                    ))
                  ) : (
                    <p className="text-[14px] text-[var(--text-secondary)]">No active tasks.</p>
                  )
                ) : renderedView === "radar" ? (
                  signalsLoading ? (
                    <p className="text-[14px] text-[var(--text-secondary)]">Loading signals...</p>
                  ) : signals.length ? (
                    signals.map((signal) => (
                      <SignalCard
                        key={signal.id}
                        {...signal}
                        onSelect={handleOpenSignal}
                      />
                    ))
                  ) : (
                    <p className="text-[14px] text-[var(--text-secondary)]">No VIP signals yet.</p>
                  )
                ) : projectsLoading ? (
                  <p className="text-[14px] text-[var(--text-secondary)]">Loading projects...</p>
                ) : projects.length ? (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleOpenProjectSubchat(project.id)}
                      className="group relative flex w-full cursor-pointer items-center gap-4 rounded-lg bg-[var(--bg-surface)] px-5 py-4 text-left text-[var(--text-primary)] shadow-[0_6px_20px_rgba(0,0,0,0.32),0_0_0_1px_rgba(255,255,255,0.02)] transition-all duration-250 ease-[cubic-bezier(0.65,0,0.35,1)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_14px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-[rgba(232,227,216,0.75)]">
                        <Folder className="h-5 w-5" />
                      </span>
                      <div className="flex flex-1 flex-col gap-1">
                        <h3 className="text-[16px] font-semibold leading-tight tracking-[-0.01em]">{project.name}</h3>
                        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
                          <span>{project.taskCount} tasks</span>
                          <span className="h-1 w-1 rounded-full bg-[rgba(232,227,216,0.4)]"></span>
                          <span>{project.lastActivity}</span>
                        </div>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.12)] text-[var(--text-primary)] transition-transform duration-250 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-[14px] text-[var(--text-secondary)]">No active projects.</p>
                )}
              </div>
              {renderedView === "tasks" && completedTasks.length ? (
                <div
                  className="mt-6 flex flex-col"
                  style={{ gap: "6px" }}
                  data-completed-section="true"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(232,227,216,0.45)]">
                    Completed
                  </div>
                  <div className="flex flex-col" style={{ gap: "3px" }}>
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      {...task}
                      backBurneredAt={task.backBurneredAt ?? null}
                      variant="completed"
                      onUncomplete={handleUncompleteTask}
                      onSelect={handleOpenTaskSubchat}
                      showBackBurner={false}
                    />
                  ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBackBurnerOpen((prev) => !prev)}
            className={`mt-6 flex items-center justify-between border-t border-[rgba(232,227,216,0.12)] pt-4 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200 ${
              backBurnerPulse ? "text-[var(--accent-tomato)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>Back Burner ({backBurnerTasks.length})</span>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${isBackBurnerOpen ? "rotate-90" : ""}`}
            />
          </button>
          {isBackBurnerOpen ? (
            backBurnerTasks.length ? (
              <div className="mt-3 flex flex-col" style={{ gap: "3px" }}>
                {backBurnerTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    {...task}
                    backBurneredAt={task.backBurneredAt ?? null}
                    variant="sidebar"
                    onSelect={handleOpenTaskSubchat}
                    showBackBurner={false}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-[rgba(232,227,216,0.12)] bg-[rgba(255,255,255,0.04)] p-4 text-[13px] leading-[1.6] text-[var(--text-secondary)]">
                Snoozed items live here. Reopen whenever you want to revisit them.
              </div>
            )
          ) : null}

          <button
            type="button"
            onClick={() => setIsIgnoredOpen((prev) => !prev)}
            className={`mt-4 flex items-center justify-between border-t border-[rgba(232,227,216,0.12)] pt-4 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200 ${
              ignoredPulse ? "text-[var(--accent-tropical-indigo)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>Ignored ({ignoredTasks.length})</span>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${isIgnoredOpen ? "rotate-90" : ""}`}
            />
          </button>
          {isIgnoredOpen ? (
            ignoredTasks.length ? (
              <div className="mt-3 flex flex-col" style={{ gap: "3px" }}>
                {ignoredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    {...task}
                    variant="sidebar"
                    onSelect={handleOpenTaskSubchat}
                    showBackBurner={false}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-[rgba(232,227,216,0.12)] bg-[rgba(255,255,255,0.04)] p-4 text-[13px] leading-[1.6] text-[var(--text-secondary)]">
                Ignored tasks will collect here if you need to revisit them later.
              </div>
            )
          ) : null}

          <div className="mt-auto pt-5">
            <div className="border-t border-[rgba(232,227,216,0.12)] pt-4">
              <button
                type="button"
                onClick={() => router.push("/settings")}
                className="flex w-full items-center gap-3 rounded-none px-0 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-[rgba(232,227,216,0.72)]">
                  <Settings className="h-4 w-4" />
                </span>
                <span>Settings</span>
              </button>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-tomato)] text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1C1A17]">
                  JM
                </div>
                <div className="leading-tight">
                  <div className="text-[15px] font-semibold text-[var(--text-primary)]">Jason Miller</div>
                  <div className="text-[12px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">jason@hungry.llc</div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </aside>

        <section className="flex h-full flex-1 flex-col border-l border-[rgba(232,227,216,0.08)] bg-[var(--bg-surface)] max-w-full overflow-hidden">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-16 pt-1 pb-1">
            {messagesLoading ? (
              <p className="text-[14px] text-[var(--text-secondary)]">Loading conversation...</p>
            ) : nonActionMessages.length ? (
              nonActionMessages.map((message) => (
                <ChatMessage
                  key={message.id}
                  {...message}
                  onOpenTask={handleOpenTaskSubchat}
                  onOpenProject={handleOpenProjectSubchat}
                  onSnoozeAction={showSnoozePrompt}
                  onBackBurner={handleBackBurnerAction}
                  onMarkRead={markMessageAsRead}
                  onSnoozeOptionSelect={handleSnoozeOptionSelect}
                  onSnoozeCustomSelect={handleSnoozeCustomSelect}
                  onRescheduleAction={handleRescheduleAction}
                  onRescheduleOptionSelect={handleRescheduleOptionSelect}
                  onCompleteTask={handleCompleteTask}
                />
              ))
            ) : (
              <p className="text-[14px] text-[var(--text-secondary)]">No messages yet.</p>
            )}
          </div>
          <div className="px-6 pb-6 max-w-full">
            <CommitmentDock onTaskUpdate={handleDockTaskUpdate} />
            <div className="mb-4 flex flex-wrap gap-2">
              {suggestionPills.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  className="rounded-none border border-[rgba(232,227,216,0.12)] bg-transparent px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--accent-tropical-indigo)] hover:text-[var(--text-primary)]"
                >
                  {pill}
                </button>
              ))}
            </div>
            <ChatInput onSend={handleSendMessage} />
          </div>
        </section>
      </main>
      {activeSubchat ? (
        <SubchatOverlay onClose={closeSubchat}>
          {activeSubchat.type === "task" ? (
            <TaskSubchat
              taskId={activeSubchat.id}
              onClose={closeSubchat}
              onOpenTask={handleOpenTaskSubchat}
            />
          ) : (
            <ProjectSubchat
              projectId={activeSubchat.id}
              onClose={closeSubchat}
              onOpenTask={handleOpenTaskSubchat}
            />
          )}
        </SubchatOverlay>
      ) : null}
    </>
  );
}
