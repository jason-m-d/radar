"use client";

import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Folder,
  Link,
  Mail,
  User
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import TaskCard from "@/components/TaskCard";

type TaskSubchatProps = {
  taskId: string;
  onClose: () => void;
  onOpenTask?: (taskId: string) => void;
};

type Message = {
  id: string;
  message: string;
  isUser: boolean;
  timestamp?: string;
};

type EmailMessage = {
  id: string;
  sender: string;
  senderInitials: string;
  timestamp: string;
  subject: string;
  body: string;
};

type EmailThreadGroup = {
  subject: string;
  messages: EmailMessage[];
};

const chatSuggestionPills = [
  "Send update to Steve",
  "Draft reconciliation summary",
  "Share updated spreadsheet"
];

const emailThread: EmailMessage[] = [
  {
    id: "email-1",
    sender: "Steve M.",
    senderInitials: "SM",
    timestamp: "Thu, Oct 3 · 8:14 AM",
    subject: "Need Q1 reconciliation by Friday",
    body:
      "Hey Jason — can you confirm the marketing spend reconciliation by Friday? Finance wants this before the board prep on Monday."
  },
  {
    id: "email-2",
    sender: "Jason Miller",
    senderInitials: "JM",
    timestamp: "Thu, Oct 3 · 8:24 AM",
    subject: "Re: Need Q1 reconciliation by Friday",
    body: "Got it. Pulling data from Looker now — will draft a summary for you shortly."
  },
  {
    id: "email-3",
    sender: "Steve M.",
    senderInitials: "SM",
    timestamp: "Thu, Oct 3 · 8:31 AM",
    subject: "Re: Need Q1 reconciliation by Friday",
    body: "Appreciate it. Ping me if you need updated vendor invoices."
  }
];

type TaskFilter = "all" | "action-needed" | "waiting";

const relatedTasks = [
  {
    id: "task-21",
    title: "Reconcile campaign spend",
    dueDate: "Due Oct 4",
    status: "action-needed" as const,
    priority: 1,
    waitingOn: "Finance",
    category: "Marketing"
  },
  {
    id: "task-22",
    title: "Upload revised forecast",
    dueDate: "Due Oct 6",
    status: "waiting" as const,
    priority: 2,
    waitingOn: "Ops",
    category: "Finance"
  }
];

const headerMessages: Message[] = [
  {
    id: "task-message-1",
    message:
      "Quick heads-up: Finance needs a clean reconciliation before the board readout. I highlighted the anomalies in rows 18-26 for you.",
    isUser: false,
    timestamp: "Today, 9:28 AM"
  },
  {
    id: "task-message-2",
    message: "I’ll start by confirming campaign totals vs. ledger entries.",
    isUser: true
  }
];

const TaskSubchat = ({ taskId, onClose, onOpenTask }: TaskSubchatProps) => {
  const [messages, setMessages] = useState<Message[]>(headerMessages);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const emailThreadGroups = useMemo<EmailThreadGroup[]>(() => {
    const grouped = new Map<string, EmailMessage[]>();
    emailThread.forEach((message) => {
      const subject = message.subject;
      if (!grouped.has(subject)) {
        grouped.set(subject, []);
      }
      grouped.get(subject)!.push(message);
    });
    return Array.from(grouped.entries()).map(([subject, messages]) => ({
      subject,
      messages
    }));
  }, []);
  const [threadOpenState, setThreadOpenState] = useState<Record<string, boolean>>({
    __related_tasks: true
  });

  useEffect(() => {
    setMessages(headerMessages);
    setIsEmailOpen(false);
    setContentOpen(false);
    setTimelineOpen(false);
    setThreadOpenState(() => {
      const base = emailThreadGroups.reduce<Record<string, boolean>>((acc, thread) => {
        acc[thread.subject] = true;
        return acc;
      }, {});
      base.__related_tasks = true;
      return base;
    });
  }, [taskId, emailThreadGroups]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onClose]);

  const handleSendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `task-message-${Date.now()}`,
        message: trimmed,
        isUser: true
      }
    ]);
  }, []);

  const toggleThreadGroup = useCallback((subject: string) => {
    setThreadOpenState((prev) => ({
      ...prev,
      [subject]: !prev[subject]
    }));
  }, []);

  const sectionChevron = (expanded: boolean) => (
    <ChevronRight
      className={`h-4 w-4 text-[#E2E8DD]/60 transition-transform duration-200 ${
        expanded ? "rotate-90" : ""
      }`}
    />
  );

  const filteredRelatedTasks = useMemo(() => {
    if (taskFilter === "all") {
      return relatedTasks;
    }

    return relatedTasks.filter((task) => task.status === taskFilter);
  }, [taskFilter]);

  const detailStacks = useMemo(
    () => (
      <div className="mt-6 space-y-6 text-sm text-[#E2E8DD]/70">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-[#E2E8DD]">
          <span className="flex h-2 w-2 rounded-full bg-[#DB4C40]"></span>
          <span className="text-xs font-semibold uppercase tracking-wide text-[#DB4C40]">
            Action needed
          </span>
        </div>
        <div className="space-y-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-[#E2E8DD]/60">Due</span>
            <span className="font-medium text-[#E2E8DD]">Friday, Oct 4</span>
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            {["326", "451", "895"].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-[#E2E8DD]/80"
              >
                #{tag}
              </span>
            ))}
          </div>
          <div className="space-y-2">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-[#E2E8DD]/60">Priority</span>
              <span className="font-medium text-[#E2E8DD]">High</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#E2E8DD]/60">Assignee</span>
              <span className="inline-flex items-center gap-2 font-medium text-[#E2E8DD]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DB4C40] text-xs font-semibold text-[#0F0E0E]">
                  JM
                </span>
                Jason Miller
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-[#E2E8DD] transition hover:bg-white/10"
        >
          <span className="inline-flex items-center gap-2">
            <Folder className="h-4 w-4 text-[#E2E8DD]/70" />
            Q1 Financial Close
          </span>
          <ArrowRight className="h-4 w-4 text-[#E2E8DD]/60" />
        </button>

        <div className="space-y-2">
          <div className="rounded-lg border border-white/10 bg-white/5">
            <button
              type="button"
              onClick={() =>
                setThreadOpenState((prev) => ({
                  ...prev,
                  __related_tasks: !prev.__related_tasks
                }))
              }
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[#E2E8DD] transition hover:bg-white/10"
            >
              <span className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-[#E2E8DD]/70" /> Related Tasks ({relatedTasks.length})
              </span>
              {sectionChevron(Boolean(threadOpenState.__related_tasks ?? true))}
            </button>
            <div
              className="space-y-2 overflow-hidden px-1 py-2 transition-all duration-200 ease-out"
              style={{
                maxHeight: threadOpenState.__related_tasks ?? true ? 400 : 0,
                opacity: threadOpenState.__related_tasks ?? true ? 1 : 0
              }}
            >
              <div className="mb-2 flex flex-wrap gap-2 px-2">
                {(["all", "action-needed", "waiting"] as TaskFilter[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTaskFilter(option)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      taskFilter === option
                        ? "bg-[#2A2928] text-[#E2E8DD]"
                        : "text-[#E2E8DD]/60"
                    }`}
                  >
                    {option === "all"
                      ? "All"
                      : option === "action-needed"
                      ? "Action Needed"
                      : "Waiting"}
                  </button>
                ))}
              </div>
              <div className="max-h-[500px] min-h-[320px] space-y-2 overflow-y-auto pr-1">
                {filteredRelatedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    {...task}
                    onSelect={onOpenTask}
                    className="mb-3"
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEmailOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left text-sm text-[#E2E8DD] transition hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#E2E8DD]/70" />
              View Email Thread <span className="text-xs text-[#E2E8DD]/60">(4 messages)</span>
            </span>
            {sectionChevron(isEmailOpen)}
          </button>

          <button
            type="button"
            onClick={() => setContentOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left text-sm text-[#E2E8DD] transition hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-2">
              <Link className="h-4 w-4 text-[#E2E8DD]/70" />
              Content
            </span>
            {sectionChevron(contentOpen)}
          </button>
          <div
            className="overflow-hidden text-xs text-[#E2E8DD]/60 transition-all duration-200 ease-out"
            style={{ maxHeight: contentOpen ? 160 : 0, opacity: contentOpen ? 1 : 0 }}
          >
            <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2">
                  <Download className="h-3.5 w-3.5 text-[#E2E8DD]/50" />
                  marketing_spend_q1.csv
                </span>
                <span className="text-[#E2E8DD]/40">32 KB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2">
                  <Download className="h-3.5 w-3.5 text-[#E2E8DD]/50" />
                  vendor_invoices.zip
                </span>
                <span className="text-[#E2E8DD]/40">2.1 MB</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTimelineOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left text-sm text-[#E2E8DD] transition hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#E2E8DD]/70" />
              Timeline
            </span>
            {sectionChevron(timelineOpen)}
          </button>
          <div
            className="overflow-hidden text-xs text-[#E2E8DD]/60 transition-all duration-200 ease-out"
            style={{ maxHeight: timelineOpen ? 140 : 0, opacity: timelineOpen ? 1 : 0 }}
          >
            <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[#E2E8DD]">
                  <Clock className="h-3.5 w-3.5 text-[#E2E8DD]/50" />
                  Kickoff
                </span>
                <span className="text-[#E2E8DD]/40">Oct 1, 8:00 AM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[#E2E8DD]">
                  <Clock className="h-3.5 w-3.5 text-[#E2E8DD]/50" />
                  Draft reconciliation
                </span>
                <span className="text-[#E2E8DD]/40">Oct 3, 5:00 PM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[#E2E8DD]">
                  <Clock className="h-3.5 w-3.5 text-[#E2E8DD]/50" />
                  Final review
                </span>
                <span className="text-[#E2E8DD]/40">Oct 4, 3:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    [contentOpen, timelineOpen, threadOpenState, onOpenTask]
  );

  return (
    <div className="relative flex h-full w-full bg-[#0F0E0E] text-[#E2E8DD]">
      <button
        type="button"
        onClick={onClose}
        className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-[#E2E8DD] transition hover:bg-white/20"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <aside className="flex h-full w-[400px] flex-col bg-[#1E1E1E] px-6 pb-6 pt-20">
        <div>
          <h2 className="text-lg font-semibold text-[#E2E8DD]">
            Submit Q1 marketing reconciliation
          </h2>
          <p className="mt-2 text-sm text-[#E2E8DD]/70">
            Collect campaign spend actuals, flag anomalies, and deliver the final spreadsheet to Finance.
          </p>
        </div>

        {detailStacks}

        <div className="mt-auto space-y-3 pt-6">
          <button
            type="button"
            className="radar-primary-button w-full justify-center"
            style={{
              ["--button-background" as const]: "var(--accent-forest-green)",
              ["--button-shadow" as const]: "0 12px 28px rgba(77, 144, 66, 0.38)",
              ["--button-focus-outline" as const]: "rgba(77, 144, 66, 0.45)",
            }}
          >
            Complete Task
          </button>
          <button
            type="button"
            className="w-full rounded-none border border-[rgba(232,227,216,0.15)] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--accent-tropical-indigo)] hover:text-[var(--text-primary)]"
          >
            Snooze
          </button>
          <button
            type="button"
            className="w-full text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
          >
            Move to Back Burner
          </button>
        </div>
      </aside>

      <div
        className="flex h-full flex-shrink-0 flex-col bg-[#1E1E1E] pt-20"
        style={{
          width: isEmailOpen ? "400px" : "0px",
          opacity: isEmailOpen ? 1 : 0,
          overflow: "hidden",
          pointerEvents: isEmailOpen ? "auto" : "none",
          transition:
            "width 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 350ms ease"
        }}
      >
        <div className="px-6">
          <h3 className="text-sm font-semibold text-[#E2E8DD]">Email Thread</h3>
          <p className="text-xs text-[#E2E8DD]/50">{emailThread.length} messages</p>
        </div>
        <div className="mt-4 flex-1 space-y-4 overflow-y-auto px-6 pb-6">
          {emailThreadGroups.map((thread) => {
            const isThreadOpen = threadOpenState[thread.subject] ?? true;
            return (
              <div key={thread.subject} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <button
                  type="button"
                  onClick={() => toggleThreadGroup(thread.subject)}
                  className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left text-sm text-[#E2E8DD] transition hover:bg-white/10"
                >
                  <span className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#E2E8DD]">
                      {thread.subject}
                    </span>
                    <span className="text-xs text-[#E2E8DD]/60">
                      {thread.messages.length} messages
                    </span>
                  </span>
                  {sectionChevron(Boolean(isThreadOpen))}
                </button>
                <div
                  className="mt-2 space-y-3 overflow-hidden transition-all duration-200 ease-out"
                  style={{
                    maxHeight: isThreadOpen ? 600 : 0,
                    opacity: isThreadOpen ? 1 : 0
                  }}
                >
                  {thread.messages.map((email) => (
                    <div key={email.id} className="relative rounded-lg border border-white/10 bg-[#1E1E1E] p-4">
                      <div className="flex items-start justify-between pr-8">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DB4C40] text-sm font-semibold text-[#0F0E0E]">
                            {email.senderInitials}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#E2E8DD]" title={email.sender}>
                              {email.sender}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-[#E2E8DD]/60 whitespace-nowrap">
                          {email.timestamp}
                        </span>
                      </div>
                      <button
                        type="button"
                        title="Open in Gmail"
                        onClick={() => console.log("Open in Gmail:", email.id)}
                        className="radar-icon-button absolute right-3 top-3"
                        style={{
                          ["--icon-background" as const]: "rgba(255, 255, 255, 0.08)",
                          ["--icon-hover-background" as const]: "rgba(158, 135, 235, 0.22)",
                          ["--icon-hover-shadow" as const]: "0 0 14px rgba(158, 135, 235, 0.35)",
                          ["--icon-focus-outline" as const]: "rgba(158, 135, 235, 0.45)",
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <p className="mt-3 text-sm leading-relaxed text-[#E2E8DD]/80">
                        {email.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section className="flex h-full min-w-0 flex-1 flex-col bg-[#0F0E0E] pt-16">
        <header className="px-10">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#E2E8DD]/40">Task</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#E2E8DD]">Submit Q1 marketing reconciliation</h1>
            <div className="mt-3 inline-flex items-center gap-3 text-xs text-[#E2E8DD]/60">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#DB4C40]"></span>
                Action needed
              </span>
              <span>Due Friday, Oct 4</span>
              <span className="inline-flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-[#E2E8DD]/50" /> Jason Miller
              </span>
            </div>
          </div>
        </header>

        <div className="mt-8 flex flex-1 flex-col px-10 pb-8">
          <div className="flex-1 overflow-y-auto">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} {...msg} onOpenTask={onOpenTask} />
            ))}
          </div>
          <div className="mt-6 pb-2">
            <div className="mb-4 flex flex-wrap gap-2">
              {chatSuggestionPills.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-[#E2E8DD]/60 transition hover:bg-white/10"
                >
                  {pill}
                </button>
              ))}
            </div>
            <ChatInput onSend={handleSendMessage} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default TaskSubchat;
